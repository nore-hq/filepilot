import { Env, ChatRoom } from "./ChatRoom";

// Export the Durable Object class so Cloudflare can bind to it
export { ChatRoom };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight for broadcast endpoint
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Route: /chat/:projectId — WebSocket upgrade
    // Route: /chat/:projectId/broadcast — HTTP POST broadcast
    const chatMatch = url.pathname.match(/^\/chat\/([^/]+)(\/broadcast)?$/);
    if (chatMatch) {
      const projectId = chatMatch[1];

      if (!projectId) {
        return new Response("Project ID is required", { status: 400 });
      }

      // Generate a unique Durable Object ID based on the project ID
      const id = env.CHAT_ROOM.idFromName(projectId);
      const room = env.CHAT_ROOM.get(id);

      // Forward the request to the Durable Object
      return room.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  },
};
