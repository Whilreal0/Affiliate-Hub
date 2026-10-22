<script lang="ts">
  import { env } from '$env/dynamic/public';
  import Workspace from '$lib/Workspace.svelte';
  import CloudWorkspace from '$lib/CloudWorkspace.svelte';
</script>

<svelte:head
  ><title>Super Admin — Linkcraft</title><meta
    name="robots"
    content="noindex, nofollow"
  /></svelte:head
>
{#if env.PUBLIC_CONVEX_URL}<CloudWorkspace initialView="admin" />{:else}<Workspace
    initialView="admin"
  />{/if}
