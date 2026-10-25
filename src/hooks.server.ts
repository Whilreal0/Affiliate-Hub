import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // SvelteKit 2 advisory workaround: disallow protocol-relative action paths.
  if (event.url.pathname.startsWith('//'))
    return new Response('Invalid request path.', { status: 400 });
  const original = await resolve(event);
  // Proxy responses can have immutable headers; preserve cookies while cloning.
  const response = new Response(original.body, {
    status: original.status,
    statusText: original.statusText,
    headers: original.headers
  });
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self'; base-uri 'self'; object-src 'none'"
  );
  return response;
};
