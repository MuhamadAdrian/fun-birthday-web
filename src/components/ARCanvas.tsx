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
// - hitTest optional (bukan required) agar "not supported" tidak muncul di device tanpa hit-test
// - domOverlay true agar UI muncul di atas video AR
// - depthSensing false (lebih ringan)
// - emulate false di production agar tidak fake di desktop
export const xrStore = createXRStore({
  hitTest: true,
  domOverlay: true,
  depthSensing: false,
  emulate: false,
  // Jangan paksa hit-test sebagai required — biar session tetap bisa start walau hit-test tidak support, fallback ke placement di depan kamera
  requiredFeatures: [],
  optionalFeatures: ["hit-test", "dom-overlay", "depth-sensing", "anchors"],
} as any)

interface PlacedCake {
  position: [number, number, number]
  rotation: [number, number, number]
}

// Improvement: memoize & tidak pernah re-render setelah place, fix world-locked (tidak ikut layar)
// scale dinamis agar kue tidak terlalu besar & bisa diatur user
function PlacedCakeModel({
  position,
  rotation,
  cake,
  name,
  candleLit,
  scale = 0.6,
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  cake: CakeDefinition
  name: string
  candleLit: boolean
  scale?: number
}) {
  // Empty deps untuk pos/rot = world anchored, tapi scale ikut prop agar dinamis
  const fixedPos = useMemo<[number, number, number]>(() => [position[0], position[1] - 0.02, position[2]], [])
  const fixedRot = useMemo<[number, number, number]>(() => [rotation[0], rotation[1], rotation[2]], [])
  return (
    <group position={fixedPos as any} rotation={fixedRot as any} scale={[scale, scale, scale] as any}>
      {/* wrapper group biar shadow & cake tidak kepotong overflow — world space, bukan CSS */}
      <CakeModel cake={cake} name={name} candleLit={candleLit} float={false} />
      {/* Ground contact shadow — tipis, tidak menutupi video, scale ikut kue */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
        <planeGeometry args={[1.6 / scale, 1.6 / scale]} />
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
  onBlow,
  cakeScale,
  onScaleChange,
}: {
  cake: CakeDefinition
  name: string
  candleLit: boolean
  placedCake: PlacedCake | null
  onPlace: (pos: [number, number, number], rot: [number, number, number]) => void
  onBlow?: () => void
  cakeScale: number
  onScaleChange: (s: number) => void
}) {
  const hitPositionRef = useRef<[number, number, number]>([0, 0, 0])
  const hitRotationRef = useRef<[number, number, number]>([0, 0, 0])
  const [hasValidHit, setHasValidHit] = useState(false)
  const xrSession = useXR((s: any) => s.session)
  const isInSession = !!xrSession
  const [hitTestFailed, setHitTestFailed] = useState(false)

  // Fallback jika hit-test tidak tersedia setelah 4 detik — tetap izinkan placement di depan kamera
  useEffect(() => {
    if (!isInSession || hasValidHit) return
    const t = setTimeout(() => {
      if (!hasValidHit) setHitTestFailed(true)
    }, 4000)
    return () => clearTimeout(t)
  }, [isInSession, hasValidHit])

  const handleHitTest = useCallback(
    (position: [number, number, number], rotation: [number, number, number]) => {
      hitPositionRef.current = [position[0], position[1], position[2]]
      hitRotationRef.current = [rotation[0], rotation[1], rotation[2]]
      if (!hasValidHit) setHasValidHit(true)
      if (hitTestFailed) setHitTestFailed(false)
    },
    [hasValidHit, hitTestFailed],
  )

  const handlePlaceCake = useCallback(() => {
    // Jika hit-test valid, pakai posisi hit. Jika tidak (device tidak support hit-test), pakai fallback di depan kamera 1.2m
    const finalPos: [number, number, number] = hasValidHit
      ? [hitPositionRef.current[0], hitPositionRef.current[1], hitPositionRef.current[2]]
      : [0, -0.3, -1.2]
    const finalRot: [number, number, number] = hasValidHit
      ? [hitRotationRef.current[0], hitRotationRef.current[1], hitRotationRef.current[2]]
      : [0, 0, 0]
    onPlace(finalPos, finalRot)
  }, [onPlace, hasValidHit])

  return (
    <>
      {/* Hit test reticle — hanya saat belum place & di dalam XR session, world-locked via hit matrix */}
      {!placedCake && isInSession && (
        <HitTestPreview onHitTest={handleHitTest} visible={true} />
      )}

      {/* Placed cake — world anchored, tidak ikut layar, tidak kepotong container, scale dinamis */}
      {placedCake && (
        <PlacedCakeModel position={placedCake.position} rotation={placedCake.rotation} cake={cake} name={name} candleLit={candleLit} scale={cakeScale} />
      )}

      {/* AR lighting — terang agar kue tidak gelap di video */}
      <ambientLight intensity={1.15} />
      <directionalLight position={[2, 4, 2]} intensity={1.3} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-2, 3, -1]} intensity={0.5} />
      <hemisphereLight args={["#ffffff", "#444444", 0.6]} />

      {/* DOM Overlay — pakai CSS custom (bukan Tailwind) agar styling muncul di XR overlay */}
      <XRDomOverlay>
        <div className="xr-overlay">
          {!placedCake && isInSession && (
            <div className="xr-place-ui">
              {!hasValidHit && !hitTestFailed ? (
                <div className="xr-card xr-card--dark">
                  <p className="xr-card-title">Arahkan kamera ke lantai atau meja</p>
                  <p className="xr-card-sub">Gerakkan perlahan, tunggu reticle stabil</p>
                </div>
              ) : hasValidHit ? (
                <div className="xr-badge xr-badge--success">✓ Permukaan terdeteksi!</div>
              ) : (
                <div className="xr-badge xr-badge--warn">⚠️ Hit-test tidak tersedia — kue akan di depan kamera</div>
              )}
              <button onClick={handlePlaceCake} className={`btn xr-btn ${hasValidHit || hitTestFailed ? "primary" : "ghost"}`} style={{ opacity: hasValidHit || hitTestFailed ? 1 : 0.6 }}>
                <span>🎂</span> {hasValidHit ? "Taruh Kue Disini" : hitTestFailed ? "Taruh Kue (Fallback)" : "Mencari permukaan..."}
              </button>
              {!hasValidHit && !hitTestFailed && <p className="xr-hint">Pastikan ruangan terang & lantai bertekstur</p>}
            </div>
          )}
          {placedCake && isInSession && (
            <div className="xr-placed-ui">
              <div className="xr-card xr-card--dark xr-card--small">✓ Kue tertanam — gerakkan HP, kue tetap world-locked</div>
              <div className="xr-controls">
                <div className="xr-scale">
                  <span className="xr-scale-label">Ukuran</span>
                  <button className="btn ghost sm" onClick={() => onScaleChange(Math.max(0.35, cakeScale - 0.08))}>− Kecil</button>
                  <span className="xr-scale-val">{Math.round(cakeScale * 100)}%</span>
                  <button className="btn ghost sm" onClick={() => onScaleChange(Math.min(1.2, cakeScale + 0.08))}>+ Besar</button>
                </div>
                <div className="xr-actions">
                  <button onClick={() => window.dispatchEvent(new CustomEvent("ar-reset"))} className="btn ghost">
                    ↺ Pindah
                  </button>
                  {onBlow && (
                    <button onClick={onBlow} disabled={!candleLit} className={`btn ${candleLit ? "primary" : "ghost"}`}>
                      {candleLit ? "💨 Tiup Lilin" : "✓ Padam"}
                    </button>
                  )}
                  <button
                    onClick={async () => {
                      try { await (xrSession as any)?.end?.(); } catch {}
                      try { await (xrStore as any).getState?.()?.session?.end?.() } catch {}
                    }}
                    className="btn ghost"
                  >
                    ✕ Keluar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </XRDomOverlay>
    </>
  )
}

function FallbackScene({ cake, name, candleLit, scale = 0.75 }: { cake: CakeDefinition; name: string; candleLit: boolean; scale?: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0.9, 1.0, 1.4]} fov={40} />
      <OrbitControls
        enablePan={false}
        minDistance={0.6}
        maxDistance={2.4}
        target={[0, 0.05, 0]}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate={!false}
        autoRotateSpeed={0.6}
      />
      <Environment preset="studio" background={false} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 2]} intensity={1.0} castShadow shadow-mapSize={1024} />
      <directionalLight position={[-2, 2, -1]} intensity={0.35} />
      {/* Ground — tidak overflow hidden, full visible, shadow subtle, scale dinamis */}
      <group scale={[scale, scale, scale]}>
        <CakeModel cake={cake} name={name} candleLit={candleLit} float={true} />
      </group>
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
  onBlow,
}: {
  cake: CakeDefinition
  name: string
  candleLit: boolean
  onPlaced?: (placed: boolean) => void
  onBlow?: () => void
}) {
  const [placedCake, setPlacedCake] = useState<PlacedCake | null>(null)
  const [arSupported, setArSupported] = useState<boolean | null>(null)
  const [checkReason, setCheckReason] = useState("")
  const [isARMode, setIsARMode] = useState(false)
  const [xrSessionActive, setXrSessionActive] = useState(false)
  const [cakeScale, setCakeScale] = useState(0.62)
  // Fallback video AR untuk device yang tidak support WebXR hit-test (error not supported)
  const [videoFallback, setVideoFallback] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [videoPlaced, setVideoPlaced] = useState(false)
  const [videoPlacedPos, setVideoPlacedPos] = useState<{ x: number; y: number } | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

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

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }
  useEffect(() => () => stopVideo(), [])

  const startVideoFallback = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("getUserMedia tidak support")
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
    } catch (e: any) {
      const msg = e?.name === "NotAllowedError" ? "Izin kamera ditolak" : e?.message || "Gagal akses kamera"
      setCameraError(window.isSecureContext ? msg : "Butuh HTTPS untuk kamera")
    }
  }

  return (
    <div className="ar-root">
      {/* Entry UI — sebelum masuk AR, tampil di atas preview */}
      {!xrSessionActive && (
        <div className="ar-entry">
          <div className="ar-entry-actions">
            <div className={`ar-ready ${arSupported ? "" : "ar-ready-warn"}`}>{arSupported ? "AR Siap ✨" : arSupported === false ? "Mode 3D — Simulasi" : "Mengecek AR..."}</div>
            <p className="ar-desc">
              {arSupported ? "Letakkan kue di lantai/meja dunia nyata — deteksi permukaan otomatis (world-locked)." : "AR asli butuh Chrome Android + HTTPS + ARCore. Tetap bisa lihat 3D preview di bawah."}
            </p>
            {checkReason && <p className="ar-reason">{checkReason}</p>}
            {/* Ukuran kue dinamis — bisa diatur sebelum masuk AR, biar tidak terlalu besar */}
            <div className="ar-scale ar-scale--entry">
              <span className="ar-scale-label">Ukuran kue</span>
              <div className="ar-scale-row">
                <button className="btn ghost sm" onClick={() => setCakeScale((s) => Math.max(0.35, s - 0.08))}>− Kecil</button>
                <span className="ar-scale-val">{Math.round(cakeScale * 100)}%</span>
                <button className="btn ghost sm" onClick={() => setCakeScale((s) => Math.min(1.15, s + 0.08))}>+ Besar</button>
              </div>
              <span className="ar-scale-hint">Geser sebelum masuk AR • di dalam AR juga bisa ubah</span>
            </div>
            <button
              className="btn primary large"
              onClick={async () => {
                // Jika sudah tau tidak support, langsung fallback video tanpa coba XR
                if (arSupported === false) {
                  setVideoFallback(true)
                  setVideoPlaced(false)
                  setVideoPlacedPos(null)
                  setTimeout(() => startVideoFallback(), 100)
                  return
                }
                // Pastikan Canvas XR sudah mount sebelum enterAR — delay 60ms untuk React commit
                setIsARMode(true)
                await new Promise((r) => setTimeout(r, 60))
                try {
                  await xrStore.enterAR()
                } catch (e: any) {
                  console.warn("enterAR gagal", e)
                  const msg = e?.message || ""
                  const isNotSupported = msg.includes("not supported") || msg.includes("notSupported") || msg.includes("supported")
                  setIsARMode(false)
                  if (isNotSupported) {
                    // Fallback ke video AR (kamera + tap placement) bukan cuma alert
                    setVideoFallback(true)
                    setVideoPlaced(false)
                    setVideoPlacedPos(null)
                    setTimeout(() => startVideoFallback(), 100)
                  } else {
                    const friendly = msg.includes("not connected") || msg.includes("XR") ? "XR belum siap — coba tap lagi. Pastikan Canvas sudah load & pakai HTTPS di Chrome Android." : msg || "unknown"
                    alert("Gagal Masuk AR: " + friendly + "\n\nPastikan https, Chrome Android & ARCore terinstall. Fallback video akan dicoba.")
                    // tetap coba video fallback
                    setVideoFallback(true)
                    setTimeout(() => startVideoFallback(), 100)
                  }
                }
              }}
            >
              {arSupported ? "Lihat di Dunia Nyata →" : "Coba AR (Video Fallback) →"}
            </button>
            <div className="ar-note">{arSupported ? "Kue akan world-locked via hit-test, tidak ikut layar, tidak kepotong." : "Akan pakai kamera video fallback (tap untuk letakkan) — tetap full visible."}</div>
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

      {/* Video Fallback untuk "not supported" — pakai kamera getUserMedia + tap placement (tidak world-locked tapi full visible, tidak kepotong) */}
      {videoFallback && !xrSessionActive && (
        <div className="ar-video-fallback">
          <div
            className="ar-video-camera"
            onClick={(e) => {
              if (videoPlaced) {
                // tap untuk pindah
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                setVideoPlacedPos({ x: Math.min(70, Math.max(30, x)), y: Math.min(75, Math.max(35, y)) })
                setVideoPlaced(true)
              } else {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const x = ((e.clientX - rect.left) / rect.width) * 100
                const y = ((e.clientY - rect.top) / rect.height) * 100
                setVideoPlacedPos({ x: Math.min(70, Math.max(30, x)), y: Math.min(75, Math.max(35, y)) })
                setVideoPlaced(true)
              }
            }}
          >
            <video ref={videoRef} autoPlay playsInline muted className="ar-video-el" />
            {cameraError && <div className="ar-video-error">⚠️ {cameraError}</div>}
            {!videoPlaced ? (
              <>
                <div className="reticle video-reticle" />
                <div className="coaching video-coaching">
                  <div className="coaching-title">Tap di video untuk letakkan kue 🎂</div>
                  <div className="coaching-sub">Mode fallback — kue akan di layar (bukan hit-test)</div>
                </div>
              </>
            ) : (
              <div
                className="placed-canvas video-placed"
                style={{ left: `${videoPlacedPos?.x ?? 50}%`, top: `${videoPlacedPos?.y ?? 60}%`, transform: "translate(-50%, -50%)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="placed-canvas-inner">
                  <Canvas camera={{ position: [0, 0.7, 1.9], fov: 44 }} shadows gl={{ alpha: true, antialias: true }} style={{ background: "transparent" }}>
                    <ambientLight intensity={1} />
                    <directionalLight position={[2, 4, 2]} intensity={1.1} castShadow />
                    <group scale={[cakeScale, cakeScale, cakeScale]}>
                      <CakeModel cake={cake} name={name} candleLit={candleLit} float={false} />
                    </group>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
                      <planeGeometry args={[1.8, 1.8]} />
                      <shadowMaterial opacity={0.28} />
                    </mesh>
                  </Canvas>
                </div>
              </div>
            )}
          </div>
          <div className="ar-video-controls">
            <div className="ar-scale ar-scale--video">
              <span className="ar-scale-label">Ukuran</span>
              <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setCakeScale((s) => Math.max(0.35, s - 0.08)); }}>−</button>
              <span className="ar-scale-val">{Math.round(cakeScale * 100)}%</span>
              <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setCakeScale((s) => Math.min(1.15, s + 0.08)); }}>+</button>
            </div>
            <div className="ar-video-actions">
              <button
                className="btn ghost"
                onClick={() => {
                  setVideoFallback(false)
                  setVideoPlaced(false)
                  stopVideo()
                }}
              >
                ✕ Keluar Video
              </button>
              {videoPlaced && (
                <>
                  <button className="btn secondary" onClick={() => setVideoPlaced(false)}>
                    ↺ Pindah
                  </button>
                  {onBlow && (
                    <button onClick={onBlow} disabled={!candleLit} className={`btn ${candleLit ? "primary" : "ghost"}`}>
                      {candleLit ? "💨 Tiup Lilin" : "✓ Padam"}
                    </button>
                  )}
                </>
              )}
            </div>
            <span className="ar-hint">Fallback video — tap untuk pindah, tombol ukuran di atas</span>
          </div>
        </div>
      )}

      {/* XR Canvas — SELALU MOUNT agar xrStore terhubung ke Three.js, jangan display:none */}
      {!videoFallback && (
        <div className={`ar-xr-wrap ${xrSessionActive ? "ar-xr-wrap--active" : "ar-xr-wrap--preview"}`}>
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
              <ARContent cake={cake} name={name} candleLit={candleLit} placedCake={placedCake} onPlace={handlePlace} onBlow={onBlow} cakeScale={cakeScale} onScaleChange={setCakeScale} />
              {/* FallbackScene selalu ada untuk non-XR, tapi di-hide saat XR aktif via NotInXR */}
              {!xrSessionActive && <FallbackScene cake={cake} name={name} candleLit={candleLit} scale={cakeScale} />}
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
      )}

      <style>{`
        .ar-root{ position:relative; width:100%; }
        .ar-entry{ background:#fff; border-radius: var(--radius-lg); overflow:visible; box-shadow: var(--shadow-bakery); border:2px solid #fff; margin-bottom:12px; }
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
        .ar-xr-wrap{ position:relative; width:100%; border-radius: var(--radius-lg); overflow:visible; }
        .ar-xr-wrap--preview{ display:block; height:420px; background: radial-gradient(120% 120% at 50% 0%, #FFF8E7 0%, #F5EBD0 100%); border:2px solid #fff; box-shadow: var(--shadow-bakery); overflow:visible; }
        .ar-xr-wrap--preview canvas{ height:420px !important; }
        .ar-xr-wrap--active{ display:block; position:fixed; inset:0; z-index: 40; background: transparent; border-radius:0; }
        .ar-xr-wrap--active canvas{ height:100vh !important; }
        .ar-xr-exit{ position:fixed; top:12px; right:12px; z-index:50; }
        /* Canvas jangan kepotong — world-locked, bukan CSS overflow */
        .ar-xr-wrap canvas{ overflow:visible !important; width:100% !important; height:100% !important; display:block; }
        /* Video fallback — saat XR not supported, pakai video getUserMedia, tetap full visible */
        .ar-video-fallback{ background:#fff; border-radius: var(--radius-lg); overflow:visible; box-shadow: var(--shadow-bakery); border:2px solid #fff; margin-top:12px; }
        .ar-video-camera{ position:relative; height:480px; background:#0a0a0a; overflow:visible; display:grid; place-items:center; border-radius: var(--radius-lg); }
        @media(max-width:600px){ .ar-video-camera{ height:420px; } }
        .ar-video-el{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius: var(--radius-lg); }
        .ar-video-error{ position:absolute; top:12px; left:12px; right:12px; background: rgba(230,57,70,0.92); color:#fff; padding:8px 10px; border-radius:12px; text-align:center; z-index:4; font:700 12px var(--font-body); }
        .ar-video-controls{ display:flex; gap:10px; align-items:center; justify-content:space-between; padding:12px; background:#fff; border-radius: 0 0 var(--radius-lg) var(--radius-lg); flex-wrap:wrap; }
        .ar-scale{ display:flex; flex-direction:column; gap:6px; align-items:center; background: var(--color-cream-dark); padding:10px 12px; border-radius:12px; margin:10px 0; }
        .ar-scale--entry{ margin:10px 0; }
        .ar-scale-row{ display:flex; align-items:center; gap:8px; }
        .ar-scale-label{ font:700 11px var(--font-body); color: var(--color-chocolate); }
        .ar-scale-val{ font:700 12px var(--font-mono); color: var(--color-chocolate); min-width:36px; text-align:center; }
        .ar-scale-hint{ font:500 10px var(--font-mono); color: rgba(58,42,26,0.5); text-align:center; }
        .ar-scale--video{ background: rgba(255,255,255,0.92); padding:8px 10px; }
        .xr-overlay{ position:fixed; inset:0; pointer-events:none; display:flex; flex-direction:column; justify-content:flex-end; padding:16px; z-index:10; }
        .xr-place-ui{ display:flex; flex-direction:column; align-items:center; gap:12px; pointer-events:auto; margin-bottom:24px; }
        .xr-placed-ui{ display:flex; flex-direction:column; align-items:center; gap:12px; pointer-events:auto; margin-bottom:16px; }
        .xr-card{ background: rgba(0,0,0,0.72); color:#fff; padding:12px 16px; border-radius:16px; text-align:center; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.12); max-width:320px; }
        .xr-card--small{ padding:8px 12px; font-size:12px; }
        .xr-card-title{ font:800 14px var(--font-display); margin:0; }
        .xr-card-sub{ font:500 12px var(--font-body); opacity:0.8; margin-top:2px; }
        .xr-badge{ padding:8px 14px; border-radius:999px; font:700 12px var(--font-body); color:#fff; text-align:center; }
        .xr-badge--success{ background:#22c55e; border:1px solid rgba(255,255,255,0.2); }
        .xr-badge--warn{ background:#f59e0b; border:1px solid rgba(255,255,255,0.2); }
        .xr-hint{ font:500 11px var(--font-mono); color:rgba(255,255,255,0.7); text-align:center; max-width:280px; }
        .xr-controls{ display:flex; flex-direction:column; gap:8px; align-items:center; width:100%; }
        .xr-scale{ display:flex; align-items:center; gap:8px; background: rgba(0,0,0,0.6); padding:6px 10px; border-radius:999px; color:#fff; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.1); }
        .xr-scale .xr-scale-label{ color:#fff; opacity:0.9; }
        .xr-scale .xr-scale-val{ color:#fff; }
        .xr-actions{ display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
        .xr-btn{ min-width:200px; justify-content:center; }
        .reticle{ width:80px; height:80px; border:2px solid #fff; border-radius:50%; position:absolute; box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.3); z-index:2; left:50%; top:50%; transform:translate(-50%,-50%); }
        .reticle::before{ content:''; position:absolute; inset:18px; border:1px solid rgba(255,255,255,0.9); border-radius:50%; }
        .reticle::after{ content:''; position:absolute; top:50%; left:50%; width:6px; height:6px; background:#fff; border-radius:50%; transform: translate(-50%,-50%); }
        .coaching{ position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background: rgba(255,255,255,0.96); backdrop-filter: blur(8px); padding:12px 18px; border-radius: 16px; text-align:center; min-width: 240px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index:3; }
        .coaching-title{ font: 800 14px var(--font-display); color: var(--color-chocolate); }
        .coaching-sub{ font: 500 12px var(--font-body); color: rgba(58,42,26,0.7); margin-top:2px; }
        .placed-canvas{ position:absolute; width: 240px; height: 240px; transform: translate(-50%, -50%); z-index:5; cursor: grab; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.35)); overflow:visible; }
        @media(max-width:600px){ .placed-canvas{ width: 200px; height: 200px; } }
        .placed-canvas-inner{ width:100%; height:100%; background: transparent; border-radius: 16px; overflow:visible; }
        .placed-canvas-inner canvas{ width:100% !important; height:100% !important; display:block; overflow:visible !important; }
        .video-reticle{ position:absolute; z-index:2; left:50%; top:50%; transform:translate(-50%,-50%); }
        .video-coaching{ position:absolute; bottom:20px; left:50%; transform:translateX(-50%); z-index:3; }
        .video-placed{ z-index:5; }
      `}</style>
    </div>
  )
}
