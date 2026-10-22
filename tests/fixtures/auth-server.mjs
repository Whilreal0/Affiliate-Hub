import { createServer } from 'node:http';

// Local test double; no connection to the real Google or Convex deployment.
createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  if (request.url === '/health') return response.end('{}');
  if (request.url?.startsWith('/api/auth/get-session')) {
    const cookie = request.headers.cookie ?? '';
    const valid = cookie.includes('better-auth.session_token=valid-session');
    const expired = cookie.includes('better-auth.session_token=expired-session');
    if (!valid && !expired) return response.end('null');
    const now = new Date().toISOString();
    return response.end(
      JSON.stringify({
        user: {
          id: 'test-user',
          name: 'Returning Creator',
          email: 'creator@example.com',
          emailVerified: true,
          createdAt: now,
          updatedAt: now
        },
        session: {
          id: 'test-session',
          userId: 'test-user',
          token: 'fixture-session-secret',
          expiresAt: new Date(Date.now() + (expired ? -86400000 : 86400000)).toISOString(),
          createdAt: now,
          updatedAt: now
        }
      })
    );
  }
  response.end('null');
}).listen(4175, '127.0.0.1');
