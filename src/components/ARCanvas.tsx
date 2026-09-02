import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    let mounted = true
    async function check() {
      // @ts-ignore
      const nav = navigator as any
      if (nav.xr?.isSessionSupported) {
        try {
          const supported = await nav.xr.isSessionSupported('immersive-ar')
          if (mounted) setArState(supported ? 'supported' : 'unsupported')
        } catch {
          if (mounted) setArState('unsupported')
        }
      } else {
        if (mounted) setArState('unsupported')
      }
    }
    check()
    return () => {
      mounted = false
    }
  }, [])

  // Simulate WebXR hit-test for demo: show coaching then allow place on tap
  useEffect(() => {
    if (arState === 'supported' && isPresenting) {
      const t = setTimeout(() => setCoaching(false), 1800)
      return () => clearTimeout(t)
    }
  }, [arState, isPresenting])

  const handleEnterAR = async () => {
    // In real WebXR, would call navigator.xr.requestSession.
    // For MVP without physical device testing, simulate AR overlay.
    setIsPresenting(true)
    setArState('presenting')
    setPlaced(false)
    setCoaching(true)
    // Simulate tracking
    setTrackingLost(false)
  }

  const handleExitAR = () => {
    setIsPresenting(false)
    setArState('supported')
    setPlaced(false)
    onPlaced?.(false)
  }

  const handleTapPlace = () => {
    if (coaching) return
    setPlaced(true)
    onPlaced?.(true)
  }

  const handleRePlace = () => {
    setPlaced(false)
    setCoaching(false)
    onPlaced?.(false)
  }

  // Fallback 3D viewer
  if (arState === 'unsupported' || arState === 'checking') {
    return (
      <div className="ar-fallback">
        <div className="fallback-badge">Mode 3D — AR penuh di Android Chrome</div>
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
        {arState === 'checking' ? <p className="muted">Mengecek dukungan AR...</p> : null}
        <style>{`
          .ar-fallback{ background:#fff; border-radius: var(--radius-lg); overflow:hidden; box-shadow: var(--shadow-bakery); border:2px solid #fff; }
          .fallback-badge{ background: var(--color-mint); color: var(--color-chocolate); font:700 12px var(--font-body); text-align:center; padding:8px; }
          .fallback-canvas{ height:380px; background: radial-gradient(120% 120% at 50% 0%, #FFF8E7 0%, #F5EBD0 100%); }
          .muted{ text-align:center; font: 500 12px var(--font-mono); color: rgba(58,42,26,0.6); padding:8px; margin:0; }
        `}</style>
      </div>
    )
  }

  // Simulated AR presenting overlay (camera feed placeholder)
  if (isPresenting) {
    return (
      <div className="ar-presenting" onClick={handleTapPlace}>
        <div className="ar-camera">
          <div className="ar-grid" />
          <div className="ar-vignette" />
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
                    <div className="coaching-title">Tap untuk letakkan kue 🎂</div>
                    <div className="coaching-sub">Kue akan menempel di permukaan</div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="placed-canvas" onClick={(e) => e.stopPropagation()}>
              <Canvas camera={{ position: [0, 0.6, 1.8], fov: 50 }} shadows>
                <ambientLight intensity={1} />
                <directionalLight position={[1, 3, 1]} intensity={1.1} />
                <CakeModel cake={cake} name={name} candleLit={candleLit} float={false} />
              </Canvas>
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
          .ar-presenting{ position:relative; border-radius: var(--radius-lg); overflow:hidden; background:#0a0a0a; box-shadow: var(--shadow-bakery-lg); border:2px solid #fff; }
          .ar-camera{ position:relative; height:480px; background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%); overflow:hidden; display:grid; place-items:center; }
          @media(max-width:600px){ .ar-camera{ height:420px; } }
          .ar-grid{ position:absolute; inset:0; background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px); background-size: 24px 24px; }
          .ar-vignette{ position:absolute; inset:0; box-shadow: inset 0 0 120px rgba(0,0,0,0.6); pointer-events:none; }
          .reticle{ width:80px; height:80px; border:2px solid #fff; border-radius:50%; position:relative; box-shadow: 0 0 0 1px rgba(0,0,0,0.2), 0 2px 12px rgba(0,0,0,0.3); }
          .reticle::before{ content:''; position:absolute; inset:18px; border:1px solid rgba(255,255,255,0.9); border-radius:50%; }
          .reticle::after{ content:''; position:absolute; top:50%; left:50%; width:6px; height:6px; background:#fff; border-radius:50%; transform: translate(-50%,-50%); }
          .reticle.searching{ animation: pulse 1.2s ease-in-out infinite; }
          @keyframes pulse{ 0%,100%{ transform:scale(1); opacity:1;} 50%{ transform:scale(1.08); opacity:.8;} }
          .coaching{ position:absolute; bottom:20px; left:50%; transform:translateX(-50%); background: rgba(255,255,255,0.96); backdrop-filter: blur(8px); padding:12px 18px; border-radius: 16px; text-align:center; min-width: 240px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
          .coaching-title{ font: 800 14px var(--font-display); color: var(--color-chocolate); }
          .coaching-sub{ font: 500 12px var(--font-body); color: rgba(58,42,26,0.7); margin-top:2px; }
          .coaching-spinner{ width:18px; height:18px; border:2px solid var(--color-cream-dark); border-top-color: var(--color-cherry); border-radius:50%; animation: spin .8s linear infinite; margin:8px auto 0; }
          @keyframes spin{ to{ transform: rotate(360deg);} }
          .placed-canvas{ position:absolute; inset:0; }
          .placed-canvas canvas{ width:100%; height:100%; }
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
