<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { modalFocus } from './modal';
  import { usePwaInstall } from './pwa-install.svelte';
  import DemoLogin from './DemoLogin.svelte';
  import ItemCard from './ItemCard.svelte';
  import LibraryGroups from './LibraryGroups.svelte';
  import PreviewImagePicker from './PreviewImagePicker.svelte';
  import AdminPanel from './AdminPanel.svelte';
  import CloudAdminPanel from './CloudAdminPanel.svelte';
  import MobileNavigation from './MobileNavigation.svelte';
  import WorkspaceMenu from './WorkspaceMenu.svelte';
  import { demoAdminUsers } from './demo-admin';
  import {
    ArrowUpRight,
    Bookmark,
    Check,
    ChevronRight,
    Clipboard,
    Download,
    Globe,
    Image,
    LayoutGrid,
    Link,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sparkles,
    Star,
    Trash2,
    Video,
    X
  } from '@lucide/svelte';
  import { authClient } from './auth-client';
  import { demoItems } from './demo';
  import { validateItem, validateGroupName } from './validation';
  import type { Item, NewItem, Category, Visibility, WorkspaceView, LibraryGroup } from './types';

  let {
    initialView = 'overview',
    cloud = false,
    authenticated = false,
    authLoading = false,
    loading = false,
    name,
    cloudItems = [],
    cloudError,
    publicItems = [],
    publicLoading = false,
    publicError,
    hasMorePublic = false,
    onloadmore,
    onvisibility,
    oncreate,
    onupdate,
    cloudGroups = [],
    groupError,
    oncreategroup,
    onrenamegroup,
    onremovegroup,
    ongroupmembers,
    onfavorite,
    onremove,
    superAdmin = false,
    adminAccessLoading = false,
    adminAccessError
  }: {
    initialView?: WorkspaceView;
    superAdmin?: boolean;
    adminAccessLoading?: boolean;
    adminAccessError?: string;
    cloud?: boolean;
    authenticated?: boolean;
    authLoading?: boolean;
    loading?: boolean;
    name?: string;
    cloudItems?: Item[];
    cloudError?: string;
    cloudGroups?: LibraryGroup[];
    groupError?: string;
    onupdate?: (id: string, item: NewItem, image?: File, removeImage?: boolean) => Promise<void>;
    oncreategroup?: (kind: 'link' | 'prompt', name: string) => Promise<void>;
    onrenamegroup?: (id: string, name: string) => Promise<void>;
    onremovegroup?: (id: string) => Promise<void>;
    ongroupmembers?: (id: string, add: string[], remove: string[]) => Promise<void>;
    oncreate?: (item: NewItem, image?: File) => Promise<void>;
    onfavorite?: (id: string) => Promise<void>;
    onremove?: (id: string) => Promise<void>;
    publicItems?: Item[];
    publicLoading?: boolean;
    publicError?: string;
    hasMorePublic?: boolean;
    onloadmore?: () => void;
    onvisibility?: (id: string, visibility: Visibility) => Promise<void>;
  } = $props();
  type View = WorkspaceView;
  let view = $state<View>(untrack(() => initialView));
  let localItems = $state<Item[]>([]);
  let ready = $state(false);
  let localGroups = $state<LibraryGroup[]>([]);
  let selectedGroup = $state('all');
  const groups = $derived(cloud ? cloudGroups : localGroups);
  const groupKind = $derived(view === 'links' ? 'link' : 'prompt');
  const libraryGroups = $derived(groups.filter((group) => group.kind === groupKind));
  let editingId = $state<string | null>(null);
  let originalImage = $state<string | undefined>();
  let removeImage = $state(false);
  let demoSignedIn = $state(false);
  let demoSuperAdmin = $state(false);
  let showDemoLogin = $state(false);
  const signedIn = $derived(cloud ? authenticated : demoSignedIn);
  const checkingSession = $derived(cloud && authLoading);
  const displayName = $derived(
    cloud ? name : demoSignedIn ? (demoSuperAdmin ? 'Demo Admin' : 'Demo Creator') : undefined
  );
  const isSuperAdmin = $derived(
    cloud ? authenticated && superAdmin : demoSignedIn && demoSuperAdmin
  );
  let search = $state('');
  let modal = $state(false);
  let editing = $state<NewItem>({
    kind: 'link',
    title: '',
    content: '',
    category: 'text-to-image',
    tool: ''
  });
  let problem = $state('');
  let previewFile = $state<File | undefined>();
  let previewData = $state<string | undefined>();
  let imageProcessing = $state(false);
  let imageError = $state('');
  let busy = $state(false);
  let publishing = $state(false);
  let toast = $state('');
  let copied = $state('');
  let favoriteOnly = $state(false);
  let categoryFilter = $state('all');
  let communityFilter = $state('all');
  let detail = $state<Item | null>(null);
  const pwaInstall = usePwaInstall();
  const canInstall = $derived(pwaInstall.state.available);
  let online = $state(true);
  let toastTimer: ReturnType<typeof setTimeout>;
  let copyTimer: ReturnType<typeof setTimeout>;
  const titles: Record<View, string> = {
    prompts: 'Your prompt library.',
    more: 'Your workspace, your way.',
    admin: 'Your people, in one place.',
    community: 'Good ideas are worth sharing.',
    overview: 'Your creative home base.',
    links: 'Every link. Ready to share.',
    'text-to-image': 'Start with a great image.',
    'image-to-video': 'Bring your products to life.',
    favorites: 'Your go-to collection.',
    settings: 'Make yourself at home.'
  };
  const subtitles: Record<View, string> = {
    prompts: 'Choose an image or video category to find your next idea.',
    more: 'Your account, saved favorites, and workspace settings.',
    admin: 'View everyone who has registered for your workspace.',
    community: 'Discover public prompts and affiliate links shared by the community.',
    overview: 'Good ideas, great prompts, and your next affiliate link. All in one place.',
    links: 'Keep your affiliate links organized and copy them in a click.',
    'text-to-image': 'Product photography, lifestyle scenes, and scroll-stopping visuals.',
    'image-to-video': 'Turn a product photo into your next attention-grabbing video.',
    favorites: 'The links and prompts you come back to, together in one place.',
    settings: 'Your workspace, connection, and app settings.'
  };
  const items = $derived(cloud ? cloudItems : localItems);
  const links = $derived(items.filter((i) => i.kind === 'link'));
  const prompts = $derived(items.filter((i) => i.kind === 'prompt'));
  const favorites = $derived(items.filter((i) => i.favorite));
  const communityItems = $derived(
    cloud
      ? publicItems
      : localItems
          .filter((i) => i.visibility === 'public')
          .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0))
  );
  const visible = $derived(
    (view === 'community' ? communityItems : items).filter((i) => {
      if (view === 'community' && communityFilter === 'links' && i.kind !== 'link') return false;
      if (
        view === 'community' &&
        ['text-to-image', 'image-to-video'].includes(communityFilter) &&
        (i.kind !== 'prompt' || i.category !== communityFilter)
      )
        return false;
      if (view === 'prompts' && i.kind !== 'prompt') return false;
      if (
        ['links', 'prompts', 'text-to-image', 'image-to-video'].includes(view) &&
        selectedGroup !== 'all' &&
        (selectedGroup === 'ungrouped' ? !!i.groupId : i.groupId !== selectedGroup)
      )
        return false;
      if (view === 'links' && i.kind !== 'link') return false;
      if (
        (view === 'text-to-image' || view === 'image-to-video') &&
        (i.kind !== 'prompt' || i.category !== view)
      )
        return false;
      if (view === 'favorites' && !i.favorite) return false;
      if (view === 'overview' && i.kind !== 'prompt') return false;
      if (view !== 'community' && favoriteOnly && !i.favorite) return false;
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      return `${i.title} ${i.content} ${i.tool}`.toLowerCase().includes(search.toLowerCase());
    })
  );

  function notify(message: string) {
    toast = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast = ''), 4200);
  }
  function persist(next: Item[]) {
    // Commit only after the browser confirms the write, so a full/blocked store cannot look successful.
    localStorage.setItem('linkcraft-items-v1', JSON.stringify(next));
    localItems = next;
  }
  onMount(() => {
    if (!cloud) {
      try {
        const storedSession = sessionStorage.getItem('linkcraft-demo-session');
        demoSignedIn = storedSession === 'signed-in' || storedSession === 'super-admin';
        demoSuperAdmin = storedSession === 'super-admin';
      } catch {
        /* In-memory demo login still works if browser storage is blocked. */
      }
    }
    try {
      const saved = localStorage.getItem('linkcraft-items-v1');
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (
          !Array.isArray(parsed) ||
          !parsed.every(
            (i) =>
              i &&
              typeof i._id === 'string' &&
              ['link', 'prompt'].includes(i.kind) &&
              typeof i.title === 'string' &&
              typeof i.content === 'string' &&
              typeof i.tool === 'string' &&
              (i.kind === 'link' || ['text-to-image', 'image-to-video'].includes(i.category)) &&
              typeof i.favorite === 'boolean' &&
              typeof i.createdAt === 'number' &&
              (i.visibility === undefined || ['public', 'private'].includes(i.visibility))
          )
        )
          throw new Error('Invalid local data');
        localItems = parsed.map((i) => ({
          ...i,
          ...(i.kind === 'link' ? { category: undefined } : {})
        }));
      } else {
        localItems = structuredClone(demoItems);
      }
    } catch {
      localItems = structuredClone(demoItems);
      notify('Local storage could not be read. Showing sample prompts.');
    }
    try {
      const savedGroups: unknown = JSON.parse(localStorage.getItem('linkcraft-groups-v1') ?? '[]');
      if (
        Array.isArray(savedGroups) &&
        savedGroups.every(
          (group) =>
            typeof group._id === 'string' &&
            ['link', 'prompt'].includes(group.kind) &&
            typeof group.name === 'string' &&
            !validateGroupName(group.name)
        )
      )
        localGroups = savedGroups;
    } catch {
      /* Invalid local groups do not replace the library. */
    }
    ready = true;
    online = navigator.onLine;
    const status = () => (online = navigator.onLine);
    window.addEventListener('online', status);
    window.addEventListener('offline', status);
    return () => {
      clearTimeout(toastTimer);
      clearTimeout(copyTimer);
      window.removeEventListener('online', status);
      window.removeEventListener('offline', status);
    };
  });
  function navigate(next: View) {
    void goto(next === 'overview' ? '/' : `/${next}`);
  }
  function openNew(kind: 'link' | 'prompt' = 'link', category: Category = 'text-to-image') {
    if (checkingSession) return;
    if (view === 'community' && !signedIn) {
      void login();
      return;
    }
    if (cloud && !authenticated) {
      notify('Sign in with Google to save to your workspace.');
      return;
    }
    editingId = null;
    originalImage = undefined;
    removeImage = false;
    editing = {
      groupId: libraryGroups.some((group) => group._id === selectedGroup && group.kind === kind)
        ? selectedGroup
        : undefined,
      kind,
      category,
      title: '',
      content: '',
      tool: '',
      visibility: view === 'community' ? 'public' : 'private'
    };
    problem = '';
    previewFile = undefined;
    previewData = undefined;
    imageProcessing = false;
    imageError = '';
    modal = true;
  }
  async function save(event: SubmitEvent) {
    event.preventDefault();
    if (busy || imageProcessing || imageError) return;
    problem = validateItem(editing) ?? '';
    if (problem) return;
    if (editing.visibility === 'public' && !signedIn) {
      problem = 'Sign in before publishing a public post.';
      return;
    }
    busy = true;
    try {
      const { category, ...rest } = editing;
      const input: NewItem = {
        ...rest,
        ...(editing.kind === 'prompt' ? { category } : {}),
        title: editing.title.trim(),
        content: editing.content.trim(),
        tool: editing.tool.trim()
      };
      if (editingId) {
        if (cloud) {
          if (!onupdate) throw new Error('Cloud editing is unavailable.');
          await onupdate(editingId, input, previewFile, removeImage);
        } else
          persist(
            localItems.map((item) =>
              item._id === editingId
                ? {
                    ...item,
                    ...input,
                    groupId: input.groupId,
                    imageUrl: previewData ?? (removeImage ? undefined : item.imageUrl),
                    authorName:
                      input.visibility === 'public' ? (displayName ?? 'Demo Creator') : undefined,
                    publishedAt:
                      input.visibility === 'public' ? (item.publishedAt ?? Date.now()) : undefined
                  }
                : item
            )
          );
      } else if (cloud) {
        if (!oncreate) throw new Error('Cloud saving is unavailable.');
        await oncreate(input, editing.kind === 'link' ? previewFile : undefined);
      } else
        persist([
          {
            ...input,
            _id: crypto.randomUUID(),
            favorite: false,
            createdAt: Date.now(),
            ...(editing.kind === 'link' && previewData ? { imageUrl: previewData } : {}),
            ...(input.visibility === 'public'
              ? { authorName: displayName ?? 'Demo Creator', publishedAt: Date.now() }
              : {})
          },
          ...localItems
        ]);
      modal = false;
      notify(
        editingId
          ? 'Changes saved.'
          : editing.visibility === 'public'
            ? cloud
              ? 'Published to the Community feed.'
              : 'Published to the demo Community feed in this browser.'
            : `${editing.kind === 'link' ? 'Affiliate link' : 'Prompt'} saved privately.`
      );
    } catch {
      problem = 'Could not save. Check your connection and try again.';
    } finally {
      busy = false;
    }
  }
  function editItem(item: Item) {
    if (!canManage(item)) return;
    const own = items.find((owned) => owned._id === item._id) ?? item;
    editingId = own._id;
    editing = {
      kind: own.kind,
      title: own.title,
      content: own.content,
      tool: own.tool,
      category: own.category,
      visibility: own.visibility ?? 'private',
      groupId: own.groupId
    };
    originalImage = own.imageUrl;
    removeImage = false;
    previewFile = undefined;
    previewData = undefined;
    imageProcessing = false;
    imageError = '';
    problem = '';
    detail = null;
    modal = true;
  }
  function persistGroups(next: LibraryGroup[]) {
    localStorage.setItem('linkcraft-groups-v1', JSON.stringify(next));
    localGroups = next;
  }
  async function createGroup(name: string) {
    const problem = validateGroupName(name);
    if (problem) throw new Error(problem);
    if (cloud) {
      if (!oncreategroup) throw new Error('Sign in first.');
      await oncreategroup(groupKind, name);
    } else
      persistGroups([
        ...localGroups,
        { _id: crypto.randomUUID(), kind: groupKind, name: name.trim() }
      ]);
  }
  async function renameGroup(id: string, name: string) {
    if (cloud) {
      if (!onrenamegroup) throw new Error('Sign in first.');
      await onrenamegroup(id, name);
    } else
      persistGroups(
        localGroups.map((group) => (group._id === id ? { ...group, name: name.trim() } : group))
      );
  }
  async function removeGroup(id: string) {
    if (cloud) {
      if (!onremovegroup) throw new Error('Sign in first.');
      await onremovegroup(id);
    } else {
      persist(
        localItems.map((item) => (item.groupId === id ? { ...item, groupId: undefined } : item))
      );
      persistGroups(localGroups.filter((group) => group._id !== id));
    }
  }
  async function updateGroupMembers(id: string, add: string[], remove: string[]) {
    if (cloud) {
      if (!authenticated || !ongroupmembers) throw new Error('Sign in first.');
      await ongroupmembers(id, add, remove);
    } else {
      const group = localGroups.find((group) => group._id === id);
      if (!group) throw new Error('Group not found.');
      persist(
        localItems.map((item) => {
          if (item.kind !== group.kind) return item;
          if (add.includes(item._id)) return { ...item, groupId: id };
          if (remove.includes(item._id) && item.groupId === id)
            return { ...item, groupId: undefined };
          return item;
        })
      );
    }
    notify('Group updated');
  }
  async function toggleFavorite(item: Item) {
    try {
      if (cloud) await onfavorite?.(item._id);
      else
        persist(localItems.map((i) => (i._id === item._id ? { ...i, favorite: !i.favorite } : i)));
    } catch {
      notify('Could not update this favorite. Please try again.');
    }
  }
  function canManage(item: Item) {
    return view !== 'community' || (signedIn && items.some((owned) => owned._id === item._id));
  }
  async function changeVisibility(item: Item) {
    if (!signedIn) {
      detail = null;
      void login();
      return;
    }
    const visibility: Visibility = item.visibility === 'public' ? 'private' : 'public';
    publishing = true;
    try {
      if (cloud) await onvisibility?.(item._id, visibility);
      else
        persist(
          localItems.map((i) =>
            i._id === item._id
              ? {
                  ...i,
                  visibility,
                  authorName: visibility === 'public' ? (displayName ?? 'Demo Creator') : undefined,
                  publishedAt: visibility === 'public' ? Date.now() : undefined
                }
              : i
          )
        );
      detail = null;
      notify(
        visibility === 'public'
          ? cloud
            ? 'Published to the Community feed.'
            : 'Published to the demo feed in this browser.'
          : 'Post withdrawn. It is now private.'
      );
    } catch {
      notify('Could not change post visibility. Please try again.');
    } finally {
      publishing = false;
    }
  }
  async function remove(item: Item) {
    if (publishing || !canManage(item)) return;
    publishing = true;
    try {
      if (cloud) {
        if (!onremove) throw new Error('Cloud deletion is unavailable.');
        await onremove(item._id);
      } else persist(localItems.filter((i) => i._id !== item._id));
      detail = null;
      notify('Item deleted.');
    } catch {
      notify('Could not delete this item. Please try again.');
    } finally {
      publishing = false;
    }
  }
  async function copy(item: Item) {
    try {
      await navigator.clipboard.writeText(item.content);
      copied = item._id;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = ''), 2000);
      notify(`${item.kind === 'link' ? 'Link' : 'Prompt'} copied to clipboard.`);
    } catch {
      detail = item;
      notify('Clipboard unavailable. Select and copy the text in the detail window.');
    }
  }
  async function login() {
    if (checkingSession) return;
    if (!cloud) {
      showDemoLogin = true;
      return;
    }
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.origin
      });
      if (result.error) notify(result.error.message ?? 'Google sign-in could not start.');
    } catch {
      notify('Google sign-in could not start. Check your connection.');
    }
  }
  async function logout() {
    if (!cloud) {
      demoSignedIn = false;
      demoSuperAdmin = false;
      try {
        sessionStorage.removeItem('linkcraft-demo-session');
      } catch {
        /* Clear the in-memory session regardless. */
      }
      notify('Signed out of the demo account.');
      return;
    }
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      notify('Signed out.');
    } catch {
      notify('Could not sign out. Please try again.');
    }
  }
  function completeDemoLogin(role: 'member' | 'super_admin') {
    demoSignedIn = true;
    demoSuperAdmin = role === 'super_admin';
    try {
      sessionStorage.setItem(
        'linkcraft-demo-session',
        demoSuperAdmin ? 'super-admin' : 'signed-in'
      );
    } catch {
      /* Session lasts until reload when storage is unavailable. */
    }
    showDemoLogin = false;
    notify(
      demoSuperAdmin
        ? 'Welcome, Demo Admin! Super admin preview is ready.'
        : 'Welcome, Demo Creator! Your test workspace is ready.'
    );
  }
  function install() {
    pwaInstall.show();
  }
  function exportItems() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'linkcraft-workspace.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function handleShortcut(event: KeyboardEvent) {
    if (
      event.key !== '/' ||
      modal ||
      detail ||
      showDemoLogin ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    )
      return;
    if (event.target instanceof HTMLElement && event.target.closest('[role="dialog"]')) return;
    if (
      event.target instanceof HTMLElement &&
      (event.target.matches('input, textarea, select') || event.target.isContentEditable)
    )
      return;
    const input = document.querySelector<HTMLInputElement>('[aria-label="Search library"]');
    if (input) {
      event.preventDefault();
      input.focus();
    }
  }
