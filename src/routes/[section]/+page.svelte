<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Workspace from '$lib/Workspace.svelte';
  import CloudWorkspace from '$lib/CloudWorkspace.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const titles = {
    links: 'Affiliate links',
    prompts: 'Prompts',
    more: 'More',
    favorites: 'Favorites',
    settings: 'Settings',
    'text-to-image': 'Text to image',
    'image-to-video': 'Image to video'
  };
</script>

<svelte:head><title>{titles[data.section]} — Linkcraft</title></svelte:head>
{#key data.section}
  {#if env.PUBLIC_CONVEX_URL}<CloudWorkspace initialView={data.section} />{:else}<Workspace
      initialView={data.section}
    />{/if}
{/key}
