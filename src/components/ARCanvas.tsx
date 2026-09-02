"use client"

import { useCallback, useRef, Suspense, useState, useMemo, useEffect } from "react"
import * as THREE from "three"
import { Canvas } from "@react-three/fiber"
import { XR, createXRStore, XRDomOverlay, useXR } from "@react-three/xr"
import { Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei"
import { CakeModel } from "./CakeModel"
import type { CakeDefinition } from "../data/cakes"
import { HitTestPreview } from "./HitTestPreview"

// Create XR store — improvement dari code lama:
// - hitTest true untuk deteksi permukaan (world-locked)
// - domOverlay true agar UI muncul di atas video AR
// - depthSensing false (lebih ringan)
// - emulate false di production agar tidak fake di desktop
export const xrStore = createXRStore({
  hitTest: true,
  domOverlay: true,
  depthSensing: false,
  emulate: false,
  // @ts-ignore — requiredFeatures untuk hit-test, optional dom-overlay
  requiredFeatures: ["hit-test"],
  optionalFeatures: ["dom-overlay", "depth-sensing"],
} as any)

interface PlacedCake {
  position: [number, number, number]
  rotation: [number, number, number]
}

// Improvement: memoize & tidak pernah re-render setelah place, fix world-locked (tidak ikut layar)
function PlacedCakeModel({
  position,
  rotation,
  cake,
  name,
  candleLit,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  cake: CakeDefinition
  name: string
  candleLit: boolean
}) {
  // Empty deps = world anchored, tidak update saat kamera gerak
  const fixedPos = useMemo<[number, number, number]>(() => [position[0], position[1] - 0.02, position[2]], [])
  const fixedRot = useMemo<[number, number, number]>(() => [rotation[0], rotation[1], rotation[2]], [])
  return (
    <group position={fixedPos as any} rotation={fixedRot as any}>
      {/* wrapper group biar shadow & cake tidak kepotong overflow — world space, bukan CSS */}
      <CakeModel cake={cake} name={name} candleLit={candleLit} float={false} />
      {/* Ground contact shadow — tipis, tidak menutupi video */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[1.6, 1.6]} />
        <shadowMaterial opacity={0.28} />
      </mesh>
    </group>
  )
}

function ARContent({
  cake,
  name,
  candleLit,
  placedCake,
  onPlace,
}: {
  cake: CakeDefinition
  name: string
  candleLit: boolean
  placedCake: PlacedCake | null
  onPlace: (pos: [number, number, number], rot: [number, number, number]) => void
}) {
  const hitPositionRef = useRef<[number, number, number]>([0, 0, 0])
  const hitRotationRef = useRef<[number, number, number]>([0, 0, 0])
  const [hasValidHit, setHasValidHit] = useState(false)
  const xrSession = useXR((s: any) => s.session)
  const isInSession = !!xrSession

  const handleHitTest = useCallback(
    (position: [number, number, number], rotation: [number, number, number]) => {
      hitPositionRef.current = [position[0], position[1], position[2]]
      hitRotationRef.current = [rotation[0], rotation[1], rotation[2]]
      if (!hasValidHit) setHasValidHit(true)
    },
    [hasValidHit],
  )

  const handlePlaceCake = useCallback(() => {
    if (hasValidHit) {
      const finalPos: [number, number, number] = [
        hitPositionRef.current[0],
        hitPositionRef.current[1],
        hitPositionRef.current[2],
      ]
      const finalRot: [number, number, number] = [
        hitRotationRef.current[0],
        hitRotationRef.current[1],
        hitRotationRef.current[2],
      ]
      onPlace(finalPos, finalRot)
    }
  }, [onPlace, hasValidHit])

  return (
    <>
      {/* Hit test reticle — hanya saat belum place & di dalam XR session, world-locked via hit matrix */}
      {!placedCake && isInSession && (
        <HitTestPreview onHitTest={handleHitTest} visible={true} />
      )}

      {/* Placed cake — world anchored, tidak ikut layar, tidak kepotong container */}
      {placedCake && (
        <PlacedCakeModel position={placedCake.position} rotation={placedCake.rotation} cake={cake} name={name} candleLit={candleLit} />
      )}

      {/* AR lighting — terang agar kue tidak gelap di video */}
      <ambientLight intensity={1.15} />
      <directionalLight position={[2, 4, 2]} intensity={1.3} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-2, 3, -1]} intensity={0.5} />
      <hemisphereLight args={["#ffffff", "#444444", 0.6]} />

      {/* DOM Overlay — tombol harus di dalam XRDomOverlay agar muncul di atas video AR (bukan CSS overlay biasa) */}
      <XRDomOverlay>
        <div className="fixed inset-0 pointer-events-none">
          {!placedCake && isInSession && (
            <div className="fixed bottom-8 left-0 right-0 flex flex-col items-center gap-4 pointer-events-auto px-4">
              {!hasValidHit ? (
                <div className="bg-black/70 px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-white text-center text-sm font-medium">Arahkan kamera ke lantai atau meja</p>
                  <p className="text-white/70 text-center text-xs mt-1">Gerakkan perlahan, tunggu reticle stabil</p>
                </div>
              ) : (
                <div className="bg-green-500/90 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
                  <p className="text-white text-center text-sm font-bold">✓ Permukaan terdeteksi!</p>
                </div>
              )}
              <button
                onClick={handlePlaceCake}
                disabled={!hasValidHit}
                className={`rounded-full px-8 py-4 text-base font-bold shadow-xl transition-all flex items-center gap-2 ${
                  hasValidHit ? "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 active:scale-95 text-white" : "bg-gray-500/60 text-white/60 cursor-not-allowed"
                }`}
              >
                <span className="text-xl">🎂</span> {hasValidHit ? "Taruh Kue Disini" : "Mencari permukaan..."}
              </button>
              {!hasValidHit && <p className="text-white/60 text-[11px] text-center max-w-[280px]">Pastikan ruangan terang & lantai bertekstur (jangan polos mengkilap)</p>}
            </div>
          )}
          {placedCake && isInSession && (
            <div className="fixed bottom-4 left-0 right-0 flex flex-col items-center gap-3 pointer-events-auto px-4">
              <div className="bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10">
                <p className="text-white text-xs font-medium text-center">✓ Kue tertanam di dunia nyata — gerakkan HP, kue tetap di tempat (world-locked)</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    // reset — akan di-handle parent via onPlace null? kita trigger custom event
                    window.dispatchEvent(new CustomEvent("ar-reset"))
                  }}
                  className="bg-white/90 hover:bg-white text-slate-800 rounded-full px-5 py-3 text-sm font-bold shadow-lg flex items-center gap-2"
                >
                  ↺ Pindah Kue
                </button>
                <button
                  onClick={async () => {
                    try { await (xrSession as any)?.end?.(); } catch {}
                    try { await (xrStore as any).getState?.()?.session?.end?.() } catch {}
                  }}
                  className="bg-slate-800/80 hover:bg-slate-700 text-white rounded-full px-5 py-3 text-sm font-bold shadow-lg border border-white/10"
                >
                  Keluar AR
                </button>
              </div>
            </div>
          )}
        </div>
      </XRDomOverlay>
    </>
  )
}

