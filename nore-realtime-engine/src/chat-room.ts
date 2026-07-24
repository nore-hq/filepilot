export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ChatMessage {
  project_id: string;
  sender_role: string;
  target_role: string;
  message_text: string;
}

export class ChatRoom {
  state: DurableObjectState;
  env: Env;
  sessions: Map<WebSocket, { role: string }>;
  messageQueue: ChatMessage[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.messageQueue = [];
  }

  async fetch(request: Request) {
    if (request.method === 'POST') {
      try {
        const data = await request.json() as any;
        
        // Use a dummy sender object since we don't have a real WebSocket for POST
        const dummySender = {} as WebSocket;
        
        switch (data.type) {
          case 'progress':
            await this.handleProgressUpdate(dummySender, data);
            break;
          case 'delivery':
            await this.handleDeliveryUpdate(dummySender, data);
            break;
          case 'authority_update':
            await this.handleAuthorityUpdate(dummySender, data);
            break;
          case 'propose_link':
            await this.handleProposeLink(dummySender, data);
            break;
        }
        return new Response('OK');
      } catch (err) {
        return new Response('Error processing broadcast', { status: 500 });
      }
    }

    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket or POST request', { status: 426 });
    }

    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'client';

    const [client, server] = Object.values(new WebSocketPair());

    await this.handleSession(server, role);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(webSocket: WebSocket, role: string) {
    webSocket.accept();
    this.sessions.set(webSocket, { role });

    webSocket.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);

        switch (data.type) {
          case 'chat':
            await this.handleChatMessage(webSocket, data);
            break;
          case 'progress':
            await this.handleProgressUpdate(webSocket, data);
            break;
          case 'delivery':
            await this.handleDeliveryUpdate(webSocket, data);
            break;
          case 'propose_link':
            await this.handleProposeLink(webSocket, data);
            break;
          case 'authority_update':
            await this.handleAuthorityUpdate(webSocket, data);
            break;
        }
      } catch (err) {
        console.error('Failed to process message', err);
      }
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);
    });

    webSocket.addEventListener('error', () => {
      this.sessions.delete(webSocket);
    });
  }

  broadcast(sender: WebSocket, message: any, targetRole?: string) {
    const msgStr = JSON.stringify(message);
    for (const [ws, data] of this.sessions.entries()) {
      if (ws !== sender) {
        // Filter by target role if specified
        if (targetRole && targetRole !== 'all' && data.role !== targetRole) {
          continue;
        }
        try {
          ws.send(msgStr);
        } catch (err) {
          console.error('Failed to send message to client', err);
        }
      }
    }
  }

  async alarm() {
    if (this.messageQueue.length === 0) return;
    const batch = [...this.messageQueue];
    this.messageQueue = [];

    try {
      const response = await fetch(`${this.env.SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': this.env.SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Supabase returned ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      console.error('Batch flush failed, requeuing messages', err);
      this.messageQueue.unshift(...batch);
      await this.state.storage.setAlarm(Date.now() + 5000);
    }
  }

  async handleChatMessage(sender: WebSocket, data: any) {
    // If not specified, default targeted broadcasts:
    // Editors/Clients talk to Admin. Admins specify target.
    let target = data.target_role || 'admin';
    if (data.sender_role === 'editor' && !data.target_role) target = 'admin';
    if (data.sender_role === 'client' && !data.target_role) target = 'admin';

    this.messageQueue.push({
      project_id: data.project_id,
      sender_role: data.sender_role,
      target_role: target,
      message_text: data.message_text,
    });

    const currentAlarm = await this.state.storage.getAlarm();
    if (!currentAlarm) {
      await this.state.storage.setAlarm(Date.now() + 3000);
    }

    this.broadcast(sender, {
      type: 'chat',
      sender_role: data.sender_role,
      target_role: target,
      message_text: data.message_text,
      timestamp: new Date().toISOString(),
    }, target);
  }

  async handleProgressUpdate(sender: WebSocket, data: any) {
    this.broadcast(sender, { type: 'progress', project_id: data.project_id, value: data.value });
    await this.updateSupabaseProject(data.project_id, { progress: data.value });
  }

  async handleDeliveryUpdate(sender: WebSocket, data: any) {
    this.broadcast(sender, { type: 'delivery', project_id: data.project_id, link: data.link });
    await this.updateSupabaseProject(data.project_id, { delivery_link: data.link });
  }

  async handleProposeLink(sender: WebSocket, data: any) {
    // Propose link goes specifically to admin
    this.broadcast(sender, { type: 'propose_link', project_id: data.project_id, link: data.link }, 'admin');
    await this.updateSupabaseProject(data.project_id, { editor_proposed_link: data.link });
  }

  async handleAuthorityUpdate(sender: WebSocket, data: any) {
    this.broadcast(sender, {
      type: 'authority_update',
      project_id: data.project_id,
      editor_can_chat: data.editor_can_chat,
      editor_can_deliver: data.editor_can_deliver
    }, 'editor'); // Tell editor their authority changed

    await this.updateSupabaseProject(data.project_id, {
      editor_can_chat: data.editor_can_chat,
      editor_can_deliver: data.editor_can_deliver
    });
  }

  async updateSupabaseProject(projectId: string, payload: any) {
    try {
      const response = await fetch(`${this.env.SUPABASE_URL}/rest/v1/projects?id=eq.${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': this.env.SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        console.error('Failed to update project in Supabase:', await response.text());
      }
    } catch (err) {
      console.error('Error updating project:', err);
    }
  }
}
