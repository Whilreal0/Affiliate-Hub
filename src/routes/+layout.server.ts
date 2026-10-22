import { getSessionCookie } from 'better-auth/cookies';
import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
  const { request, url, depends, setHeaders } = event;
  depends('app:session');
  setHeaders({ 'cache-control': 'private, no-store' });
  const signedOut = { authState: { isAuthenticated: false }, authUser: null };
  if (!env.PUBLIC_CONVEX_URL || !getSessionCookie(request)) return signedOut;

  try {
    // Validate the existing HttpOnly cookie before rendering. Never serialize
    // session tokens or cache one user's account in shared server state.
    // Call the proxy directly: load's fetch would embed the full auth response
    // in hydration HTML, including the session token.
    const handler = createSvelteKitHandler({
      convexSiteUrl: env.PUBLIC_CONVEX_SITE_URL || undefined
    });
    const response = await handler.GET({
      ...event,
      request: new Request(new URL('/api/auth/get-session', url), {
        headers: request.headers,
        signal: AbortSignal.timeout(8000)
      })
    });
    if (!response.ok) return { authState: undefined, authUser: null };
    const session = await response.json();
    if (
      !session?.user?.id ||
      session.session?.userId !== session.user.id ||
      !(Date.parse(session.session?.expiresAt) > Date.now())
    )
      return signedOut;
    return {
      authState: { isAuthenticated: true },
      authUser: { id: String(session.user.id), name: String(session.user.name ?? '') }
    };
  } catch {
    // A transient server connection failure can recover through the browser.
    return { authState: undefined, authUser: null };
  }
};
