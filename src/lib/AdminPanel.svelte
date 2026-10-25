<script lang="ts">
  import { Search, ShieldCheck, Users } from '@lucide/svelte';
  import type { AdminUser } from './types';

  let {
    users = [],
    cloud = false,
    loading = false,
    error,
    hasMore = false,
    onloadmore
  }: {
    users?: AdminUser[];
    cloud?: boolean;
    loading?: boolean;
    error?: string;
    hasMore?: boolean;
    onloadmore?: () => void;
  } = $props();
  let search = $state('');
  const filtered = $derived(
    users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase())
    )
  );
  const date = (timestamp: number) =>
    new Date(timestamp).toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
</script>

<section class="admin-panel" aria-label="Registered users administration">
  {#if !cloud}<div class="notice">
      <strong>Super admin demo preview.</strong> These are built-in demo accounts, not real registrations.
      Connect Convex and configure your admin email to view everyone who registers.
    </div>{/if}
  <div class="stats-grid">
    <article class="stat-card">
      <div>
        <span>{cloud ? 'Accounts loaded' : 'Demo accounts'}</span><strong>{users.length}</strong
        ><small
          >{cloud ? 'Load more below to see older accounts' : 'Sample accounts for testing'}</small
        >
      </div>
      <span class="stat-icon"><Users size={21} /></span>
    </article>
    <article class="stat-card">
      <div>
        <span>Verified emails {cloud ? '(loaded)' : '(sample)'}</span><strong
          >{users.filter((user) => user.emailVerified).length}</strong
        ><small>{cloud ? 'Email verification status' : 'Illustrative status only'}</small>
      </div>
      <span class="stat-icon mint-text"><ShieldCheck size={21} /></span>
    </article>
    <article class="stat-card">
      <div>
        <span>Super admins {cloud ? '(loaded)' : '(demo)'}</span><strong
          >{users.filter((user) => user.role === 'super_admin').length}</strong
        ><small
          >{cloud ? 'Assigned through server configuration' : 'Local preview access only'}</small
        >
      </div>
      <span class="stat-icon lilac-text"><ShieldCheck size={21} /></span>
    </article>
  </div>
  <div class="section-heading">
    <div>
      <h2>Registered users</h2>
      <p>
        {cloud
          ? 'Account details from the registration system. Dates use Philippine time.'
          : 'Preview the user directory with your dummy accounts.'}
      </p>
    </div>
  </div>
  <div class="admin-toolbar">
    <label class="search-box"
      ><Search size={16} /><input
        maxlength="200"
        aria-label="Search registered users"
        placeholder="Search loaded names or emails…"
        bind:value={search}
      /></label
    ><span class="form-hint">{filtered.length} shown · {users.length} loaded</span>
  </div>
  {#if error}<div class="notice error" role="alert">
      Could not load registered users. Check your connection and super admin access.
    </div>{/if}
  {#if loading && users.length === 0}<div class="empty-state">
      <Users size={28} />
      <h3>Loading registered users…</h3>
    </div>
  {:else if filtered.length === 0}<div class="empty-state">
      <Users size={28} />
      <h3>{search ? 'No matching users in the loaded records.' : 'No registered users yet.'}</h3>
      <p>
        {search
          ? 'Try another search or load more accounts.'
          : 'New accounts will appear after registration.'}
      </p>
    </div>
  {:else}
    <div class="admin-table-wrap">
      <table class="admin-table">
        <caption>{cloud ? 'Registered accounts' : 'Built-in demo accounts'}</caption>
        <thead
          ><tr
            ><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Verification</th><th
              scope="col">Registered (PHT)</th
            ><th scope="col">Role</th></tr
          ></thead
        >
        <tbody
          >{#each filtered as user (user.id)}<tr>
              <td data-label="Name"><strong>{user.name || 'Unnamed user'}</strong></td>
              <td data-label="Email">{user.email}</td>
              <td data-label="Verification"
                ><span class="admin-status" class:verified={user.emailVerified}
                  >{user.emailVerified ? 'Verified' : 'Unverified'}</span
                ></td
              >
              <td data-label="Registered">{cloud ? date(user.registeredAt) : 'Built-in demo'}</td>
              <td data-label="Role"
                ><span class="admin-role" class:super={user.role === 'super_admin'}
                  >{user.role === 'super_admin' ? 'Super admin' : 'Member'}</span
                ></td
              >
            </tr>{/each}</tbody
        >
      </table>
    </div>
  {/if}
  {#if hasMore || (loading && users.length > 0)}<div class="feed-pagination">
      <button class="secondary-button" disabled={loading} onclick={onloadmore}
        >{loading ? 'Loading accounts…' : 'Load more users'}</button
      >
    </div>{/if}
</section>
