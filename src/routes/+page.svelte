<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Workspace from '$lib/Workspace.svelte';
  import CloudWorkspace from '$lib/CloudWorkspace.svelte';
</script>

<svelte:head>
  <title>Linkcraft — Your affiliate workspace</title>
  <meta
    name="description"
    content="Your AI affiliate workflow, all together. Save affiliate links, organize image and video prompts, and copy your next idea."
  />
</svelte:head>
{#if env.PUBLIC_CONVEX_URL}<CloudWorkspace />{:else}<Workspace />{/if}
