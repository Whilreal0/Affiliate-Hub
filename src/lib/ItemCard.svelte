<script lang="ts">
  import { Check, Clipboard, Globe, Image, Link, Star, Video } from '@lucide/svelte';
  import type { Item } from './types';
  let {
    item,
    copied,
    community = false,
    oncopy,
    onfavorite,
    ondetail
  }: {
    item: Item;
    copied: string;
    community?: boolean;
    oncopy: (item: Item) => void;
    onfavorite: (item: Item) => void;
    ondetail: (item: Item) => void;
  } = $props();
</script>

<article class="item-card">
  <div class="card-top">
    <span
      class="type-pill"
      class:video={item.kind === 'prompt' && item.category === 'image-to-video'}
    >
      {#if item.kind === 'link'}<Link size={12} />AFFILIATE LINK
      {:else if item.category === 'text-to-image'}<Image size={12} />TEXT TO IMAGE
      {:else}<Video size={12} />IMAGE TO VIDEO{/if}
    </span>
    {#if community}<span class="public-badge"><Globe size={13} />Public</span>
    {:else}<button
        class="icon-button star-button"
        class:starred={item.favorite}
        aria-label={item.favorite ? `Unfavorite ${item.title}` : `Favorite ${item.title}`}
        aria-pressed={!!item.favorite}
        onclick={() => onfavorite(item)}
        ><Star size={16} fill={item.favorite ? 'currentColor' : 'none'} /></button
      >{/if}
  </div>
  <button class="card-content" onclick={() => ondetail(item)}>
    <h3>{item.title}</h3>
    <p class:link-content={item.kind === 'link'}>{item.content}</p>
  </button>
  {#if community}<p class="post-author">
      By {item.authorName ?? 'Community member'} · {new Date(
        item.publishedAt ?? item.createdAt
      ).toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}
    </p>
  {:else if item.visibility === 'public'}<p class="public-badge published-label">
      <Globe size={12} />Published to Community
    </p>{/if}
  <div class="card-footer">
    <span class="tool-name"
      ><span class="tiny-dot"></span>{item.tool ||
        (item.kind === 'link' ? 'Affiliate link' : 'Any AI tool')}</span
    >
    <button class="copy-button" class:copied={copied === item._id} onclick={() => oncopy(item)}>
      {#if copied === item._id}<Check size={13} />Copied{:else}<Clipboard size={13} />Copy {item.kind ===
        'link'
          ? 'link'
          : 'prompt'}{/if}
    </button>
  </div>
</article>
