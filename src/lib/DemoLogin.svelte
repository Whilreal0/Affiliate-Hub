<script lang="ts">
  import { X, LogIn } from '@lucide/svelte';
  import { modalFocus } from './modal';

  let {
    onclose,
    onsuccess
  }: { onclose: () => void; onsuccess: (role: 'member' | 'super_admin') => void } = $props();
  let email = $state('');
  let password = $state('');
  let error = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (email.trim().toLowerCase() === 'admin@linkcraft.test' && password === 'Admin123!') {
      onsuccess('super_admin');
      return;
    }
    if (email.trim().toLowerCase() !== 'demo@linkcraft.test' || password !== 'Demo123!') {
      error = 'Use the demo email and password shown above.';
      return;
    }
    onsuccess('member');
  }
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class="modal"
    role="dialog"
    aria-modal="true"
    aria-labelledby="demo-login-title"
    tabindex="-1"
    use:modalFocus={onclose}
  >
    <div class="modal-heading">
      <div>
        <span class="section-kicker">LOCAL DEMO ACCOUNT</span>
        <h2 id="demo-login-title">Try your workspace.</h2>
      </div>
      <button class="icon-button" aria-label="Close demo login" onclick={onclose}
        ><X size={20} /></button
      >
    </div>
    <div class="notice">
      <strong>Demo credentials</strong><br />
      Email: <code>demo@linkcraft.test</code><br />
      Password: <code>Demo123!</code>
      <br /><br /><strong>Super admin preview</strong><br />
      Email: <code>admin@linkcraft.test</code><br />
      Password: <code>Admin123!</code>
    </div>
    <form onsubmit={submit}>
      <label
        >Email<input
          type="email"
          maxlength="254"
          autocomplete="username"
          required
          bind:value={email}
          placeholder="demo@linkcraft.test"
        /></label
      >
      <label
        >Password<input
          type="password"
          maxlength="128"
          autocomplete="current-password"
          required
          bind:value={password}
          placeholder="Demo123!"
        /></label
      >
      <p class="form-hint">
        For testing in this browser. Your links and prompts stay on this device. Google sign-in is
        available when Convex is connected.
      </p>
      {#if error}<p class="form-error" role="alert">{error}</p>{/if}
      <div class="modal-actions">
        <button
          type="button"
          class="secondary-button"
          onclick={() => {
            email = 'admin@linkcraft.test';
            password = 'Admin123!';
            error = '';
          }}>Fill admin credentials</button
        >
        <button
          type="button"
          class="secondary-button"
          onclick={() => {
            email = 'demo@linkcraft.test';
            password = 'Demo123!';
            error = '';
          }}>Fill demo credentials</button
        >
        <button class="primary-button" type="submit"><LogIn size={15} />Log in</button>
      </div>
    </form>
  </div>
</div>
