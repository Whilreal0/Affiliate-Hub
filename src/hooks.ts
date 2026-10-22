import { initConvex } from 'convex-svelte/sveltekit';
import { env } from '$env/dynamic/public';
if (env.PUBLIC_CONVEX_URL) initConvex(env.PUBLIC_CONVEX_URL);
