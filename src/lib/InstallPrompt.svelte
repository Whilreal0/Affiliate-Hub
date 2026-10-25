<script lang="ts">
  import { Download, X } from '@lucide/svelte';
  import { modalFocus } from './modal';
  import type { createPwaInstall } from './pwa-install.svelte';
  let { controller }: { controller: ReturnType<typeof createPwaInstall> } = $props();
  const state = $derived(controller.state);
</script>

{#if state.available && state.open}
  <div class="modal-backdrop" role="presentation">
    <div
      class="modal install-prompt"
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-title"
      tabindex="-1"
      use:modalFocus={() => {
        if (!state.busy) controller.close();
      }}
    >
      <div class="modal-heading">
        <div>
          <span class="section-kicker">YOUR WORKSPACE, ONE TAP AWAY</span>
          <h2 id="install-title">Install Linkcraft</h2>
        </div>
        <button
          class="icon-button"
          aria-label="Close install prompt"
          disabled={state.busy}
          onclick={controller.close}><X size={20} /></button
        >
      </div>
      <p class="install-description">
        Keep your links and prompts within reach. Open Linkcraft directly from your home screen.
      </p>
      {#if !state.nativeReady && !state.busy}
        {#if state.ios}<ol class="install-steps">
            <li>Tap your browser’s <strong>Share</strong> button.</li>
            <li>Choose <strong>Add to Home Screen</strong>.</li>
            <li>Tap <strong>Add</strong> to finish.</li>
          </ol>
          <p class="form-hint">
            If you don’t see the option, open this site in Safari. iPhone and iPad require these
            steps.
          </p>
        {:else}<ol class="install-steps">
            <li>Open your browser’s <strong>menu ⋮</strong>.</li>
            <li>Tap <strong>Install app</strong> or <strong>Add to Home Screen</strong>.</li>
          </ol>
          <p class="form-hint">
            If your browser makes one-tap installation available, an Install button will appear
            here.
          </p>{/if}
      {/if}
      {#if state.error}<p class="form-error" role="alert">{state.error}</p>{/if}
      <div class="modal-actions">
        <button class="secondary-button" disabled={state.busy} onclick={controller.close}
          >Not now</button
        >{#if state.nativeReady || state.busy}<button
            class="primary-button"
            disabled={state.busy}
            onclick={controller.install}><Download size={17} />Install app</button
          >{:else}<button class="primary-button" disabled={state.busy} onclick={controller.close}
            >Got it</button
          >{/if}
      </div>
    </div>
  </div>
{/if}
