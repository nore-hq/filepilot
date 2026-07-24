import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { ChatRoom, Env } from './chat-room';

// Export the Durable Object class so Cloudflare can bind it
export { ChatRoom };

const app = new Hono<{ Bindings: Env; Variables: { user: any } }>();

// Add CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization', 'Upgrade'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
}));

// Health check endpoint
app.get('/', (c) => c.text('NORE Realtime Engine is running!'));

// Middleware to verify Supabase JWT
app.use('/chat/*', async (c, next) => {
  // Extract token from query param for WebSockets (since headers are tricky in standard browser WS)
  // or use Authorization header if possible
  let token = c.req.query('token');
  
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401);
  }

  try {
    const JWKS = createRemoteJWKSet(new URL(`${c.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
    // Verify the JWT with jose using public keys
    const { payload } = await jwtVerify(token, JWKS);
    
    // Attach user info to the context for later use
    c.set('user', payload);
    
    await next();
  } catch (err) {
    console.error('JWT Verification Failed:', err);
    return c.json({ error: 'Unauthorized: Invalid token' }, 401);
  }
});

// Forward WebSocket upgrades to the Durable Object
app.get('/chat/:roomId', async (c) => {
  const roomId = c.req.param('roomId');
  const upgradeHeader = c.req.header('Upgrade');

  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return c.json({ error: 'Expected Upgrade: websocket' }, 426);
  }

  const id = c.env.CHAT_ROOM.idFromName(roomId);
  const room = c.env.CHAT_ROOM.get(id);
  return room.fetch(c.req.raw);
});

// Fallback POST endpoint for broadcasting without a WebSocket connection
app.post('/chat/:roomId/broadcast', async (c) => {
  const roomId = c.req.param('roomId');
  const id = c.env.CHAT_ROOM.idFromName(roomId);
  const room = c.env.CHAT_ROOM.get(id);
  return room.fetch(c.req.raw);
});

export default app;
