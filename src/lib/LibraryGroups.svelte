<script lang="ts">
  import { Folder, Plus, X } from '@lucide/svelte';
  import { modalFocus } from './modal';
  import { validateGroupName } from './validation';
  import type { LibraryGroup } from './types';
  let {
    groups,
    selected = $bindable('all'),
    disabled = false,
    oncreate,
    onrename,
    onremove
  }: {
    groups: LibraryGroup[];
    selected?: string;
    disabled?: boolean;
    oncreate: (name: string) => Promise<void>;
    onrename: (id: string, name: string) => Promise<void>;
    onremove: (id: string) => Promise<void>;
  } = $props();
  let open = $state(false);
  let name = $state('');
  let editing = $state<string | null>(null);
  let deleting = $state<string | null>(null);
  let busy = $state(false);
  let error = $state('');
  function reset() {
    editing = null;
    deleting = null;
    name = '';
    error = '';
  }
  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    error = validateGroupName(name) ?? '';
    if (error) return;
    if (
      groups.some(
        (group) => group._id !== editing && group.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      error = 'A group with this name already exists.';
      return;
    }
    busy = true;
    try {
      if (editing) await onrename(editing, name);
      else await oncreate(name);
      reset();
    } catch {
      error = 'Could not save this group. Check your connection and try again.';
    } finally {
      busy = false;
    }
  }
  async function remove(id: string) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      await onremove(id);
      if (selected === id) selected = 'all';
      reset();
    } catch {
      error = 'Could not delete this group. Please try again.';
    } finally {
      busy = false;
    }
  }
</script>

<div class="library-groups">
  <label
    ><Folder size={17} /><span>Group</span><select
      aria-label="Filter by group"
      bind:value={selected}
      ><option value="all">All groups</option><option value="ungrouped">Ungrouped</option
      >{#each groups as group (group._id)}<option value={group._id}>{group.name}</option
        >{/each}</select
    ></label
  >
  <button
    class="secondary-button"
    {disabled}
    onclick={() => {
      reset();
      open = true;
    }}><Plus size={16} />Manage groups</button
  >
</div>
{#if open}
  <div class="modal-backdrop" role="presentation">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-title"
      tabindex="-1"
      use:modalFocus={() => {
        if (!busy) open = false;
      }}
    >
      <div class="modal-heading">
        <div>
          <span class="section-kicker">ORGANIZE YOUR LIBRARY</span>
          <h2 id="group-title">Manage groups</h2>
        </div>
        <button
          class="icon-button"
          aria-label="Close groups"
          disabled={busy}
          onclick={() => (open = false)}><X size={20} /></button
        >
      </div>
      <form onsubmit={save}>
        <label
          >Group name<input
            maxlength="60"
            required
            bind:value={name}
            disabled={busy}
            placeholder="e.g. Home essentials"
          /></label
        >
        <div class="modal-actions">
          {#if editing}<button
              type="button"
              class="secondary-button"
              disabled={busy}
              onclick={reset}>Cancel rename</button
            >{/if}<button class="primary-button" disabled={busy}
            >{editing ? 'Rename group' : 'Create group'}</button
          >
        </div>
      </form>
      <div class="group-list">
        {#each groups as group (group._id)}<div class="group-row">
            <strong>{group.name}</strong><button
              class="text-button"
              disabled={busy}
              onclick={() => {
                editing = group._id;
                deleting = null;
                name = group.name;
                error = '';
              }}>Rename</button
            ><button
              class="text-button"
              disabled={busy}
              onclick={() => {
                reset();
                deleting = group._id;
              }}>Delete group</button
            >
          </div>{/each}
      </div>
      {#if deleting}<div class="notice">
          <p>Delete this group? Its links or prompts will stay in your library as ungrouped.</p>
          <div class="modal-actions">
            <button class="secondary-button" disabled={busy} onclick={reset}>Keep group</button
            ><button
              class="primary-button"
              disabled={busy}
              onclick={() => deleting && remove(deleting)}>Confirm delete group</button
            >
          </div>
        </div>{/if}
      {#if error}<p class="form-error" role="alert">{error}</p>{/if}
    </div>
  </div>
{/if}
