import { createSvelteKitHandler } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { env } from '$env/dynamic/public';
import { json, type RequestHandler } from '@sveltejs/kit';
const handler = createSvelteKitHandler({ convexSiteUrl: env.PUBLIC_CONVEX_SITE_URL || undefined });
const unavailable = () =>
  json(
    { message: 'Configure PUBLIC_CONVEX_URL and your Convex Google credentials first.' },
    { status: 503 }
  );
export const GET: RequestHandler = (event) =>
  env.PUBLIC_CONVEX_URL ? handler.GET(event) : unavailable();
export const POST: RequestHandler = (event) =>
  env.PUBLIC_CONVEX_URL ? handler.POST(event) : unavailable();
