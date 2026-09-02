# AR Happy Birthday — apps/web

WebAR birthday cake: pilih kue 3D, letakkan di dunia nyata (WebXR), tiup lilin via mic/button, nama muncul di kue, confetti + lagu.

## Stack
- Vite + React + TypeScript
- Three.js + @react-three/fiber + drei
- WebXR Hit-Test (simulasi + fallback 3D di iOS)
- Web Audio blow detection, canvas-confetti, vite-plugin-pwa

## Run (semua di apps/web)
```bash
npm install
npm run dev     # http://localhost:5173
npm run build
npm run preview
```

Node modules & lock hanya di `apps/web` — tidak di root (siap submodule).

## Submodule
```bash
# di root repo induk
git submodule add <url> apps/web
```

## Deploy
- Vercel: `vercel.json` di root sudah point ke `apps/web/dist`
- Past HTTPS untuk WebXR + mic
- Audio: taruh `public/audio/happy-birthday.mp3` (public domain). Jika tidak ada, fallback synth Web Audio otomatis.

## QA
- Android Chrome: AR, mic
- iPhone: fallback 3D
- Mic denied / noisy / low-light
- Lighthouse: cek bundle

Lihat `openspec/changes/ar-happy-birthday` untuk spec lengkap.
