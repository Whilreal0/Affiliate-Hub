<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Image, X } from '@lucide/svelte';
  import { preparePreviewImage } from './preview-image';
  let {
    file = $bindable<File | undefined>(),
    dataUrl = $bindable<string | undefined>(),
    processing = $bindable(false),
    error = $bindable(''),
    disabled = false
  }: {
    file?: File;
    dataUrl?: string;
    processing?: boolean;
    error?: string;
    disabled?: boolean;
  } = $props();
  let input: HTMLInputElement;
  let request = 0;
  onDestroy(() => {
    request++;
  });
  function clear() {
    request++;
    file = undefined;
    dataUrl = undefined;
    processing = false;
    error = '';
    input.value = '';
  }
  async function select(event: Event) {
    const selected = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!selected) return;
    const current = ++request;
    processing = true;
    error = '';
    file = undefined;
    dataUrl = undefined;
    try {
      const result = await preparePreviewImage(selected);
      if (current === request) {
        file = result.file;
        dataUrl = result.dataUrl;
      }
    } catch (problem) {
      if (current === request)
        error = problem instanceof Error ? problem.message : 'Could not prepare this image.';
    } finally {
      if (current === request) processing = false;
    }
  }
</script>

<div class="preview-picker">
  <div class="preview-picker-row">
    {#if dataUrl}<img
        class="link-preview"
        src={dataUrl}
        alt="Selected preview"
        width="64"
        height="64"
      />{:else}<span class="preview-placeholder"><Image size={24} /></span>{/if}
    <label
      >Preview image (optional)<input
        bind:this={input}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onchange={select}
        {disabled}
      /><small class="form-hint"
        >{processing
          ? 'Preparing WebP preview…'
          : file
            ? `WebP · ${Math.max(1, Math.ceil(file.size / 1024))} KB`
            : 'Automatically resized to 640 px and WebP, up to 100 KB.'}</small
      ></label
    >
    {#if file || error || processing}<button
        type="button"
        class="icon-button"
        aria-label="Remove preview image"
        onclick={clear}
        {disabled}><X size={18} /></button
      >{/if}
  </div>
  {#if error}<p class="form-error" role="alert">{error}</p>{/if}
</div>
