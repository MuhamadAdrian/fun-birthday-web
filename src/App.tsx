import { useEffect, useMemo, useRef, useState } from 'react'
import { CAKES, getCakeById } from './data/cakes'
import { getParams, updateUrl } from './utils/url'
import { Stepper } from './components/Stepper'
import { NameInput } from './components/NameInput'
import { CakeCatalog } from './components/CakeCatalog'
import { CakePreview } from './components/CakePreview'
import { ARCanvas } from './components/ARCanvas'
import { BlowControls } from './components/BlowControls'
import { ShareButton } from './components/ShareButton'
import { useConfetti } from './hooks/useConfetti'

type Step = 1 | 2 | 3

export default function App() {
  const initial = useMemo(() => getParams(), [])
  const [name, setName] = useState(initial.to)
  const [cakeId, setCakeId] = useState(initial.cake || CAKES[0].id)
  const [step, setStep] = useState<Step>(initial.to ? 2 : 1)
  const [candleLit, setCandleLit] = useState(true)
  const [celebrating, setCelebrating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [showAudioPrompt, setShowAudioPrompt] = useState(false)
  const [muted, setMuted] = useState(false)
  const { fire, stop } = useConfetti()

  const cake = useMemo(() => getCakeById(cakeId), [cakeId])

  // deep link: if both present, jump to step 3
  useEffect(() => {
    if (initial.to && initial.cake) {
      setStep(3)
    } else if (initial.to) {
      setStep(2)
    }
  }, [initial.to, initial.cake])

  // sync url
  useEffect(() => {
    if (name || cakeId) updateUrl(name, cakeId)
  }, [name, cakeId])

  // synth fallback for Happy Birthday melody (public domain)
  const playSynth = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const notes = [
        [261.63, 0.5], [261.63, 0.5], [293.66, 1], [261.63, 1], [349.23, 1], [329.63, 2],
        [261.63, 0.5], [261.63, 0.5], [293.66, 1], [261.63, 1], [392.0, 1], [349.23, 2],
      ] as const
      let t = ctx.currentTime
      notes.forEach(([freq, dur]) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = freq
        o.connect(g)
        g.connect(ctx.destination)
        g.gain.setValueAtTime(0.35, t)
        g.gain.exponentialRampToValueAtTime(0.01, t + dur * 0.45)
        o.start(t)
        o.stop(t + dur * 0.45)
        t += dur * 0.45
      })
    } catch {}
  }

  // setup audio
  useEffect(() => {
    const a = new Audio('/audio/happy-birthday.mp3')
    a.loop = false
    a.volume = 0.85
    audioRef.current = a
    a.addEventListener('play', () => setShowAudioPrompt(false))
    a.addEventListener('error', () => console.warn('audio file not found, will use synth fallback'))
    return () => {
      a.pause()
      a.src = ''
    }
  }, [])

  const handleBlow = () => {
    if (!candleLit) return
    setCandleLit(false)
    setCelebrating(true)
    fire()
    // play audio respecting gesture — with synth fallback
    if (!muted) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(() => {
          setShowAudioPrompt(true)
          playSynth()
        })
        // if file 404, error event will have fired, also trigger synth after short delay if not playing
        setTimeout(() => {
          if (audioRef.current && audioRef.current.error) playSynth()
        }, 300)
      } else {
        playSynth()
      }
      // always also play synth as layered if you want richer — comment out if only file needed
      // playSynth()
    }
    // auto hide celebrating overlay after 6s but keep candle off
    setTimeout(() => setCelebrating(false), 6000)
  }

  const handleReset = () => {
    setCandleLit(true)
    setCelebrating(false)
    stop()
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setShowAudioPrompt(false)
  }

  const handleNameSubmit = (n: string) => {
    setName(n)
    setStep(2)
  }

  const isSecure = window.isSecureContext
  const showHttpsWarn = !isSecure && window.location.hostname !== 'localhost'

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-emoji">🎂</span>
            <span className="logo-text">AR Happy Birthday</span>
          </div>
          <div className="header-badge">PWA • Shareable • Gratis</div>
        </div>
        <div className="sprinkle-divider" />
      </header>

      <main className="main">
        <Stepper step={step} />

        {showHttpsWarn && (
          <div className="warn">
            ⚠️ Buka via HTTPS untuk AR & mic. Di localhost tetap bisa dev, tapi di HP butuh HTTPS.
          </div>
        )}

        {step === 1 && (
          <section className="section">
            <NameInput initial={name} onSubmit={handleNameSubmit} />
          </section>
        )}

        {step === 2 && (
          <section className="section stack">
            <div className="section-head">
              <h2 className="h2">Pilih Kue untuk {name || 'temanmu'} ✨</h2>
              <p className="p">Realistis atau cute — semua bisa ditaruh di dunia nyata</p>
              <button className="btn ghost sm" onClick={() => setStep(1)}>
                ← Ganti nama
              </button>
            </div>
            <CakeCatalog cakes={CAKES} selectedId={cakeId} onSelect={setCakeId} />
            <CakePreview cake={cake} name={name} candleLit={true} />
            <button className="btn primary large" onClick={() => setStep(3)}>
              Lanjut ke AR →
            </button>
            <div className="tiny">Preview di atas — di langkah selanjutnya bisa di-AR</div>
          </section>
        )}

        {step === 3 && (
          <section className="section stack">
            <div className="section-head">
              <h2 className="h2">Rayakan untuk {name} 🎉</h2>
              <p className="p">Kue: {cake.name} • Tap untuk letakkan, lalu tiup!</p>
              <div className="row">
                <button className="btn ghost sm" onClick={() => setStep(2)}>
                  ← Ganti kue
                </button>
                <button className="btn ghost sm" onClick={() => setStep(1)}>
                  Ganti nama
                </button>
              </div>
            </div>

            <ARCanvas cake={cake} name={name} candleLit={candleLit} onBlow={handleBlow} />

            <BlowControls onBlow={handleBlow} candleLit={candleLit} />

            <div className="action-row">
              <button className="btn secondary" onClick={handleReset}>
                🔄 Nyalakan Lagi
              </button>
              <button className={`btn ghost ${muted ? 'active' : ''}`} onClick={() => setMuted((m) => !m)}>
                {muted ? '🔇 Suara mati' : '🔊 Suara hidup'}
              </button>
              {showAudioPrompt && (
                <button
                  className="btn primary"
                  onClick={() => {
                    audioRef.current?.play().then(() => setShowAudioPrompt(false))
                  }}
                >
                  ▶️ Tap untuk putar musik
                </button>
              )}
            </div>

            <ShareButton name={name} cakeId={cakeId} />

            <div className="attribution">
              Audio: Happy Birthday (public domain, royalty-free recording). Jika file belum ada, akan silent — ganti di{' '}
              <code>apps/web/public/audio/happy-birthday.mp3</code>
            </div>
          </section>
        )}

        {celebrating && (
          <div className="celebrate-overlay" role="status" aria-live="polite">
            <div className="celebrate-card">
              <div className="celebrate-emoji">🎉🎂🎈</div>
              <h3 className="celebrate-title">Selamat Ulang Tahun, {name}! 🎉</h3>
              <p className="celebrate-sub">Semoga harimu secerah lilin ini ✨</p>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="sprinkle-divider" />
        <p>Built with Three.js + WebXR • Fallback 3D di iPhone • Mic opsional • PWA installable</p>
      </footer>

      <style>{`
        .app{ min-height:100vh; display:flex; flex-direction:column; }
        .header{ background:#fff; position:sticky; top:0; z-index:10; box-shadow: 0 2px 12px rgba(58,42,26,0.06); }
        .header-inner{ max-width:720px; margin:0 auto; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; }
        .logo{ display:flex; align-items:center; gap:8px; }
        .logo-emoji{ font-size:22px; }
        .logo-text{ font: 800 18px var(--font-display); color: var(--color-chocolate); letter-spacing:-.02em; }
        .header-badge{ font: 700 10px var(--font-body); letter-spacing:.08em; text-transform:uppercase; background: var(--color-cherry); color:#fff; padding:6px 10px; border-radius:999px; }
        .main{ max-width:720px; width:100%; margin:0 auto; padding: 0 16px 32px; flex:1; }
        .section{ margin-top:16px; }
        .stack{ display:flex; flex-direction:column; gap:16px; }
        .section-head{ text-align:center; }
        .h2{ font: 800 24px var(--font-display); color: var(--color-chocolate); margin:0; line-height:1.2; }
        .p{ font: 500 13px var(--font-body); color: rgba(58,42,26,0.65); margin:6px 0 10px; }
        .row{ display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
        .btn{ font: 700 13px var(--font-body); padding:10px 16px; border-radius:999px; border:none; cursor:pointer; transition: all .15s; }
        .btn.primary{ background: var(--color-cherry); color:#fff; box-shadow: 0 6px 16px rgba(230,57,70,0.3); }
        .btn.primary:hover{ background:#d5303e; transform: translateY(-1px); }
        .btn.secondary{ background: var(--color-chocolate); color:#fff; }
        .btn.ghost{ background: var(--color-cream-dark); color: var(--color-chocolate); }
        .btn.ghost.active{ background: var(--color-mint); }
        .btn.ghost.sm{ padding:8px 14px; font-size:12px; }
        .btn.large{ width:100%; padding:14px 22px; font-size:15px; }
        .tiny{ text-align:center; font: 500 11px var(--font-mono); color: rgba(58,42,26,0.5); }
        .action-row{ display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
        .warn{ background:#FFF3CD; border:1px solid #FFD23F; color:#664d03; font:600 12px var(--font-body); padding:10px 14px; border-radius:12px; text-align:center; }
        .attribution{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.5); text-align:center; background:#fff; padding:10px; border-radius:12px; }
        .attribution code{ background: var(--color-cream-dark); padding:2px 6px; border-radius:6px; }
        .celebrate-overlay{ position:fixed; inset:0; display:grid; place-items:center; background: rgba(255,248,231,0.55); backdrop-filter: blur(6px); z-index:50; padding:16px; animation: fadeIn .3s ease; }
        .celebrate-card{ background:#fff; border-radius: var(--radius-lg); padding:28px 22px; text-align:center; box-shadow: var(--shadow-bakery-lg); border:3px solid var(--color-gold); max-width:420px; width:100%; animation: pop .4s cubic-bezier(.34,1.56,.64,1); }
        .celebrate-emoji{ font-size:36px; }
        .celebrate-title{ font: 800 22px var(--font-display); color: var(--color-chocolate); margin:10px 0 6px; }
        .celebrate-sub{ font: 500 13px var(--font-body); color: rgba(58,42,26,0.7); margin:0; }
        @keyframes fadeIn{ from{ opacity:0;} to{opacity:1;} }
        @keyframes pop{ from{ transform:scale(.85); opacity:0;} to{ transform:scale(1); opacity:1;} }
        .footer{ text-align:center; padding:16px; }
        .footer p{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.45); margin:8px 0 0; }
      `}</style>
    </div>
  )
}
