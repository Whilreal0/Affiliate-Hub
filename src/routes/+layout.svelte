<script lang="ts">
  import '../app.css';
  import '../theme.css';
  import { env } from '$env/dynamic/public';
  import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
  import { authClient } from '$lib/auth-client';
  let { children, data } = $props();
  if (env.PUBLIC_CONVEX_URL)
    createSvelteAuthClient({
      authClient,
      convexUrl: env.PUBLIC_CONVEX_URL,
      getServerState: () => data.authState
    });
</script>

{@render children()}