function FallbackScene({ cake, name, candleLit }: { cake: CakeDefinition; name: string; candleLit: boolean }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0.8, 0.9, 1.2]} fov={42} />
      <OrbitControls
        enablePan={false}
        minDistance={0.5}
        maxDistance={2.2}
        target={[0, 0.05, 0]}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={!false}
        autoRotateSpeed={0.7}
      />
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 2]} intensity={1.0} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-2, 2, -1]} intensity={0.35} />
      {/* Ground — tidak overflow hidden, full visible, shadow subtle */}
      <CakeModel cake={cake} name={name} candleLit={candleLit} float={true} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.58, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <shadowMaterial opacity={0.22} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.585, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#fdf6e3" roughness={0.9} />
      </mesh>
    </>
  )
}

export function ARCanvas({
  cake,
  name,
  candleLit,
  onPlaced,
}: {
  cake: CakeDefinition
  name: string
  candleLit: boolean
  onPlaced?: (placed: boolean) => void
}) {
  const [placedCake, setPlacedCake] = useState<PlacedCake | null>(null)
  const [arSupported, setArSupported] = useState<boolean | null>(null)
  const [checkReason, setCheckReason] = useState("")
  const [isARMode, setIsARMode] = useState(false)
  const [xrSessionActive, setXrSessionActive] = useState(false)

  // Cek dukungan XR untuk UI entry — pakai useEffect bukan useMemo
  useEffect(() => {
    if (typeof navigator === "undefined") return
    const isSecure = window.isSecureContext
    const ua = navigator.userAgent
    if (!isSecure) {
      setArSupported(false)
      setCheckReason("Butuh HTTPS untuk AR asli. Buka via https://")
      return
    }
    const nav: any = navigator
    if (nav.xr?.isSessionSupported) {
      nav.xr
        .isSessionSupported("immersive-ar")
        .then((ok: boolean) => {
          setArSupported(ok)
          setCheckReason(ok ? "✅ Support immersive-ar — kue akan world-locked" : "Perangkat tidak support hit-test. Fallback 3D tersedia.")
        })
        .catch(() => {
          setArSupported(false)
          setCheckReason("Gagal cek AR")
        })
    } else {
      setArSupported(false)
      const isAndroid = /Android/i.test(ua)
      setCheckReason(isAndroid ? "ARCore belum aktif / pakai Chrome" : "Browser tidak support WebXR")
    }
  }, [])

  // Subscribe ke xrStore untuk tahu session aktif (tidak pakai useXR di luar XR provider)
  useEffect(() => {
    const unsub = (xrStore as any).subscribe((state: any) => {
      setXrSessionActive(!!state.session)
      if (state.session) setIsARMode(true)
      if (!state.session) setIsARMode(false)
    })
    // initial check
    try {
      const s: any = (xrStore as any).getState?.()
      if (s?.session) setXrSessionActive(true)
    } catch {}
    return () => {
      try { (unsub as any)?.() } catch {}
    }
  }, [])

  const handlePlace = useCallback(
    (pos: [number, number, number], rot: [number, number, number]) => {
      setPlacedCake({ position: pos, rotation: rot })
      onPlaced?.(true)
    },
    [onPlaced],
  )

  // Dengarkan reset dari overlay — pakai useEffect
  useEffect(() => {
    const h = () => {
      setPlacedCake(null)
      onPlaced?.(false)
    }
    if (typeof window !== "undefined") window.addEventListener("ar-reset" as any, h)
    return () => window.removeEventListener("ar-reset" as any, h)
  }, [onPlaced])

  return (
    <div className="ar-root">
      {/* Entry UI — sebelum masuk AR */}
      {!isARMode && !xrSessionActive && (
        <div className="ar-entry">
          <div className="ar-entry-preview">
            <Canvas
              camera={{ position: [0, 1.1, 2.6], fov: 45 }}
              shadows
              gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
              style={{ background: "transparent" }}
            >
              <FallbackScene cake={cake} name={name} candleLit={candleLit} />
            </Canvas>
          </div>
          <div className="ar-entry-actions">
            <div className={`ar-ready ${arSupported ? "" : "ar-ready-warn"}`}>{arSupported ? "AR Siap ✨" : arSupported === false ? "Mode 3D" : "Mengecek AR..."}</div>
            <p className="ar-desc">
              {arSupported ? "Letakkan kue di lantai/meja dunia nyata — deteksi permukaan otomatis." : "AR asli butuh Chrome Android + HTTPS + ARCore. Tetap bisa lihat 3D & coba simulasi."}
            </p>
            {checkReason && <p className="ar-reason">{checkReason}</p>}
            <button
              className={`btn primary large ${arSupported === false ? "btn-disabled" : ""}`}
              onClick={async () => {
                setIsARMode(true)
                try {
                  await xrStore.enterAR()
                } catch (e) {
                  console.warn("enterAR gagal", e)
                  // fallback: tetap masuk mode AR simulasi (akan render fallback jika session tidak terbentuk)
                  // Jika gagal, biar Canvas tetap fallback
                  setIsARMode(false)
                  alert("Gagal masuk AR: " + (e as Error).message + "\n\nPastikan HTTPS, Chrome Android, & ARCore terinstall.")
                }
              }}
            >
              {arSupported ? "Lihat di Dunia Nyata →" : "Coba AR (jika support) →"}
            </button>
            <div className="ar-note">Di iPhone / tanpa ARCore akan otomatis fallback ke 3D interaktif (tidak kepotong, full visible).</div>
            {arSupported === false && (
              <details className="ar-diag">
                <summary>🔍 Diagnosis</summary>
                <div>Secure: {String(typeof window !== "undefined" && window.isSecureContext)} • Protocol: {typeof window !== "undefined" ? window.location.protocol : "-"}</div>
                <div>Has xr: {String(typeof navigator !== "undefined" && !!(navigator as any).xr)}</div>
              </details>
            )}
          </div>
        </div>
      )}

      {/* XR Canvas — mount selalu, tapi transparan saat AR aktif; fallback tidak kepotong */}
      <div className={`ar-xr-wrap ${isARMode || xrSessionActive ? "ar-xr-wrap--active" : "ar-xr-wrap--hidden"}`}>
        <Canvas
          onCreated={(state) => {
            try {
              state.gl.shadowMap.type = THREE.PCFShadowMap
              // @ts-ignore — xr enabled ditangani oleh @react-three/xr, tapi pastikan alpha
              state.gl.setClearColor(0x000000, 0)
            } catch {}
          }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          shadows
          // Improvement: tidak overflow hidden, biar kue tidak kepotong; XR pakai fullscreen transparent
          style={{ background: xrSessionActive ? "transparent" : "#1a1a2e", width: "100%", height: xrSessionActive ? "100vh" : "520px", display: "block" }}
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
          frameloop="always"
        >
          <Suspense fallback={null}>
            <XR store={xrStore}>
              {/* Saat session aktif, ARContent dengan hit-test world-locked. Saat tidak, tetap fallback agar tidak blank */}
              <ARContent cake={cake} name={name} candleLit={candleLit} placedCake={placedCake} onPlace={handlePlace} />
              {/* FallbackScene selalu ada untuk non-XR, tapi di-hide saat XR aktif via NotInXR */}
              {!xrSessionActive && <FallbackScene cake={cake} name={name} candleLit={candleLit} />}
            </XR>
          </Suspense>
        </Canvas>
        {/* Keluar AR — di luar XRDomOverlay agar selalu bisa klik */}
        {(isARMode || xrSessionActive) && (
          <div className="ar-xr-exit">
            <button
              className="btn ghost"
              onClick={async () => {
                try {
                  const s: any = (xrStore as any).getState?.()?.session
                  await s?.end?.()
                } catch {}
                try { await (xrStore as any).getState?.().session?.end?.() } catch {}
                setIsARMode(false)
                setPlacedCake(null)
                onPlaced?.(false)
              }}
            >
              ✕ Keluar AR
            </button>
          </div>
        )}
      </div>

      <style>{`
        .ar-root{ position:relative; width:100%; }
        .ar-entry{ background:#fff; border-radius: var(--radius-lg); overflow:visible; box-shadow: var(--shadow-bakery); border:2px solid #fff; }
        .ar-entry-preview{ height:380px; background: radial-gradient(120% 120% at 50% 0%, #FFF8E7 0%, #F5EBD0 100%); border-radius: var(--radius-lg); overflow:visible; position:relative; }
        .ar-entry-preview canvas{ width:100% !important; height:100% !important; display:block; overflow:visible !important; }
        .ar-entry-actions{ padding:16px; text-align:center; }
        .ar-ready{ display:inline-block; background: var(--color-mint); color: var(--color-chocolate); font:800 12px var(--font-body); letter-spacing:.08em; text-transform:uppercase; padding:6px 12px; border-radius:999px; }
        .ar-ready-warn{ background: #ffe08a; }
        .ar-desc{ font: 500 13px var(--font-body); color: rgba(58,42,26,0.7); margin:10px 0 8px; line-height:1.5; }
        .ar-reason{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.6); background: var(--color-cream-dark); padding:6px 8px; border-radius:8px; margin:0 0 10px; }
        .ar-note{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.5); margin-top:10px; }
        .ar-diag{ text-align:left; font: 500 10px var(--font-mono); color: rgba(58,42,26,0.6); margin-top:8px; background:#fff; border:1px solid #eee; border-radius:8px; padding:6px 8px; }
        .btn{ font:700 13px var(--font-body); padding:10px 16px; border-radius:999px; border:none; cursor:pointer; transition: all .15s; }
        .btn.primary{ background: var(--color-cherry); color:#fff; box-shadow: 0 6px 16px rgba(230,57,70,0.35); }
        .btn.primary:hover{ background:#d5303e; }
        .btn.large{ padding:14px 24px; font-size:15px; width:100%; }
        .btn.ghost{ background: rgba(255,255,255,0.92); color: var(--color-chocolate); backdrop-filter: blur(8px); border:1px solid rgba(0,0,0,0.06); }
        .btn-disabled{ opacity:0.7; }
        .ar-xr-wrap{ position:relative; width:100%; border-radius: var(--radius-lg); overflow:visible; margin-top:12px; }
        .ar-xr-wrap--hidden{ display:none; }
        .ar-xr-wrap--active{ display:block; position:fixed; inset:0; z-index: 40; background: transparent; border-radius:0; margin:0; }
        .ar-xr-wrap--active canvas{ height:100vh !important; }
        .ar-xr-exit{ position:fixed; top:12px; right:12px; z-index:50; }
        /* Fallback & XR canvas jangan kepotong */
        .ar-xr-wrap canvas, .ar-entry-preview canvas{ overflow:visible !important; }
      `}</style>
    </div>
  )
}
