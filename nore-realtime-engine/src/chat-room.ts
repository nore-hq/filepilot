export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export class ChatRoom {
  state: DurableObjectState;
  env: Env;
  sessions: Map<WebSocket, any>;
  messageQueue: any[];

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.messageQueue = [];
  }

  async fetch(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const [client, server] = Object.values(new WebSocketPair());

    await this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async handleSession(webSocket: WebSocket) {
    // Accept the WebSocket connection
    webSocket.accept();

    // Store the session
    this.sessions.set(webSocket, { active: true });

    webSocket.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        
        // Push message to the in-memory queue
        // Ensure data contains: project_id, sender_role, message_text
        this.messageQueue.push({
          project_id: data.project_id,
          sender_role: data.sender_role,
          message_text: data.message_text
        });

        // Set an alarm for 3 seconds in the future to flush, if not already scheduled
        const currentAlarm = await this.state.storage.getAlarm();
        if (!currentAlarm) {
          await this.state.storage.setAlarm(Date.now() + 3000);
        }

        // Broadcast to all other connected clients
        this.broadcast(webSocket, {
          type: 'message',
          content: data.message_text,
          sender_role: data.sender_role,
          timestamp: new Date().toISOString()
        });
        
      } catch (err) {
        // Handle invalid messages
        console.error("Failed to process message", err);
      }
    });

    webSocket.addEventListener('close', () => {
      this.sessions.delete(webSocket);
    });

    webSocket.addEventListener('error', () => {
      this.sessions.delete(webSocket);
    });
  }

  async alarm() {
    if (this.messageQueue.length === 0) return;

    // Snapshot and clear the queue
    const batch = [...this.messageQueue];
    this.messageQueue = [];

    try {
      const response = await fetch(`${this.env.SUPABASE_URL}/rest/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': this.env.SUPABASE_SERVICE_ROLE_KEY,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(batch)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to flush batch to Supabase:', errorText);
        // Put the messages back on the queue to retry
        this.messageQueue.unshift(...batch);
        
        // Retry in 5 seconds
        await this.state.storage.setAlarm(Date.now() + 5000);
      } else {
        console.log(`Successfully flushed ${batch.length} messages.`);
      }
    } catch (err) {
      console.error('Error during flush:', err);
      this.messageQueue.unshift(...batch);
      await this.state.storage.setAlarm(Date.now() + 5000);
    }
  }

  broadcast(sender: WebSocket, message: any) {
    const messageStr = JSON.stringify(message);
    for (const [session] of this.sessions) {
      if (session !== sender) {
        session.send(messageStr);
      }
    }
  }
}
