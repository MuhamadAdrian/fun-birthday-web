# 🎂 AR Happy Birthday

> **Bikin kejutan ulang tahun yang nempel di dunia nyata.** Pilih kue 3D, tulis nama, letakkan di meja ruang tamu pakai AR, lalu tiup lilinnya — beneran bisa ditiup! Confetti meledak, lagu mengalun, dan bisa dibagikan lewat satu link.

<p align="center">
  <img src="public/icons/birthday-cake-icon.png" width="88" alt="cake" />
</p>

<p align="center">
  <strong>🔗 Shareable</strong> • <strong>📱 PWA Installable</strong> • <strong>🆓 Gratis — Tanpa Install App</strong> • <strong>🤳 AR di Browser</strong>
</p>

---

### ✨ Kenapa Ini Beda?

Bukan sekadar e-card. Ini **kue yang hidup**:

- **Namanya beneran di kue** — ketik “Anya”, langsung muncul di atas kue 3D pakai tekstur dinamis
- **Ditaruh di dunia nyata** — pakai WebXR Hit-Test, tap di lantai/meja dan kue nangkring di sana
- **Bisa ditiup beneran** — tiup lewat mic 🎤 (deteksi hembusan) atau tap tombol 🎂 — lilin padam, ada efek asap
- **Payoff-nya puas** — confetti wax-drip + lagu Happy Birthday + kartu “Selamat Ulang Tahun, Anya! 🎉”
- **Kirim ke siapa aja** — satu link `?to=Anya&cake=bear-01` langsung jadi kado personal

Perfect untuk: kejutan untuk pacar, keluarga LDR, teman kantor, atau anak yang suka kue beruang 🧸

---

### 🎬 Alurnya (30 Detik Jadi)

```
1. Siapa yang ultah?  →  2. Pilih Kue  →  3. Rayakan di AR
   ketik "Bima"            🍫 Choco / 🍰 Vanilla / 🌈 Pastel / 🧸 Bear     Tap lantai → Tiup → 🎉
```

1. **Masukkan nama** — validasi 1–20 karakter, langsung sync ke URL
2. **Pilih kue** — 4 varian (2 realistis, 2 cute), preview 3D bisa diputar/zoom
3. **Rayakan** — masuk AR (Android) atau mode 3D (iPhone), letakkan, tiup, share!

> **Coba share:** `https://kamu.vercel.app/?to=Bima&cake=choco-01` — penerima buka link, kue Bima langsung nongol.

---

### 🎨 4 Kue Pilihan

| Kue | Gaya | Vibe |
|---|---|---|
| **🍫 Choco Delight** | Realistis | Coklat ganache + cherry merah — elegan |
| **🍰 Vanilla Dream** | Realistis | Buttercream putih + aksen gold — klasik |
| **🌈 Pastel Party** | Cute | Warna pastel + sprinkle rainbow — ceria |
| **🧸 Bear Hug** | Cute | Kue beruang dengan telinga pink — gemas |

Semua kue pakai material PBR, bayangan lembut, dan **plakat nama** yang update real-time.

---

### 🪄 Fitur Lengkap

- **🎂 Kue Hidup** — flame flicker (PointLight + scale), idle float, bayangan kontak
- **📍 AR Placement** — reticle, coaching “Arahkan ke lantai, gerakkan perlahan”, tap-to-place, “Pindah Kue”, handling tracking hilang
- **💨 Tiup Dual Input** — mic dengan AnalyserNode (deteksi low-freq 80–500Hz, sustain 300ms) + tombol besar — selalu bisa, bahkan di tempat berisik
- **🎉 Celebration** — confetti bentuk tetesan lilin (signature!), respect `prefers-reduced-motion`, audio dengan mute + fallback synth jika file mp3 belum ada
- **🔄 Reset Cepat** — “Nyalakan Lagi” (lilin nyala lagi) & “Ganti Kue” tanpa ulang input nama
- **🔗 Link Sakti** — `?to=` & `?cake=` via `history.replaceState`, copy dengan `Clipboard API` + fallback input manual
- **📲 PWA** — install ke home screen, offline shell, Workbox cache model & audio
- **🎨 Desain Bakery** — palet Cream #FFF8E7, Cherry #E63946, Chocolate #3A2A1A, Sprinkle #FF8FAB, Mint #A8E6CF, Gold #FFD23F — rounded, playful, shadow lembut `0 8px 24px`

---

### 📱 Dukungan Device

| Device | Mode | Pengalaman |
|---|---|---|
| **Android Chrome** | AR penuh ✅ | Kue nempel di meja beneran (WebXR Hit-Test) |
| **iPhone / Desktop** | Fallback 3D ✅ | Kue 3D interaktif (OrbitControls) — tetap bisa tiup & confetti |
| **Mic diblokir** | Tombol Tiup ✅ | Tetap rayakan tanpa mic |

> Butuh **HTTPS** untuk AR & mic — di `localhost` tetap bisa dev, di HP wajib HTTPS.

---

### 🚀 Coba Sendiri

```bash
# 1. Install (hanya di folder ini)
npm install

# 2. Dev
npm run dev
# buka http://localhost:5173 — di HP pakai ngrok / vercel preview dengan HTTPS

# 3. Build
npm run build
npm run preview
```

**Ganti lagu?** Taruh file kamu di `public/audio/happy-birthday.mp3` (mp3/ogg). Kalau tidak ada, otomatis pakai **synth Web Audio** — tetap bunyi!

**Ganti model 3D?** Taruh `.glb` (Draco compressed <2MB) di `public/models/` dan daftarkan di `src/data/cakes.ts`.

---

### 🛠 Tech di Balik Layar

- **Vite + React + TypeScript** — HMR super cepat
- **Three.js + @react-three/fiber + drei** — rendering 3D & `useHitTest`, `ContactShadows`, `Environment`
- **WebXR** — `immersive-ar` + `hit-test` + `dom-overlay`
- **Web Audio API** — `getUserMedia` + `AnalyserNode` untuk deteksi tiupan
- **canvas-confetti** — particle wax-drip custom
- **vite-plugin-pwa** — manifest + Workbox

---

### 🌟 Ide Next

- Rekam video ucapan + share
- Tambah topper angka umur
- Foto bareng kue AR (screenshot)
- Koleksi kue musiman

---

<p align="center">
  <strong>Dibuat dengan ♥ untuk bikin orang tersenyum di hari spesialnya.</strong><br/>
  Punya ide kue baru? PR welcome! 🎂
</p>

<p align="center">
  <em>Tip: Buka di HP Android Chrome untuk AR terbaik. Kirim link ke teman dan lihat reaksinya! ✨</em>
</p>
