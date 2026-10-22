import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const origin = 'https://netlify-smoke.example';
const token = 'netlify-test-only-session';
const authServer = createServer((request, response) => {
  response.setHeader('Content-Type', 'application/json');
  if (request.url.startsWith('/api/auth/get-session')) {
    const signedIn = request.headers.cookie?.includes('better-auth.session_token=smoke-session');
    response.end(
      JSON.stringify(
        signedIn
          ? {
              user: { id: 'smoke-user', name: 'Netlify smoke tester' },
              session: {
                id: 'smoke-session-id',
                userId: 'smoke-user',
                token,
                expiresAt: new Date(Date.now() + 3600000).toISOString()
              }
            }
          : null
      )
    );
    return;
  }
  if (request.url === '/api/auth/sign-in/social') {
    const callback = `https://${request.headers['x-better-auth-forwarded-host']}/api/auth/callback/google`;
    response.end(
      JSON.stringify({
        url: `https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=${encodeURIComponent(callback)}`
      })
    );
    return;
  }
  response.writeHead(404).end('{}');
});

await new Promise((resolve) => authServer.listen(0, '127.0.0.1', resolve));
try {
  process.env.PUBLIC_CONVEX_URL = 'https://auth-test.convex.cloud';
  process.env.PUBLIC_CONVEX_SITE_URL = `http://127.0.0.1:${authServer.address().port}`;
  const { default: handler } = await import('../.netlify/functions-internal/sveltekit-render.mjs');
  const context = { ip: '127.0.0.1' };
  for (const path of ['/', '/community', '/settings', '/admin']) {
    const response = await handler(new Request(`${origin}${path}`), context);
    assert.equal(response.status, 200, `SSR route ${path}`);
  }
  const session = await handler(new Request(`${origin}/api/auth/get-session`), context);
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);

  const account = await handler(
    new Request(`${origin}/more`, {
      headers: { cookie: 'better-auth.session_token=smoke-session' }
    }),
    context
  );
  const html = await account.text();
  assert.equal(account.status, 200);
  assert.match(html, /Netlify smoke tester/);
  assert.match(html, /Sign out/);
  assert.doesNotMatch(html, /Checking session/);
  assert.ok(!html.includes(token), 'Session tokens must not enter SSR HTML');
  assert.match(account.headers.get('cache-control'), /no-store/);

  const login = await handler(
    new Request(`${origin}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({ provider: 'google', callbackURL: origin, disableRedirect: true })
    }),
    context
  );
  assert.equal(login.status, 200);
  assert.equal(
    new URL((await login.json()).url).searchParams.get('redirect_uri'),
    `${origin}/api/auth/callback/google`
  );
  for (const file of [
    'build/manifest.webmanifest',
    'build/service-worker.js',
    'build/offline.html'
  ]) {
    assert.ok(readFileSync(file).length > 0, `${file} is included`);
  }
  console.log(
    'Netlify function smoke checks passed: SSR pages, auth proxy, session restoration, callback host, and PWA assets.'
  );
} finally {
  await new Promise((resolve) => authServer.close(resolve));
}
