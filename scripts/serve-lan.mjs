// Mode KELAS: build produksi -> serve di LAN -> tampilkan QR buat discan murid.
// Pakai: npm run kelas   (laptop + HP harus satu WiFi/hotspot)
import { spawn, spawnSync } from 'node:child_process';
import os from 'node:os';
import qrcode from 'qrcode-terminal';

const PORT = 4173;

function lanIps() {
  const out = [];
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const n of list || []) {
      if (n.family === 'IPv4' && !n.internal && !n.address.startsWith('169.254.') && !out.includes(n.address)) {
        out.push(n.address);
      }
    }
  }
  // Prioritaskan IP default hotspot Windows (192.168.137.1)
  out.sort((a, b) => (a === '192.168.137.1' ? -1 : b === '192.168.137.1' ? 1 : 0));
  return out;
}

console.log('> build produksi...');
const b = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: true });
if (b.status !== 0) {
  console.error('Build gagal, server tidak dijalankan.');
  process.exit(1);
}

const ips = lanIps();
const ip = ips[0] ?? 'localhost';
const url = `http://${ip}:${PORT}`;
console.log(`> serve LAN di ${url} ...`);

let printed = false;
// Server kelas all-in-one (tanpa shell) agar bersih di Windows.
const child = spawn(
  process.execPath,
  ['scripts/server.mjs'],
  { stdio: ['ignore', 'pipe', 'inherit'] }
);
child.stdout.on('data', (d) => {
  const s = String(d);
  process.stdout.write(s);
  const plain = s.replace(/\[[0-9;]*m/g, '');
  if (!printed && plain.includes('READY')) {
    printed = true;
    console.log('\n=== AKSES MURID (satu WiFi/hotspot) ===');
    qrcode.generate(url, { small: true });
    console.log(`Papan peringkat (buka di proyektor): http://${ip}:${PORT}/papan`);
    console.log(`\nKetik manual: ${url}`);
    if (ips.length > 1) {
      console.log('IP lain (coba kalau yang atas tidak konek):');
      for (const other of ips.slice(1)) console.log(`  http://${other}:${PORT}`);
    }
    console.log('Tekan Ctrl+C untuk berhenti.\n');
  }
});
