import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { CakeModel } from './CakeModel'
import type { CakeDefinition } from '../data/cakes'

type ARState = 'checking' | 'supported' | 'unsupported' | 'presenting'

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
  const [arState, setArState] = useState<ARState>('checking')
  const [placed, setPlaced] = useState(false)
  const [coaching, setCoaching] = useState(true)
  const [trackingLost, setTrackingLost] = useState(false)
  const [isPresenting, setIsPresenting] = useState(false)
  const [checkReason, setCheckReason] = useState<string>('')
  const [hasRealSupport, setHasRealSupport] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraRef = useRef<HTMLDivElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [placedPos, setPlacedPos] = useState<{ x: number; y: number } | null>(null)
  const [parallax, setParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  useEffect(() => {
    let mounted = true
    async function check() {
      // @ts-ignore
      const nav = navigator as any
      const isSecure = window.isSecureContext
      const ua = navigator.userAgent

      // Debug log for Android Chrome
      console.log('[AR] check start', { isSecure, hasXR: !!nav.xr, ua })

      if (!isSecure) {
        // WebXR requires HTTPS — but we still allow simulation
        if (mounted) {
          setArState('unsupported')
          setHasRealSupport(false)
          setCheckReason('Butuh HTTPS untuk WebXR asli (kamu di HTTP). Simulasi tetap bisa dicoba.')
        }
        return
      }

      if (nav.xr?.isSessionSupported) {
        try {
          const supported = await nav.xr.isSessionSupported('immersive-ar')
          console.log('[AR] isSessionSupported immersive-ar:', supported)
          if (mounted) {
            setArState(supported ? 'supported' : 'unsupported')
            setHasRealSupport(!!supported)
            setCheckReason(
              supported
                ? '✅ Perangkat support immersive-ar'
                : 'Perangkat/browser tidak support immersive-ar (cek ARCore / Chrome update). Simulasi tetap bisa.',
            )
          }
        } catch (e) {
          console.warn('[AR] isSessionSupported error', e)
          if (mounted) {
            setArState('unsupported')
            setHasRealSupport(false)
            setCheckReason(`Gagal cek AR: ${(e as Error)?.message || 'unknown'}. Simulasi tetap bisa.`)
          }
        }
      } else {
        console.warn('[AR] navigator.xr tidak ada')
        if (mounted) {
          setArState('unsupported')
          setHasRealSupport(false)
          const isAndroid = /Android/i.test(ua)
          const isChrome = /Chrome/i.test(ua)
          if (isAndroid && !isChrome) {
            setCheckReason('Pakai Chrome Android untuk AR asli. Simulasi tetap bisa dicoba.')
          } else if (isAndroid) {
            setCheckReason('ARCore belum aktif / Chrome perlu update. Simulasi tetap bisa.')
          } else {
            setCheckReason('Browser tidak support WebXR. Simulasi tetap bisa.')
          }
        }
      }
    }
    check()
    return () => {
      mounted = false
    }
  }, [])

  // Simulate WebXR hit-test for demo: show coaching then allow place on tap
  useEffect(() => {
    if (isPresenting) {
      const t = setTimeout(() => setCoaching(false), 1800)
      return () => clearTimeout(t)
    }
  }, [isPresenting])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const handleEnterAR = async () => {
    // In real WebXR, would call navigator.xr.requestSession.
    // For MVP tanpa WebXR nyata, kita pakai kamera getUserMedia sebagai background AR simulasi
    setCameraError(null)
    setCameraLoading(true)
    setIsPresenting(true)
    setArState('presenting')
    setPlaced(false)
    setPlacedPos(null)
    setCoaching(true)
    setTrackingLost(false)

    // Coba nyalakan kamera belakang (environment)
    try {
      // getUserMedia butuh HTTPS — di HTTP akan throw
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser tidak support getUserMedia')
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setCameraError(null)
      console.log('[AR] camera started', stream.getVideoTracks()[0]?.label)
    } catch (e) {
      console.warn('[AR] camera gagal', e)
      const msg = (e as Error)?.name === 'NotAllowedError'
        ? 'Izin kamera ditolak — aktifkan izin kamera di Chrome.'
        : (e as Error)?.name === 'NotFoundError'
          ? 'Kamera tidak ditemukan.'
          : (e as Error)?.message?.includes('secure')
            ? 'Butuh HTTPS untuk akses kamera. Simulasi tetap jalan tanpa kamera.'
            : (e as Error)?.message || 'Gagal akses kamera, simulasi tanpa kamera.'
      // Khusus HTTP insecure, browser block getUserMedia
      if (!window.isSecureContext) {
        setCameraError('Butuh HTTPS untuk kamera. Buka via https:// atau localhost. Simulasi grid tetap jalan.')
      } else {
        setCameraError(msg)
      }
    } finally {
      setCameraLoading(false)
    }

    // Kalau hasRealSupport, log aja (belum pakai immersive-ar beneran)
    if (hasRealSupport) {
      console.log('[AR] hasRealSupport true — pakai kamera simulasi, belum WebXR hit-test')
    }
  }

  const handleExitAR = () => {
    stopCamera()
    setCameraError(null)
    setCameraLoading(false)
    setIsPresenting(false)
    // restore previous state (supported vs unsupported) instead of always 'supported'
    setArState(hasRealSupport ? 'supported' : 'unsupported')
    setPlaced(false)
    setPlacedPos(null)
    onPlaced?.(false)
  }

  // attach stream to video when ref ready / presenting
  useEffect(() => {
    if (isPresenting && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(() => {})
    }
  }, [isPresenting])

  // cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [])

  // World-locked illusion: pakai deviceorientation untuk parallax biar kue tidak 100% nempel layar
  useEffect(() => {
    if (!placed || !isPresenting) {
      setParallax({ x: 0, y: 0 })
      return
    }
    let raf = 0
    const handler = (e: DeviceOrientationEvent) => {
      const gamma = e.gamma ?? 0
      const beta = e.beta ?? 0
      // beta ~45° saat phone dipegang 45° ke lantai, gamma 0 center
      const targetX = Math.max(-18, Math.min(18, -gamma * 0.9))
      const targetY = Math.max(-14, Math.min(14, -(beta - 45) * 0.5))
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setParallax({ x: targetX, y: targetY }))
    }
    // iOS perlu permission, Android langsung
    const maybeRequest = async () => {
      try {
        const DME = (DeviceMotionEvent as any)
        if (DME && typeof DME.requestPermission === 'function') {
          const perm = await DME.requestPermission().catch(() => 'denied')
          if (perm !== 'granted') return
        }
      } catch {}
      window.addEventListener('deviceorientation', handler, true)
    }
    maybeRequest()
    window.addEventListener('deviceorientation', handler, true)
    return () => {
      window.removeEventListener('deviceorientation', handler as any, true)
      cancelAnimationFrame(raf)
      setParallax({ x: 0, y: 0 })
    }
  }, [placed, isPresenting])

  const handleTapPlace = (e?: React.MouseEvent | React.TouchEvent) => {
    if (coaching) return
    // AR yang benar: kue ditempel di titik reticle (tengah layar) yang sudah hit-test ke lantai.
    // Tap di mana saja tetap letakkan di tengah agar tidak kepotong & terasa world-anchored.
    // Kalau mau presisi tap, kita tetap hitung tapi clamp ketat agar tidak overflow.
    if (e && cameraRef.current) {
      const rect = cameraRef.current.getBoundingClientRect()
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? (e as any).changedTouches?.[0]?.clientX) : (e as React.MouseEvent).clientX
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? (e as any).changedTouches?.[0]?.clientY) : (e as React.MouseEvent).clientY
      if (clientX != null && clientY != null) {
        const x = ((clientX - rect.left) / rect.width) * 100
        const y = ((clientY - rect.top) / rect.height) * 100
        // clamp ketat 30-70% X dan 35-75% Y untuk cegah kepotong overflow hidden (260px di layar 360px butuh margin ~36%)
        const clampedX = Math.min(70, Math.max(30, x))
        const clampedY = Math.min(75, Math.max(35, y))
        // Untuk kesan AR world-locked, kita lebih suka center reticle jika tap jauh dari tengah (>20% delta)
        // tapi tetap hormati tap yang dekat tengah agar terasa interaktif
        const distFromCenter = Math.hypot(clampedX - 50, clampedY - 62)
        if (distFromCenter > 22) {
          setPlacedPos({ x: 50, y: 62 })
        } else {
          setPlacedPos({ x: clampedX, y: clampedY })
        }
      } else {
        setPlacedPos({ x: 50, y: 62 })
      }
    } else {
      setPlacedPos({ x: 50, y: 62 })
    }
    setPlaced(true)
    onPlaced?.(true)
  }

  const handleRePlace = () => {
    setPlaced(false)
    setPlacedPos(null)
    setCoaching(false)
    onPlaced?.(false)
  }

  const handlePlacedMove = (e: React.MouseEvent | React.TouchEvent) => {
    // drag kue setelah ditempatkan — update pos dengan clamp ketat anti kepotong
    e.stopPropagation()
    if (!cameraRef.current || !placed) return
    const rect = cameraRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as React.MouseEvent).clientY
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    setPlacedPos({ x: Math.min(70, Math.max(30, x)), y: Math.min(75, Math.max(35, y)) })
  }

  // Fallback 3D viewer + Simulasi AR untuk unsupported
  if (arState === 'unsupported' || arState === 'checking') {
    const isChecking = arState === 'checking'
    return (
      <div className="ar-fallback">
        <div className="fallback-badge">
          {isChecking ? 'Mengecek AR...' : hasRealSupport ? 'Mode 3D' : 'Mode 3D — AR Simulasi Tersedia ✨'}
        </div>
        <div className="fallback-canvas">
          <Canvas camera={{ position: [0, 1.1, 2.6], fov: 45 }} shadows>
            <ambientLight intensity={0.9} />
            <directionalLight position={[2, 4, 2]} intensity={1.1} castShadow />
            <CakeModel cake={cake} name={name} candleLit={candleLit} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
              <planeGeometry args={[6, 6]} />
              <shadowMaterial opacity={0.25} />
            </mesh>
          </Canvas>
        </div>
        {isChecking ? (
          <p className="muted">Mengecek dukungan AR... (butuh HTTPS & Chrome Android + ARCore)</p>
        ) : (
          <div className="fallback-actions">
            <p className="fallback-reason">{checkReason || 'AR asli butuh Chrome Android + HTTPS + ARCore.'}</p>
            <button className="btn primary large" onClick={handleEnterAR}>
              Lihat di Dunia Nyata (Simulasi) →
            </button>
            <p className="fallback-hint">
              Simulasi ini jalan di semua HP. Untuk AR asli (kamera beneran) buka via <b>HTTPS</b> di Chrome Android yang sudah install Google Play Services for AR.
            </p>
            <details className="fallback-details">
              <summary>🔍 Diagnosis</summary>
              <div className="fallback-diag">
                <div>SecureContext: {String(window.isSecureContext)}</div>
                <div>Protocol: {window.location.protocol}</div>
                <div>Has navigator.xr: {String(!!(navigator as any).xr)}</div>
                <div>UserAgent: {navigator.userAgent.slice(0, 80)}...</div>
                <div>Reason: {checkReason}</div>
              </div>
            </details>
          </div>
        )}
        <style>{`
          .ar-fallback{ background:#fff; border-radius: var(--radius-lg); overflow:hidden; box-shadow: var(--shadow-bakery); border:2px solid #fff; }
          .fallback-badge{ background: var(--color-mint); color: var(--color-chocolate); font:700 12px var(--font-body); text-align:center; padding:8px; }
          .fallback-canvas{ height:380px; background: radial-gradient(120% 120% at 50% 0%, #FFF8E7 0%, #F5EBD0 100%); }
          .muted{ text-align:center; font: 500 12px var(--font-mono); color: rgba(58,42,26,0.6); padding:10px; margin:0; }
          .fallback-actions{ padding:14px 16px 16px; text-align:center; display:flex; flex-direction:column; gap:10px; }
          .fallback-reason{ font: 500 12px var(--font-body); color: rgba(58,42,26,0.75); margin:0; line-height:1.5; background: var(--color-cream-dark); padding:8px 10px; border-radius:10px; }
          .fallback-hint{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.55); margin:0; line-height:1.5; }
          .fallback-details{ text-align:left; background: #fff; border:1px solid #eee; border-radius:10px; padding:8px 10px; }
          .fallback-details summary{ font: 700 11px var(--font-body); cursor:pointer; color: var(--color-chocolate); }
          .fallback-diag{ font: 500 10px var(--font-mono); color: rgba(58,42,26,0.7); margin-top:6px; display:flex; flex-direction:column; gap:2px; word-break:break-all; }
          .btn{ font:700 13px var(--font-body); padding:10px 16px; border-radius:999px; border:none; cursor:pointer; transition: all .15s; }
          .btn.primary{ background: var(--color-cherry); color:#fff; box-shadow: 0 6px 16px rgba(230,57,70,0.3); }
          .btn.primary:hover{ background:#d5303e; transform: translateY(-1px); }
          .btn.large{ width:100%; padding:14px 22px; font-size:15px; }
        `}</style>
      </div>
    )
  }

  // Simulated AR presenting overlay — sekarang pakai kamera beneran via getUserMedia
  if (isPresenting) {
    return (
      <div className="ar-presenting" onClick={handleTapPlace} onTouchEnd={handleTapPlace}>
        <div className="ar-camera" ref={cameraRef}>
          {/* Video dibungkus agar overflow hidden tidak kepotong kue */}
          <div className="ar-video-wrap">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="ar-video"
              style={{ display: cameraError ? 'none' : 'block' }}
            />
            {cameraError && <div className="ar-camera-fallback" />}
            <div className="ar-grid" />
            <div className="ar-vignette" />
          </div>
          {cameraLoading && <div className="camera-loading">Menyalakan kamera...</div>}
          {cameraError && !cameraLoading && (
            <div className="camera-error">
              <div className="camera-error-title">⚠️ {cameraError}</div>
              <div className="camera-error-sub">Tap tetap bisa letakkan kue (mode simulasi).</div>
            </div>
          )}
          {!placed ? (
            <>
              <div className={`reticle ${coaching ? 'searching' : ''}`} />
              <div className="coaching">
                {coaching ? (
                  <>
                    <div className="coaching-title">Arahkan kamera ke lantai</div>
                    <div className="coaching-sub">Gerakkan perlahan sampai reticle stabil</div>
                    <div className="coaching-spinner" />
                  </>
                ) : (
                  <>
                    <div className="coaching-title">Tap di permukaan untuk letakkan kue 🎂</div>
                    <div className="coaching-sub">Tap di mana saja di video — kue akan menempel di titik itu</div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div
              className="placed-canvas"
              style={{
                left: `${placedPos?.x ?? 50}%`,
                top: `${placedPos?.y ?? 62}%`,
                transform: `translate(-50%, -50%) translate(${parallax.x}px, ${parallax.y}px)`,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={handlePlacedMove}
              onMouseMove={(e) => {
                if (e.buttons === 1) handlePlacedMove(e)
              }}
            >
              <div className="placed-canvas-inner">
                <Canvas camera={{ position: [0, 0.7, 2.0], fov: 48 }} shadows gl={{ alpha: true, antialias: true }} style={{ background: 'transparent' }}>
                  <ambientLight intensity={1} />
                  <directionalLight position={[2, 4, 2]} intensity={1.2} castShadow shadow-mapSize={1024} />
                  <directionalLight position={[-1, 2, -1]} intensity={0.4} />
                  <CakeModel cake={cake} name={name} candleLit={candleLit} float={false} />
                  {/* Bayangan di permukaan untuk kesan menempel */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.42, 0]} receiveShadow>
                    <planeGeometry args={[2.2, 2.2]} />
                    <shadowMaterial opacity={0.32} />
                  </mesh>
                  {/* plane transparan untuk hit area */}
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.41, 0]}>
                    <planeGeometry args={[2.2, 2.2]} />
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.01} />
                  </mesh>
                </Canvas>
              </div>
              <div className="placed-label">🎂 drag untuk pindah • cubit untuk zoom tidak ada, geser posisi</div>
            </div>
          )}
          {trackingLost && <div className="tracking-warn">Tracking hilang — arahkan ke permukaan</div>}
        </div>
        <div className="ar-controls">
          <button className="btn ghost" onClick={handleExitAR}>
            Keluar AR
          </button>
          {placed ? (
            <button className="btn secondary" onClick={handleRePlace}>
              Pindah Kue
            </button>
          ) : (
            <span className="ar-hint">Mode simulasi — di device AR nyata akan pakai hit-test</span>
          )}
        </div>
        <style>{`
          .ar-presenting{ position:relative; border-radius: var(--radius-lg); overflow:visible; background:#0a0a0a; box-shadow: var(--shadow-bakery-lg); border:2px solid #fff; }
          .ar-camera{ position:relative; height:480px; background: #0a0a0a; overflow:visible; display:grid; place-items:center; touch-action:none; border-radius: var(--radius-lg); }
          @media(max-width:600px){ .ar-camera{ height:420px; } }
          .ar-video-wrap{ position:absolute; inset:0; overflow:hidden; border-radius: var(--radius-lg); }
          .ar-video{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
          .ar-camera-fallback{ position:absolute; inset:0; background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%); }
          .camera-loading{ position:absolute; top:12px; left:50%; transform:translateX(-50%); background: rgba(0,0,0,0.7); color:#fff; font:600 12px var(--font-body); padding:6px 12px; border-radius:999px; z-index:4; }
          .camera-error{ position:absolute; top:12px; left:12px; right:12px; background: rgba(230,57,70,0.92); color:#fff; padding:8px 10px; border-radius:12px; text-align:center; z-index:4; }
          .camera-error-title{ font:700 12px var(--font-body); }
          .camera-error-sub{ font:500 11px var(--font-body); opacity:.9; margin-top:2px; }
          .ar-grid{ position:absolute; inset:0; background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 24px 24px; pointer-events:none; }
          .ar-vignette{ position:absolute; inset:0; box-shadow: inset 0 0 120px rgba(0,0,0,0.6); pointer-events:none; border-radius: var(--radius-lg); }
          .reticle{ width:80px; height:80px; border:2px solid #fff; border-radius:50%; position:relative; box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.3); z-index:2; }
          .reticle::before{ content:''; position:absolute; inset:18px; border:1px solid rgba(255,255,255,0.9); border-radius:50%; }
          .reticle::after{ content:''; position:absolute; top:50%; left:50%; width:6px; height:6px; background:#fff; border-radius:50%; transform: translate(-50%,-50%); }
          .reticle.searching{ animation: pulse 1.2s ease-in-out infinite; }
          @keyframes pulse{ 0%,100%{ transform:scale(1); opacity:1;} 50%{ transform:scale(1.08); opacity:.8;} }
          .coaching{ position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background: rgba(255,255,255,0.96); backdrop-filter: blur(8px); padding:12px 18px; border-radius: 16px; text-align:center; min-width: 240px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index:3; }
          .coaching-title{ font: 800 14px var(--font-display); color: var(--color-chocolate); }
          .coaching-sub{ font: 500 12px var(--font-body); color: rgba(58,42,26,0.7); margin-top:2px; }
          .coaching-spinner{ width:18px; height:18px; border:2px solid var(--color-cream-dark); border-top-color: var(--color-cherry); border-radius:50%; animation: spin .8s linear infinite; margin:8px auto 0; }
          @keyframes spin{ to{ transform: rotate(360deg);} }
          .placed-canvas{ position:absolute; width: 240px; height: 240px; transform: translate(-50%, -50%); z-index:5; cursor: grab; filter: drop-shadow(0 12px 24px rgba(0,0,0,0.35)); overflow:visible; }
          @media(max-width:600px){ .placed-canvas{ width: 200px; height: 200px; } }
          .placed-canvas:active{ cursor: grabbing; }
          .placed-canvas-inner{ width:100%; height:100%; background: transparent; border-radius: 16px; overflow:visible; }
          .placed-canvas-inner canvas{ width:100% !important; height:100% !important; display:block; overflow:visible !important; filter: none; }
          .placed-label{ position:absolute; bottom:-22px; left:50%; transform:translateX(-50%); white-space:nowrap; background: rgba(0,0,0,0.65); color:#fff; font:600 10px var(--font-body); padding:4px 8px; border-radius:999px; pointer-events:none; z-index:6; }
          .tracking-warn{ position:absolute; top:16px; left:50%; transform:translateX(-50%); background: #E63946; color:#fff; font:700 12px var(--font-body); padding:8px 14px; border-radius:999px; }
          .ar-controls{ display:flex; gap:10px; align-items:center; justify-content:space-between; padding:12px; background:#fff; }
          .ar-hint{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.6); }
          .btn{ font:700 13px var(--font-body); padding:10px 16px; border-radius:999px; border:none; cursor:pointer; transition: all .15s; }
          .btn.ghost{ background: var(--color-cream-dark); color: var(--color-chocolate); }
          .btn.secondary{ background: var(--color-chocolate); color:#fff; }
          .btn:hover{ transform: translateY(-1px); }
        `}</style>
      </div>
    )
  }

  // Supported but not yet presenting — show entry
  return (
    <div className="ar-entry">
      <div className="ar-entry-preview">
        <Canvas camera={{ position: [0, 1.1, 2.6], fov: 45 }} shadows>
          <ambientLight intensity={0.9} />
          <directionalLight position={[2, 4, 2]} intensity={1.1} />
          <CakeModel cake={cake} name={name} candleLit={candleLit} />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
            <planeGeometry args={[6, 6]} />
            <shadowMaterial opacity={0.2} />
          </mesh>
        </Canvas>
      </div>
      <div className="ar-entry-actions">
        <div className="ar-ready">AR Siap ✨</div>
        <p className="ar-desc">Letakkan kue di meja atau lantai dunia nyata. Pastikan ruangan terang.</p>
        <button className="btn primary large" onClick={handleEnterAR}>
          Lihat di Dunia Nyata
        </button>
        <div className="ar-note">Butuh Chrome Android + HTTPS. Di iPhone akan fallback ke 3D.</div>
      </div>
      <style>{`
        .ar-entry{ background:#fff; border-radius: var(--radius-lg); overflow:hidden; box-shadow: var(--shadow-bakery); border:2px solid #fff; }
        .ar-entry-preview{ height:340px; background: radial-gradient(120% 120% at 50% 0%, #FFF8E7 0%, #F5EBD0 100%); }
        .ar-entry-actions{ padding:16px; text-align:center; }
        .ar-ready{ display:inline-block; background: var(--color-mint); color: var(--color-chocolate); font:800 12px var(--font-body); letter-spacing:.08em; text-transform:uppercase; padding:6px 12px; border-radius:999px; }
        .ar-desc{ font: 500 13px var(--font-body); color: rgba(58,42,26,0.7); margin:10px 0 14px; line-height:1.5; }
        .btn.primary{ background: var(--color-cherry); color:#fff; box-shadow: 0 6px 16px rgba(230,57,70,0.35); }
        .btn.primary:hover{ background:#d5303e; }
        .btn.large{ padding:14px 24px; font-size:15px; width:100%; }
        .ar-note{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.5); margin-top:10px; }
      `}</style>
    </div>
  )
}
