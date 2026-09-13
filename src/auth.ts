import { apiDaftar, apiMasuk, playerName } from './util';

// Form daftar/masuk berupa overlay HTML (keyboard HP asli + password tertutup).
// Dipakai sebelum kirim review.

// Daftar: Username + Nama lengkap + Email + Password.
// Masuk: Username + Password saja.

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function setRowVisible(id: string, show: boolean): void {
  const r = el('auth-' + id + '-row');
  if (r !== null) r.style.display = show ? '' : 'none';
}

const USER_RE = /^[a-zA-Z0-9._-]{3,16}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export function hideAuthOverlay(): void {
  el('auth-overlay')?.classList.add('hidden');
}

export function showAuthOverlay(mode: 'daftar' | 'masuk', onDone: (ok: boolean) => void): void {
  const ov = el('auth-overlay');
  const title = el('auth-title');
  const un = el<HTMLInputElement>('auth-username');
  const fn = el<HTMLInputElement>('auth-fullname');
  const em = el<HTMLInputElement>('auth-email');
  const p1 = el<HTMLInputElement>('auth-pass');
  const p2 = el<HTMLInputElement>('auth-pass2');
  const err = el('auth-err');
  const submit = el<HTMLButtonElement>('auth-submit');
  const toggle = el('auth-toggle');
  const close = el('auth-close');
  if (ov === null || title === null || un === null || fn === null || em === null || p1 === null || p2 === null ||
      err === null || submit === null || toggle === null || close === null) {
    onDone(false);
    return;
  }
  const isDaftar = mode === 'daftar';
  title.textContent = isDaftar ? 'Daftar Akun' : 'Masuk Akun';
  submit.textContent = isDaftar ? 'DAFTAR' : 'MASUK';
  toggle.innerHTML = isDaftar ? 'Sudah punya akun? <b>Masuk</b>' : 'Belum punya akun? <b>Daftar</b>';
  setRowVisible('fullname', isDaftar);
  setRowVisible('email', isDaftar);
  setRowVisible('pass2', isDaftar);
  // a11y: ganti autocomplete sesuai mode biar password manager & paste jalan (WCAG Accessible Auth)
  p1.autocomplete = isDaftar ? 'new-password' : 'current-password';
  p2.autocomplete = 'new-password';
  err.textContent = '';
  if (un.value === '') {
    try {
      un.value = playerName() ?? '';
    } catch {
      /* abaikan */
    }
  }
  p1.value = '';
  p2.value = '';
  ov.classList.remove('hidden');
  // fokus ke error saat validasi gagal (Focusable Error Summary)
  const focusErr = (msg: string): void => {
    err.textContent = msg;
    try { err.focus(); } catch { /* abaikan */ }
  };

  submit.onclick = () => {
    const username = un.value.trim();
    if (!USER_RE.test(username)) {
      focusErr('Username 3-16 karakter (huruf/angka/._-)!');
      un.focus();
      return;
    }
    let fullname = '';
    let email = '';
    if (isDaftar) {
      fullname = fn.value.trim();
      email = em.value.trim().toLowerCase();
      if (fullname === '') {
        focusErr('Isi nama lengkapmu dulu!');
        fn.focus();
        return;
      }
      if (!EMAIL_RE.test(email)) {
        focusErr('Email tidak valid!');
        em.focus();
        return;
      }
    }
    if (p1.value.length < 4) {
      focusErr('Password min. 4 karakter!');
      p1.focus();
      return;
    }
    if (isDaftar && p1.value !== p2.value) {
      focusErr('Ulangi password tidak sama!');
      p2.focus();
      return;
    }
    err.textContent = 'Memproses... ⏳';
    const done = isDaftar ? apiDaftar(username, fullname, email, p1.value) : apiMasuk(username, p1.value);
    done
      .then((r) => {
        if (r.ok) {
          hideAuthOverlay();
          onDone(true);
        } else {
          focusErr(r.err);
        }
      })
      .catch(() => {
        focusErr('Tidak konek ke server kelas.');
      });
  };
  const switchMode = (): void => {
    showAuthOverlay(isDaftar ? 'masuk' : 'daftar', onDone);
  };
  toggle.onclick = switchMode;
  toggle.onkeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); switchMode(); }
  };
  close.onclick = () => {
    hideAuthOverlay();
    onDone(false);
  };
  // Esc untuk tutup + fokus awal ke input username
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { hideAuthOverlay(); onDone(false); }
  };
  ov.addEventListener('keydown', onKey, { once: true });
  try { un.focus(); } catch { /* abaikan */ }
}
