export interface Env {
  CHAT_ROOM: DurableObjectNamespace;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  timestamp: number;
}

export class ChatRoom {
  state: DurableObjectState;
  env: Env;
  // A queue to hold messages before flushing to Supabase
  messageQueue: ChatMessage[] = [];
  
  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    // In a real implementation, you would validate the JWT and extract the user ID here
    // const url = new URL(request.url);
    // const token = url.searchParams.get("token");
    // const userId = await verifySupabaseJWT(token);

    // Create the WebSocket pair
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection and use the hibernation API
    // We attach the user ID (mocked here) to the WebSocket attachment
    this.state.acceptWebSocket(server, ["chat"], { userId: "mock-user-id" });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  // WebSocket Hibernation API Handler: webSocketMessage
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message === 'string') {
      try {
        const data = JSON.parse(message);
        const attachment = this.state.getWebSockets(ws)[0].deserializeAttachment() as any;
        const userId = attachment?.userId || "unknown";

        const chatMsg: ChatMessage = {
          id: crypto.randomUUID(),
          userId: userId,
          content: data.content,
          timestamp: Date.now(),
        };

        // Broadcast to all connected clients in this Durable Object
        const broadcastPayload = JSON.stringify({ type: 'message', message: chatMsg });
        const websockets = this.state.getWebSockets("chat");
        for (const connectedWs of websockets) {
          try {
            connectedWs.send(broadcastPayload);
          } catch (e) {
            // Handle disconnected clients if necessary
          }
        }

        // Add to batch queue
        this.messageQueue.push(chatMsg);

        // Schedule a flush if it's the first message in the queue
        if (this.messageQueue.length === 1) {
          // Schedule an alarm to flush messages to Supabase after 5 seconds
          await this.state.storage.setAlarm(Date.now() + 5000);
        }

      } catch (err) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
      }
    }
  }

  // WebSocket Hibernation API Handler: webSocketClose
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    // Handle cleanup if necessary
    ws.close(code, "Durable Object closing connection");
  }

  // WebSocket Hibernation API Handler: webSocketError
  async webSocketError(ws: WebSocket, error: any) {
    // Handle error
    console.error("WebSocket error:", error);
  }

  // Alarm handler for batch flushing messages to Supabase
  async alarm() {
    if (this.messageQueue.length > 0) {
      const messagesToFlush = [...this.messageQueue];
      this.messageQueue = []; // Clear the queue

      console.log(`Flushing ${messagesToFlush.length} messages to Supabase...`);
      
      // TODO: Implement Supabase insert
      // await fetch(`${this.env.SUPABASE_URL}/rest/v1/chat_messages`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'apikey': this.env.SUPABASE_SERVICE_ROLE_KEY,
      //     'Authorization': `Bearer ${this.env.SUPABASE_SERVICE_ROLE_KEY}`,
      //   },
      //   body: JSON.stringify(messagesToFlush)
      // });
    }
  }
}
