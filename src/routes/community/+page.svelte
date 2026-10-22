<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Workspace from '$lib/Workspace.svelte';
  import CloudWorkspace from '$lib/CloudWorkspace.svelte';
</script>

<svelte:head>
  <title>Community — Linkcraft</title>
  <meta
    name="description"
    content="Discover public AI image and video prompts and affiliate links shared by the Linkcraft community."
  />
</svelte:head>
{#if env.PUBLIC_CONVEX_URL}<CloudWorkspace initialView="community" />{:else}<Workspace
    initialView="community"
  />{/if}