</script>

<svelte:window onkeydown={handleShortcut} />
{#if showDemoLogin && !cloud}<DemoLogin
    onclose={() => (showDemoLogin = false)}
    onsuccess={completeDemoLogin}
  />{/if}
<div class="app-shell">
  <aside class="sidebar">
    <a class="brand" href="/" aria-label="Linkcraft home"
      ><span class="brand-mark"><Link size={22} strokeWidth={2.6} /></span>linkcraft<span
        class="brand-dot">.</span
      ></a
    >
    <div class="workspace-label">
      <span class="workspace-avatar">P</span>
      <div>Personal workspace<small>Your ideas live here</small></div>
      <ChevronRight size={14} />
    </div>
    <p class="nav-caption">WORKSPACE</p>
    {#if isSuperAdmin}<nav aria-label="Administration">
        <button class:active={view === 'admin'} onclick={() => navigate('admin')}
          ><ShieldCheck size={18} />Super admin</button
        >
      </nav>{/if}
    <nav aria-label="Workspace navigation">
      <button class:active={view === 'community'} onclick={() => navigate('community')}
        ><Globe size={18} />Community<span class="nav-count">Public</span></button
      >
      <button class:active={view === 'overview'} onclick={() => navigate('overview')}
        ><LayoutGrid size={18} />Overview</button
      >
      <button class:active={view === 'links'} onclick={() => navigate('links')}
        ><Link size={18} />Affiliate links<span class="nav-count">{links.length}</span></button
      >
      <button class:active={view === 'favorites'} onclick={() => navigate('favorites')}
        ><Bookmark size={18} />Favorites<span class="nav-count">{favorites.length}</span></button
      >
    </nav>
    <p class="nav-caption prompt-caption">PROMPT LIBRARY</p>
    <nav aria-label="Prompt categories">
      <button class:active={view === 'text-to-image'} onclick={() => navigate('text-to-image')}
        ><Image size={18} />Text to image<span class="category-dot mint"></span></button
      >
      <button class:active={view === 'image-to-video'} onclick={() => navigate('image-to-video')}
        ><Video size={18} />Image to video<span class="category-dot lilac"></span></button
      >
    </nav>
    <div class="sidebar-bottom">
      {#if canInstall}<div class="install-card">
          <span class="install-icon"><Download size={18} /></span>
          <h3>Your workspace, anywhere.</h3>
          <p>Keep your next great idea within reach.</p>
          <button onclick={install}>Install Linkcraft<ArrowUpRight size={14} /></button>
        </div>{/if}
      <button
        class="settings-link"
        class:active={view === 'settings'}
        onclick={() => navigate('settings')}><Settings size={18} />Settings & setup</button
      >
      <div class="profile">
        <span class="profile-avatar">{displayName?.slice(0, 1).toUpperCase() ?? 'Y'}</span>
        <div>
          {displayName ?? 'Your workspace'}<small
            >{checkingSession
              ? 'Checking session…'
              : signedIn
                ? isSuperAdmin
                  ? 'Super admin'
                  : cloud
                    ? 'Google connected'
                    : 'Demo account'
                : 'Personal account'}</small
          >
        </div>
        <span class="online-dot"></span>
      </div>
    </div>
  </aside>

  <div class="main-shell">
    <header class="topbar">
      <div class="breadcrumb">
        <span>Workspace</span><ChevronRight size={14} /><strong
          >{view === 'prompts'
            ? 'Prompts'
            : view === 'more'
              ? 'More'
              : view === 'admin'
                ? 'Super admin'
                : view === 'community'
                  ? 'Community'
                  : view === 'overview'
                    ? 'Overview'
                    : view === 'links'
                      ? 'Affiliate links'
                      : view === 'settings'
                        ? 'Settings'
                        : view === 'favorites'
                          ? 'Favorites'
                          : view === 'text-to-image'
                            ? 'Text to image'
                            : 'Image to video'}</strong
        >
      </div>
      <div class="topbar-actions">
        <span class="connection"
          ><span class:offline={!online} class="online-dot"></span>{!online
            ? 'Offline'
            : cloud
              ? 'Cloud workspace'
              : 'Local demo'}</span
        ><button
          class="google-button"
          disabled={checkingSession}
          aria-busy={checkingSession}
          onclick={signedIn ? logout : login}
          >{#if checkingSession}Checking session…{:else if signedIn}<Check size={15} />Sign out{:else}<span
              class="google-g"
              aria-hidden="true">{cloud ? 'G' : 'D'}</span
            >{cloud ? 'Sign in with Google' : 'Demo sign in'}{/if}</button
        >
      </div>
    </header>
    <main id="main-content">
      <div class="heading-row">
        <div>
          <p class="eyebrow">
            {view === 'overview'
              ? 'A LITTLE ORGANIZATION. A LOT OF POSSIBILITY.'
              : 'YOUR AFFILIATE WORKSPACE'}
          </p>
          <h1>{titles[view]}</h1>
          <p class="intro">{subtitles[view]}</p>
        </div>
        {#if view !== 'admin' && view !== 'more'}<button
            class="primary-button add-main"
            disabled={checkingSession}
            onclick={() =>
              openNew(
                view === 'links' || view === 'overview' ? 'link' : 'prompt',
                view === 'image-to-video' ? 'image-to-video' : 'text-to-image'
              )}
            ><Plus size={17} />{view === 'community'
              ? 'Create public post'
              : view === 'links' || view === 'overview'
                ? 'Add affiliate link'
                : 'Add prompt'}</button
          >{/if}
      </div>
      {#if !online}<div class="notice">
          You’re offline. {cloud
            ? 'Reconnect to access and save cloud items.'
            : 'Your saved local workspace is available.'}
        </div>{/if}
      {#if cloud && !authenticated && !checkingSession && !loading && view !== 'community'}<div
          class="notice"
        >
          Your private workspace is ready. Sign in with Google to access your links and prompts.
        </div>{/if}
      {#if view === 'community'}
        <div class="notice">
          {cloud
            ? signedIn
              ? 'Public posts are visible to everyone. Share your own prompts or affiliate links with the community.'
              : checkingSession
                ? 'Public posts are visible to everyone.'
                : 'Public posts are visible to everyone. Sign in to publish your own prompts or affiliate links.'
            : 'Demo Community feed: posts are visible in this browser only. Connect Convex to share posts with all users.'}
        </div>
        {#if publicError}<div class="notice error" role="alert">
            Could not load public posts. Check your connection and try again.
          </div>{/if}
      {/if}
      {#if cloudError && view !== 'community'}<div class="notice error">
          Could not load your workspace. Check your connection or Convex deployment.
        </div>{/if}

      {#if ['links', 'prompts', 'text-to-image', 'image-to-video'].includes(view)}
        <LibraryGroups
          groups={libraryGroups}
          items={items.filter((item) => item.kind === groupKind)}
          bind:selected={selectedGroup}
          disabled={checkingSession || (cloud && !authenticated)}
          oncreate={createGroup}
          onrename={renameGroup}
          onremove={removeGroup}
          onmembers={updateGroupMembers}
        />
        {#if groupError}<div class="notice error" role="alert">
            Could not load groups. Check your connection.
          </div>{/if}
      {/if}
      {#if view === 'prompts' || view === 'more'}
        <WorkspaceMenu
          kind={view}
          superAdmin={isSuperAdmin}
          {signedIn}
          {checkingSession}
          name={displayName}
          imageCount={prompts.filter((item) => item.category === 'text-to-image').length}
          videoCount={prompts.filter((item) => item.category === 'image-to-video').length}
          onlogin={login}
          onlogout={logout}
          oninstall={install}
          {canInstall}
        />
        {#if view === 'prompts'}<div class="item-grid prompt-library-grid">
            {#each visible as item (item._id)}<ItemCard
                {item}
                {copied}
                oncopy={copy}
                onfavorite={toggleFavorite}
                ondetail={(item) => (detail = item)}
              />{/each}
          </div>{/if}
      {:else if view === 'admin'}
        {#if checkingSession || adminAccessLoading || !ready}
          <div class="empty-state">
            <ShieldCheck size={28} />
            <h3>Checking admin access…</h3>
          </div>
        {:else if adminAccessError}
          <div class="notice error" role="alert">
            Could not verify super admin access. Check your connection and reload this page.
          </div>
        {:else if !signedIn}
          <div class="empty-state">
            <ShieldCheck size={28} />
            <h3>Super admin sign-in required.</h3>
            <p>Sign in with your super admin account to view registered users.</p>
            <button class="primary-button" onclick={login}
              >{cloud ? 'Sign in with Google' : 'Demo sign in'}</button
            >
          </div>
        {:else if !isSuperAdmin}
          <div class="empty-state">
            <ShieldCheck size={28} />
            <h3>Super admin access required.</h3>
            <p>
              This account cannot view registered users. Contact the workspace owner if you need
              access.
            </p>
          </div>
        {:else if cloud}<CloudAdminPanel />
        {:else}<AdminPanel users={demoAdminUsers} />{/if}
      {:else if view === 'settings'}
        <section class="settings-grid">
          {#if isSuperAdmin}
            <article class="settings-card">
              <span class="section-kicker">ADMINISTRATION</span>
              <h2>Super admin</h2>
              <p>View everyone who has registered and check their account details.</p>
              <button class="secondary-button" onclick={() => navigate('admin')}
                ><ShieldCheck size={16} />Super admin<ArrowUpRight size={16} /></button
              >
            </article>
          {/if}
          <article class="settings-card">
            <span class="section-kicker">ACCOUNT & STORAGE</span>
            <h2>{cloud ? 'Connected to Convex' : 'Try it. Make it yours.'}</h2>
            <p>
              {checkingSession
                ? 'Restoring your session…'
                : cloud && signedIn
                  ? 'Your private library is synced to your Google account.'
                  : cloud
                    ? 'Sign in with Google to keep your private library synced across devices.'
                    : 'You’re in local demo mode. Your changes stay in this browser. Configure Convex and Google OAuth to enable a private cloud workspace.'}
            </p>
            <button
              class="secondary-button"
              disabled={checkingSession}
              aria-busy={checkingSession}
              onclick={signedIn ? logout : login}
              >{checkingSession
                ? 'Checking session…'
                : signedIn
                  ? 'Sign out'
                  : cloud
                    ? 'Sign in with Google'
                    : 'Demo sign in'}<ArrowUpRight size={16} /></button
            >
          </article>
          {#if canInstall}<article class="settings-card">
              <span class="section-kicker">INSTALL THE APP</span>
              <h2>A home for your workflow.</h2>
              <p>
                Install Linkcraft from your browser. On iPhone or iPad, use Safari’s Share menu,
                then Add to Home Screen. Cloud storage needs an internet connection.
              </p>
              <button class="secondary-button" onclick={install}
                ><Download size={16} />Install app</button
              >
            </article>{/if}
          <article class="settings-card">
            <span class="section-kicker">YOUR DATA</span>
            <h2>Take your library with you.</h2>
            <p>
              Download your current links and prompts as a JSON file. Local demo records stay
              separate from your Google account.
            </p>
            <button class="secondary-button" onclick={exportItems}
              ><Download size={16} />Export workspace</button
            >
          </article>
          <article class="settings-card">
            <span class="section-kicker">GETTING STARTED</span>
            <h2>From product to post.</h2>
            <p>
              Save your own affiliate URL. Choose an image prompt, replace the [PRODUCT]
              placeholders, then copy it into your AI tool. Use an image-to-video prompt to animate
              the result.
            </p>
            <button class="text-button" onclick={() => navigate('text-to-image')}
              >Explore image prompts<ChevronRight size={16} /></button
            >
          </article>
        </section>
      {:else}
        {#if view === 'overview'}
          <section class="stats-grid" aria-label="Workspace totals">
            <article class="stat-card">
              <div>
                <span>Affiliate links</span><strong
                  >{links.length.toString().padStart(2, '0')}</strong
                ><small>Your products, one click away</small>
              </div>
              <span class="stat-icon"><Link size={21} /></span>
            </article>
            <article class="stat-card">
              <div>
                <span>Image prompts</span><strong
                  >{prompts
                    .filter((p) => p.category === 'text-to-image')
                    .length.toString()
                    .padStart(2, '0')}</strong
                ><small>Turn an idea into a visual</small>
              </div>
              <span class="stat-icon mint-text"><Image size={21} /></span>
            </article>
            <article class="stat-card">
              <div>
                <span>Video prompts</span><strong
                  >{prompts
                    .filter((p) => p.category === 'image-to-video')
                    .length.toString()
                    .padStart(2, '0')}</strong
                ><small>Give your products a little motion</small>
              </div>
              <span class="stat-icon lilac-text"><Video size={21} /></span>
            </article>
          </section>
          <section class="feature-banner">
            <div class="feature-copy">
              <span class="feature-label"><Sparkles size={13} />FROM IDEA TO YOUR NEXT POST</span>
              <h2>Create more.<br /><span>Start from something good.</span></h2>
              <p>
                A prompt for the image. A prompt for the motion.<br class="desktop-break" /> Your affiliate
                link, ready when you are.
              </p>
              <button class="light-button" onclick={() => navigate('text-to-image')}
                >Explore the prompt library<ArrowUpRight size={16} /></button
              >
            </div>
            <div class="feature-art" aria-hidden="true">
              <div class="art-orbit"></div>
              <div class="art-card art-back">
                <span class="art-mini-label">IMAGE TO VIDEO</span>
                <div class="video-art"><span class="play-circle">▶</span></div>
                <span class="art-caption">A little motion. A lot of possibility.</span>
              </div>
              <div class="art-card art-front">
                <span class="art-mini-label">TEXT TO IMAGE <Sparkles size={12} /></span>
                <div class="product-art">
                  <div class="pedestal"></div>
                  <div class="bottle">
                    <div class="bottle-cap"></div>
                    <span>everyday<br /><b>essentials</b><i>made for the little things.</i></span>
                  </div>
                  <div class="art-shadow"></div>
                </div>
                <span class="art-caption"><span class="tiny-dot"></span>Your next great visual</span
                >
              </div>
              <span class="floating-spark">✦</span>
            </div>
          </section>
        {/if}
        <section class="library-section">
          <div class="section-heading">
            <div>
              <div class="section-title-row">
                <h2>
                  {view === 'community'
                    ? 'Community posts'
                    : view === 'overview'
                      ? 'A little inspiration to get you going'
                      : view === 'links'
                        ? 'Your affiliate links'
                        : view === 'favorites'
                          ? 'Saved favorites'
                          : 'Your prompt library'}
                </h2>
                <span class="count-badge">{visible.length}</span>
              </div>
              <p>
                {view === 'community'
                  ? 'Copy a prompt, discover a product, or share something useful.'
                  : view === 'overview'
                    ? 'Ready-to-copy prompts. Make them your own.'
                    : view === 'links'
                      ? 'Paste your own affiliate URLs to build your collection.'
                      : 'Find your next idea and copy it in a click.'}
              </p>
            </div>
            {#if view === 'overview'}<button class="text-button" onclick={() => openNew('prompt')}
                >Add a prompt<Plus size={15} /></button
              >{/if}
          </div>
          <div class="filter-bar">
            {#if view === 'community'}
              <div class="filter-tabs community-tabs" aria-label="Filter public posts">
                <button
                  class:chosen={communityFilter === 'all'}
                  onclick={() => (communityFilter = 'all')}>All posts</button
                >
                <button
                  class:chosen={communityFilter === 'links'}
                  onclick={() => (communityFilter = 'links')}>Links</button
                >
                <button
                  class:chosen={communityFilter === 'text-to-image'}
                  onclick={() => (communityFilter = 'text-to-image')}>Image prompts</button
                >
                <button
                  class:chosen={communityFilter === 'image-to-video'}
                  onclick={() => (communityFilter = 'image-to-video')}>Video prompts</button
                >
              </div>
            {:else}
              <div class="filter-tabs" aria-label="Filter collection">
                <button class:chosen={!favoriteOnly} onclick={() => (favoriteOnly = false)}
                  >All {view === 'links' ? 'links' : 'items'}</button
                ><button class:chosen={favoriteOnly} onclick={() => (favoriteOnly = true)}
                  ><Star size={13} />Favorites</button
                >
              </div>
            {/if}
            <div class="search-filters">
              {#if view === 'overview' || view === 'favorites'}<select
                  aria-label="Filter by category"
                  bind:value={categoryFilter}
                  ><option value="all">All categories</option><option value="text-to-image"
                    >Text to image</option
                  ><option value="image-to-video">Image to video</option></select
                >{/if}
              <label class="search-box"
                ><Search size={16} /><input
                  maxlength="200"
                  aria-label="Search library"
                  placeholder={view === 'community'
                    ? 'Search loaded posts…'
                    : 'Search your library…'}
                  bind:value={search}
                /><kbd>/</kbd></label
              >
            </div>
          </div>
          {#if (view === 'community' ? publicLoading && communityItems.length === 0 : loading) || (!cloud && !ready)}<div
              class="empty-state"
            >
              <Sparkles size={28} />
              <h3>Opening your workspace…</h3>
            </div>
          {:else if visible.length === 0}
            <div class="empty-state">
              <span class="empty-icon"
                >{#if view === 'community'}<Globe size={28} />{:else if view === 'links'}<Link
                    size={28}
                  />{:else}<Bookmark size={28} />{/if}</span
              >
              <h3>
                {search
                  ? 'No matches just yet.'
                  : view === 'community'
                    ? 'Be the first to share.'
                    : view === 'links'
                      ? 'Your first link starts here.'
                      : 'A little room for your next idea.'}
              </h3>
              <p>
                {search
                  ? 'Try another search or clear your filters.'
                  : view === 'community'
                    ? 'Publish a prompt or affiliate link for others to discover.'
                    : view === 'links'
                      ? 'Paste an affiliate link and keep it ready for your next post.'
                      : 'Save a prompt or star something you love.'}
              </p>
              <button
                class="secondary-button"
                onclick={() =>
                  search
                    ? ((search = ''),
                      (favoriteOnly = false),
                      (categoryFilter = 'all'),
                      (communityFilter = 'all'))
                    : openNew(
                        view === 'links' ? 'link' : 'prompt',
                        view === 'image-to-video' ? 'image-to-video' : 'text-to-image'
                      )}
                >{search
                  ? 'Clear filters'
                  : view === 'community'
                    ? 'Create public post'
                    : view === 'links'
                      ? 'Add your first link'
                      : 'Add a prompt'}<Plus size={15} /></button
              >
            </div>
          {:else}
            <div class="item-grid">
              {#each visible as item (item._id)}<ItemCard
                  {item}
                  {copied}
                  community={view === 'community'}
                  oncopy={copy}
                  onfavorite={toggleFavorite}
                  ondetail={(item) => (detail = item)}
                />{/each}
            </div>
          {/if}
          {#if view === 'community' && cloud && (hasMorePublic || (publicLoading && communityItems.length > 0))}<div
              class="feed-pagination"
            >
              <button class="secondary-button" disabled={publicLoading} onclick={onloadmore}
                >{publicLoading ? 'Loading posts…' : 'Load more posts'}</button
              >
            </div>{/if}
        </section>
        {#if view === 'overview'}<div class="workflow-note">
            <span><Sparkles size={16} />Your workflow, simplified.</span>
            <p>
              Save a link <ChevronRight size={12} /> Create an image <ChevronRight size={12} /> Bring
              it to life <ChevronRight size={12} /> Share your story
            </p>
          </div>{/if}
      {/if}
      <footer class="page-footer">
        <span>Made for your next good idea.</span><span
          >LINKCRAFT <span class="footer-version">/ v1.0</span></span
        >
      </footer>
    </main>
  </div>
</div>

<MobileNavigation {view} />

{#if modal}
  <div class="modal-backdrop" role="presentation">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-title"
      tabindex="-1"
      use:modalFocus={() => {
        if (!busy) modal = false;
      }}
    >
      <div class="modal-heading">
        <div>
          <span class="section-kicker"
            >{editing.visibility === 'public'
              ? 'SHARE WITH THE COMMUNITY'
              : 'GROW YOUR COLLECTION'}</span
          >
          <h2 id="new-title">
            {editingId ? 'Edit' : 'Add'}
            {editing.kind === 'link' ? 'an affiliate link' : 'a prompt'}
          </h2>
        </div>
        <button
          class="icon-button"
          aria-label="Close dialog"
          disabled={busy}
          onclick={() => (modal = false)}><X size={20} /></button
        >
      </div>
      <form onsubmit={save}>
        <fieldset class="item-fields" disabled={busy}>
          {#if !editingId}<div class="form-toggle">
              <button
                type="button"
                class:chosen={editing.kind === 'link'}
                onclick={() => {
                  if (editing.kind !== 'link') editing.groupId = undefined;
                  editing.kind = 'link';
                }}><Link size={15} />Affiliate link</button
              ><button
                type="button"
                class:chosen={editing.kind === 'prompt'}
                onclick={() => {
                  if (editing.kind !== 'prompt') editing.groupId = undefined;
                  editing.kind = 'prompt';
                  previewFile = undefined;
                  previewData = undefined;
                  imageProcessing = false;
                  imageError = '';
                  editing.category ??= 'text-to-image';
                }}><Sparkles size={15} />Prompt</button
              >
            </div>{/if}
          <label
            >Title<input
              required
              maxlength="120"
              placeholder={editing.kind === 'link'
                ? 'e.g. My favorite desk lamp'
                : 'e.g. Warm morning product photo'}
              bind:value={editing.title}
            /></label
          >
          {#if editingId && originalImage && !removeImage && !previewFile}<div
              class="preview-picker-row"
            >
              <img
                class="link-preview"
                src={originalImage}
                alt="Current preview"
                width="64"
                height="64"
              /><button type="button" class="secondary-button" onclick={() => (removeImage = true)}
                >Remove current image</button
              >
            </div>{/if}
          {#if editing.kind === 'link'}<PreviewImagePicker
              bind:file={previewFile}
              bind:dataUrl={previewData}
              bind:processing={imageProcessing}
              bind:error={imageError}
              disabled={busy}
            />{/if}
          <div class="form-row" class:single-column={editing.kind === 'link'}>
            {#if editing.kind === 'prompt'}<label
                >Category<select bind:value={editing.category}
                  ><option value="text-to-image">Text to image</option><option
                    value="image-to-video">Image to video</option
                  ></select
                ></label
              >{/if}
            <label
              >{editing.kind === 'link' ? 'Brand / platform' : 'AI tool (optional)'}<input
                maxlength="80"
                placeholder={editing.kind === 'link' ? 'e.g. My store' : 'e.g. Any image model'}
                bind:value={editing.tool}
              /></label
            >
          </div>
          <label
            >{editing.kind === 'link'
              ? 'Affiliate URL'
              : 'Prompt'}{#if editing.kind === 'link'}<input
                type="url"
                required
                maxlength="12000"
                placeholder="https://example.com/your-affiliate-link"
                bind:value={editing.content}
              />{:else}<textarea
                required
                rows="6"
                maxlength="12000"
                placeholder="Describe your visual. Use [PRODUCT] for a reusable placeholder…"
                bind:value={editing.content}></textarea>{/if}</label
          >
          <label
            >Group<select
              value={editing.groupId ?? ''}
              onchange={(event) => (editing.groupId = event.currentTarget.value || undefined)}
              ><option value="">Ungrouped</option
              >{#each groups.filter((group) => group.kind === editing.kind) as group (group._id)}<option
                  value={group._id}>{group.name}</option
                >{/each}</select
            ></label
          >
          <label
            >Who can see this?<select bind:value={editing.visibility}
              ><option value="private">Private — only me</option><option
                value="public"
                disabled={!signedIn}>Public — everyone</option
              ></select
            ></label
          >
          <p class="form-hint">
            {editing.visibility === 'public'
              ? cloud
                ? 'Anyone can see this post and your display name in the Community feed.'
                : 'This demo post will appear in this browser’s Community feed. Connect Convex to share across users.'
              : cloud
                ? 'Saved privately to your account. You can publish it later.'
                : 'Saved in this browser. Sign in to the demo account to try public posting.'}
          </p>
          {#if problem}<p class="form-error" role="alert">{problem}</p>{/if}
          <div class="modal-actions">
            <button
              type="button"
              class="secondary-button"
              disabled={busy}
              onclick={() => (modal = false)}>Cancel</button
            ><button
              class="primary-button"
              disabled={busy || imageProcessing || !!imageError}
              type="submit"
              >{busy
                ? 'Saving…'
                : editingId
                  ? 'Save changes'
                  : editing.visibility === 'public'
                    ? 'Publish post'
                    : 'Save to workspace'}<Plus size={15} /></button
            >
          </div>
        </fieldset>
      </form>
    </div>
  </div>
{/if}
{#if detail}
  <div class="modal-backdrop" role="presentation">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      tabindex="-1"
      use:modalFocus={() => {
        if (!publishing) detail = null;
      }}
    >
      <div class="modal-heading">
        <div>
          <span class="section-kicker"
            >{detail.kind === 'link'
              ? 'AFFILIATE LINK'
              : detail.category?.replaceAll('-', ' ').toUpperCase()}</span
          >
          <div class="item-name">
            {#if detail.kind === 'link' && detail.imageUrl}<img
                class="link-preview"
                src={detail.imageUrl}
                alt=""
                width="56"
                height="56"
              />{/if}
            <h2 id="detail-title">{detail.title}</h2>
          </div>
        </div>
        <button
          class="icon-button"
          aria-label="Close detail"
          disabled={publishing}
          onclick={() => (detail = null)}><X size={20} /></button
        >
      </div>
      <p class="visibility-note">
        <Globe size={14} />{detail.visibility === 'public'
          ? 'Public post — visible in Community'
          : 'Private — only in your workspace'}
      </p>
      <p class="detail-text">{detail.content}</p>
      {#if canManage(detail)}<div class="publish-actions">
          <button
            class="secondary-button"
            disabled={publishing}
            onclick={() => detail && changeVisibility(detail)}
            ><Globe size={15} />{publishing
              ? 'Updating…'
              : detail.visibility === 'public'
                ? 'Make private'
                : 'Publish to Community'}</button
          >
          <p class="form-hint">
            {detail.visibility === 'public'
              ? 'Making this private removes it from the public feed.'
              : 'Publishing shares the content and your display name with everyone.'}
          </p>
        </div>{/if}
      <div class="modal-actions">
        {#if canManage(detail)}<button
            class="secondary-button"
            disabled={publishing}
            onclick={() => detail && editItem(detail)}>Edit {detail.kind}</button
          ><button
            class="delete-button"
            disabled={publishing}
            onclick={() => detail && remove(detail)}><Trash2 size={15} />Delete</button
          >{/if}<button class="primary-button" onclick={() => detail && copy(detail)}
          ><Clipboard size={15} />Copy {detail.kind}</button
        >
      </div>
    </div>
  </div>
{/if}
{#if toast}<div class="toast" role="status">
    <Check size={17} />{toast}<button
      class="icon-button"
      aria-label="Dismiss notification"
      onclick={() => (toast = '')}><X size={15} /></button
    >
  </div>{/if}
