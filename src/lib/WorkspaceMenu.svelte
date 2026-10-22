<script lang="ts">
  import {
    Bookmark,
    ChevronRight,
    Download,
    Image,
    LogIn,
    LogOut,
    Settings,
    ShieldCheck,
    Video
  } from '@lucide/svelte';
  let {
    kind,
    superAdmin = false,
    signedIn = false,
    checkingSession = false,
    name,
    imageCount = 0,
    videoCount = 0,
    onlogin,
    onlogout,
    oninstall
  }: {
    kind: 'prompts' | 'more';
    superAdmin?: boolean;
    signedIn?: boolean;
    checkingSession?: boolean;
    name?: string;
    imageCount?: number;
    videoCount?: number;
    onlogin: () => void | Promise<void>;
    onlogout: () => void | Promise<void>;
    oninstall: () => void | Promise<void>;
  } = $props();
</script>

<section
  class="workspace-menu"
  aria-label={kind === 'prompts' ? 'Prompt categories' : 'Workspace options'}
>
  {#if kind === 'prompts'}
    <a class="menu-card prompt-menu-card" href="/text-to-image" aria-label="Text to image"
      ><span class="menu-card-icon"><Image size={24} /></span><span
        ><strong>Text to image</strong><small
          >Product photography, lifestyle scenes, and visuals.</small
        ><em>{imageCount} saved prompts</em></span
      ><ChevronRight size={18} /></a
    >
    <a class="menu-card prompt-menu-card" href="/image-to-video" aria-label="Image to video"
      ><span class="menu-card-icon video-icon"><Video size={24} /></span><span
        ><strong>Image to video</strong><small>Turn product images into videos with motion.</small
        ><em>{videoCount} saved prompts</em></span
      ><ChevronRight size={18} /></a
    >
  {:else}
    <div class="menu-account">
      <span class="profile-avatar">{name?.slice(0, 1).toUpperCase() ?? 'Y'}</span>
      <div>
        <strong>{name ?? 'Your workspace'}</strong><small
          >{checkingSession
            ? 'Checking session…'
            : superAdmin
              ? 'Super admin'
              : signedIn
                ? 'Personal account'
                : 'Guest'}</small
        >
      </div>
    </div>
    <a class="menu-card" href="/favorites" aria-label="Favorites"
      ><Bookmark size={21} /><span
        ><strong>Favorites</strong><small>Your saved links and prompts</small></span
      ><ChevronRight size={16} /></a
    >
    {#if superAdmin}<a class="menu-card" href="/admin" aria-label="Super admin"
        ><ShieldCheck size={21} /><span
          ><strong>Super admin</strong><small>View registered users</small></span
        ><ChevronRight size={16} /></a
      >{/if}
    <a class="menu-card" href="/settings" aria-label="Settings & setup"
      ><Settings size={21} /><span
        ><strong>Settings & setup</strong><small>Account, storage, and app settings</small></span
      ><ChevronRight size={16} /></a
    >
    <button class="menu-card" onclick={oninstall}
      ><Download size={21} /><span
        ><strong>Install app</strong><small>Add Linkcraft to your home screen</small></span
      ><ChevronRight size={16} /></button
    >
    <button
      class="menu-card"
      disabled={checkingSession}
      aria-busy={checkingSession}
      onclick={signedIn ? onlogout : onlogin}
      >{#if signedIn}<LogOut size={21} />{:else}<LogIn size={21} />{/if}<span
        ><strong>{checkingSession ? 'Checking session…' : signedIn ? 'Sign out' : 'Sign in'}</strong
        ><small
          >{checkingSession
            ? 'Restoring your account'
            : signedIn
              ? 'Leave your current session'
              : 'Open your personal workspace'}</small
        ></span
      ><ChevronRight size={16} /></button
    >
  {/if}
</section>
