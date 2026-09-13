import { apiDaftar, apiMasuk, playerName } from './util';

// Form daftar/masuk berupa overlay HTML (keyboard HP asli + password tertutup).
// Dipakai sebelum kirim review.

function el<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function setRowVisible(id: string, show: boolean): void {
  const r = el('auth-' + id + '-row');
  if (r !== null) r.style.display = show ? '' : 'none';
}

export function hideAuthOverlay(): void {
  el('auth-overlay')?.classList.add('hidden');
}

export function showAuthOverlay(mode: 'daftar' | 'masuk', onDone: (ok: boolean) => void): void {
  const ov = el('auth-overlay');
  const title = el('auth-title');
  const nm = el<HTMLInputElement>('auth-nama');
  const kl = el<HTMLInputElement>('auth-kelas');
  const p1 = el<HTMLInputElement>('auth-pass');
  const p2 = el<HTMLInputElement>('auth-pass2');
  const err = el('auth-err');
  const submit = el<HTMLButtonElement>('auth-submit');
  const toggle = el('auth-toggle');
  const close = el('auth-close');
  if (ov === null || title === null || nm === null || kl === null || p1 === null || p2 === null ||
      err === null || submit === null || toggle === null || close === null) {
    onDone(false);
    return;
  }
  const isDaftar = mode === 'daftar';
  title.textContent = isDaftar ? 'Daftar Akun' : 'Masuk Akun';
  submit.textContent = isDaftar ? 'DAFTAR' : 'MASUK';
  toggle.innerHTML = isDaftar ? 'Sudah punya akun? <b>Masuk</b>' : 'Belum punya akun? <b>Daftar</b>';
  setRowVisible('kelas', isDaftar);
  setRowVisible('pass2', isDaftar);
  // a11y: ganti autocomplete sesuai mode biar password manager & paste jalan (WCAG Accessible Auth)
  p1.autocomplete = isDaftar ? 'new-password' : 'current-password';
  p2.autocomplete = 'new-password';
  err.textContent = '';
  if (nm.value === '') {
    try {
      nm.value = playerName() ?? '';
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
    const nama = nm.value.trim();
    const kelas = kl.value.trim();
    if (nama === '') {
      focusErr('Isi namamu dulu!');
      nm.focus();
      return;
    }
    if (isDaftar && kelas === '') {
      focusErr('Isi kelasmu dulu! (mis. Elektro-A)');
      kl.focus();
      return;
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
    const done = isDaftar ? apiDaftar(nama, kelas, p1.value) : apiMasuk(nama, p1.value);
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
  // Esc untuk tutup + fokus awal ke input nama
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { hideAuthOverlay(); onDone(false); }
  };
  ov.addEventListener('keydown', onKey, { once: true });
  try { nm.focus(); } catch { /* abaikan */ }
}
