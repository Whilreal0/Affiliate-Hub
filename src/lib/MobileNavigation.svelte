<script lang="ts">
  import { Ellipsis, Globe, LayoutGrid, Link, Sparkles } from '@lucide/svelte';
  import type { WorkspaceView } from './types';
  let { view }: { view: WorkspaceView } = $props();
  const promptsActive = $derived(['prompts', 'text-to-image', 'image-to-video'].includes(view));
  const moreActive = $derived(['more', 'favorites', 'settings', 'admin'].includes(view));
</script>

<nav class="mobile-navigation" aria-label="Mobile navigation">
  <a
    href="/"
    class:active={view === 'overview'}
    aria-current={view === 'overview' ? 'page' : undefined}
    ><span><LayoutGrid size={18} /></span>Home</a
  >
  <a
    href="/community"
    class:active={view === 'community'}
    aria-current={view === 'community' ? 'page' : undefined}
    ><span><Globe size={18} /></span>Community</a
  >
  <a
    href="/links"
    class:active={view === 'links'}
    aria-current={view === 'links' ? 'page' : undefined}><span><Link size={18} /></span>Links</a
  >
  <a href="/prompts" class:active={promptsActive} aria-current={promptsActive ? 'page' : undefined}
    ><span><Sparkles size={18} /></span>Prompts</a
  >
  <a href="/more" class:active={moreActive} aria-current={moreActive ? 'page' : undefined}
    ><span><Ellipsis size={18} /></span>More</a
  >
</nav>
