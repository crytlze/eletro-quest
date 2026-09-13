// Helper PWA install: tangkap beforeinstallprompt (Android/Chrome),
// deteksi iOS (panduan manual), dan status sudah ter-install.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
let onChange: (() => void) | null = null;

export function initPwa(): void {
  try {
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferred = e as BeforeInstallPromptEvent;
      onChange?.();
    });
    window.addEventListener('appinstalled', () => {
      deferred = null;
      onChange?.();
    });
  } catch { /* abaikan */ }
}

/** Daftarkan service worker (auto-register dari vite-plugin-pwa sebagai fallback). */
export function registerSw(): void {
  try {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        void navigator.serviceWorker.register('./sw.js').catch(() => undefined);
      });
    }
  } catch { /* abaikan */ }
}

export function onPwaChange(cb: () => void): void {
  onChange = cb;
}

export function isIos(): boolean {
  try {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch { return false; }
}

export function isStandalone(): boolean {
  try {
    if (window.matchMedia('(display-mode: standalone)').matches) return true;
    const nav = navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true;
  } catch { return false; }
}

/** Bisa tampilkan tombol install? (belum standalone DAN (ada prompt ATAU iOS)) */
export function canInstall(): boolean {
  if (isStandalone()) return false;
  if (deferred !== null) return true;
  if (isIos()) return true;
  return false;
}

/** Aksi tombol: prompt native kalau ada, selain itu kembalikan 'ios' biar scene tampilkan panduan. */
export async function doInstall(): Promise<'prompted' | 'ios'> {
  if (deferred !== null) {
    const d = deferred;
    deferred = null;
    try {
      await d.prompt();
      await d.userChoice;
    } catch { /* abaikan */ }
    onChange?.();
    return 'prompted';
  }
  return 'ios';
}
