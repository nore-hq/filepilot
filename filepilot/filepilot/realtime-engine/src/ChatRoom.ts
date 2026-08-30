export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export class ChatRoom {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // ─── HTTP Broadcast endpoint: POST /chat/:projectId/broadcast ───
    if (url.pathname.endsWith("/broadcast") && request.method === "POST") {
      return this.handleHttpBroadcast(request);
    }

    // ─── WebSocket upgrade: GET /chat/:projectId?token=...&role=... ───
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const role = url.searchParams.get("role") || "unknown";

    // Create the WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the connection and tag it with BOTH "chat" (all connections) and the specific role.
    // This lets us query by "chat" for broadcast-to-all, or by role for targeted messages.
    this.state.acceptWebSocket(server, ["chat", role]);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // ─── HTTP Broadcast (fallback when sender isn't connected via WS) ───
  async handleHttpBroadcast(request: Request): Promise<Response> {
    try {
      const data = await request.json() as any;
      const payloadStr = JSON.stringify(data);

      // Route to the right connections
      const targets = this.getTargetConnections(data.target_role, data.sender_role);
      for (const ws of targets) {
        try { ws.send(payloadStr); } catch (_) { /* disconnected */ }
      }

      // Persist to Supabase
      await this.persistPayload(data);

      return new Response("OK", {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "text/plain",
        },
      });
    } catch (err) {
      return new Response("Bad Request", {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  }

  // ─── WebSocket Hibernation API: message handler ───
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string") return;

    try {
      const data = JSON.parse(message);

      // Route the message to the right connections, EXCLUDING the sender
      const targets = this.getTargetConnections(data.target_role, data.sender_role);
      const payloadStr = JSON.stringify(data);

      for (const connectedWs of targets) {
        // Don't echo back to sender (they optimistically add messages client-side)
        if (connectedWs === ws) continue;
        try { connectedWs.send(payloadStr); } catch (_) { /* disconnected */ }
      }

      // Persist to Supabase
      await this.persistPayload(data);

    } catch (err) {
      ws.send(JSON.stringify({ error: "Invalid message format" }));
    }
  }

  // ─── Get the WebSocket connections that should receive a message ───
  getTargetConnections(targetRole: string, senderRole?: string): WebSocket[] {
    // "all" → every connection in the room
    if (targetRole === "all") {
      return this.state.getWebSockets("chat");
    }

    // Targeted message (e.g. admin→client or editor→admin):
    // Send to the target role AND the sender's own role (so other admin tabs see it too)
    const targetWs = this.state.getWebSockets(targetRole);

    if (senderRole && senderRole !== targetRole) {
      const senderWs = this.state.getWebSockets(senderRole);
      // Deduplicate (a connection shouldn't appear twice)
      const seen = new Set(targetWs);
      for (const ws of senderWs) {
        if (!seen.has(ws)) {
          targetWs.push(ws);
        }
      }
    }

    return targetWs;
  }

  // ─── Persist payload to Supabase ───
  async persistPayload(data: any): Promise<void> {
    try {
      switch (data.type) {
        case "chat":
          await this.supabasePost("/rest/v1/messages", {
            project_id: data.project_id,
            sender_role: data.sender_role,
            target_role: data.target_role,
            message_text: data.message_text,
          });
          break;

        case "progress":
          await this.supabasePatch(`/rest/v1/projects?id=eq.${data.project_id}`, {
            progress: data.value,
          });
          break;

        case "delivery":
          await this.supabasePatch(`/rest/v1/projects?id=eq.${data.project_id}`, {
            delivery_link: data.link,
            editor_proposed_link: null,
          });
          break;

        case "propose_link":
          await this.supabasePatch(`/rest/v1/projects?id=eq.${data.project_id}`, {
            editor_proposed_link: data.link,
          });
          break;

        case "authority_update":
          await this.supabasePatch(`/rest/v1/projects?id=eq.${data.project_id}`, {
            editor_can_chat: data.editor_can_chat,
            editor_can_deliver: data.editor_can_deliver,
            ...(data.editor_can_invoice !== undefined && { editor_can_invoice: data.editor_can_invoice }),
          });
          break;
      }
    } catch (err) {
      console.error("Failed to persist payload:", err);
    }
  }

  // ─── Supabase helpers ───
  async supabasePost(path: string, body: Record<string, any>) {
    await fetch(`${this.env.SUPABASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": this.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(body),
    });
  }

  async supabasePatch(path: string, body: Record<string, any>) {
    await fetch(`${this.env.SUPABASE_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": this.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(body),
    });
  }

  // ─── WebSocket Hibernation API: close/error handlers ───
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    ws.close(code, "Connection closed");
  }

  async webSocketError(ws: WebSocket, error: any) {
    console.error("WebSocket error:", error);
  }
}
