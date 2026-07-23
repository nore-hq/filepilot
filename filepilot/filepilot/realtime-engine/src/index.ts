import { Env, ChatRoom } from "./ChatRoom";

// Export the Durable Object class so Cloudflare can bind to it
export { ChatRoom };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Simple routing
    if (url.pathname.startsWith("/room/")) {
      // Extract room ID from URL, e.g., /room/123
      const roomId = url.pathname.split("/")[2];

      if (!roomId) {
        return new Response("Room ID is required", { status: 400 });
      }

      // Generate a unique ID for the Durable Object based on the room name
      const id = env.CHAT_ROOM.idFromName(roomId);
      
      // Get the Durable Object stub for that ID
      const room = env.CHAT_ROOM.get(id);

      // Forward the request to the Durable Object
      return room.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
