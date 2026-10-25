import { getContext, onMount, setContext } from 'svelte';

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };
const key = Symbol('pwa-install');

export function createPwaInstall() {
  const state = $state({
    available: false,
    open: false,
    nativeReady: false,
    ios: false,
    busy: false,
    error: ''
  });
  let pending: InstallEvent | null = null;
  let dismissed = false;
  let autoTimer: ReturnType<typeof setTimeout>;
  function close() {
    state.open = false;
    dismissed = true;
    try {
      sessionStorage.setItem('linkcraft-install-dismissed-session', 'yes');
      localStorage.setItem('linkcraft-install-dismissed-until', String(Date.now() + 7 * 86400000));
    } catch {
      /* The in-memory dismissal still works. */
    }
  }
  function installed() {
    state.available = false;
    state.open = false;
    state.nativeReady = false;
    pending = null;
    try {
      sessionStorage.setItem('linkcraft-installed-session', 'yes');
    } catch {
      /* Browser display mode remains authoritative. */
    }
  }
  const controller = {
    state,
    close,
    show() {
      if (state.available) {
        state.error = '';
        state.open = true;
      }
    },
    async install() {
      if (!state.available || !pending || state.busy) return;
      const event = pending;
      pending = null;
      state.nativeReady = false;
      state.busy = true;
      state.error = '';
      try {
        await event.prompt();
        if ((await event.userChoice).outcome === 'accepted') installed();
        else close();
      } catch {
        state.error =
          'Your browser could not open installation. Try Add to Home Screen from its menu.';
      } finally {
        state.busy = false;
      }
    }
  };
  setContext(key, controller);
  onMount(() => {
    const mobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    state.ios =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const display = window.matchMedia('(display-mode: standalone)');
    let knownInstalled = false;
    try {
      knownInstalled = sessionStorage.getItem('linkcraft-installed-session') === 'yes';
      dismissed =
        sessionStorage.getItem('linkcraft-install-dismissed-session') === 'yes' ||
        Number(localStorage.getItem('linkcraft-install-dismissed-until')) > Date.now();
    } catch {
      /* Storage can be unavailable in privacy modes. */
    }
    function refresh() {
      state.available =
        mobile &&
        !knownInstalled &&
        !display.matches &&
        !(navigator as Navigator & { standalone?: boolean }).standalone;
      if (!state.available) state.open = false;
    }
    refresh();
    let retries = 0;
    function offer() {
      if (!state.available || dismissed) return;
      if (
        document.visibilityState === 'hidden' ||
        document.querySelector('[role="dialog"]') ||
        document.activeElement?.matches('input, textarea, select')
      ) {
        if (++retries < 10) autoTimer = setTimeout(offer, 2000);
        return;
      }
      state.open = true;
    }
    function capture(event: Event) {
      event.preventDefault();
      if (state.available) {
        pending = event as InstallEvent;
        state.nativeReady = true;
      }
    }
    function onInstalled() {
      knownInstalled = true;
      installed();
    }
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', onInstalled);
    display.addEventListener('change', refresh);
    autoTimer = setTimeout(offer, 2500);
    return () => {
      clearTimeout(autoTimer);
      window.removeEventListener('beforeinstallprompt', capture);
      window.removeEventListener('appinstalled', onInstalled);
      display.removeEventListener('change', refresh);
    };
  });
  return controller;
}

export function usePwaInstall() {
  return getContext<ReturnType<typeof createPwaInstall>>(key);
}
