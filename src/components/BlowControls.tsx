import { useBlowDetector } from '../hooks/useBlowDetector'

export function BlowControls({
  onBlow,
  disabled,
  candleLit,
}: {
  onBlow: () => void
  disabled?: boolean
  candleLit: boolean
}) {
  const { state, level, start } = useBlowDetector({ onBlow, disabled: disabled || !candleLit })

  const pct = Math.min(100, (level / 60) * 100)

  return (
    <div className="blow-wrap">
      <div className="blow-main">
        <button className="btn blow" onClick={onBlow} disabled={!candleLit} aria-label="Tiup lilin">
          <span className="blow-emoji">🎂</span>
          {candleLit ? 'Tiup Lilin!' : 'Sudah padam ✓'}
        </button>
        <button
          className={`btn mic ${state === 'listening' ? 'active' : ''} ${state === 'denied' ? 'denied' : ''}`}
          onClick={start}
          disabled={state === 'listening' || state === 'requesting'}
          title="Aktifkan mic untuk tiup"
        >
          {state === 'idle' && '🎤 Aktifkan Mic'}
          {state === 'requesting' && '⏳ Meminta mic...'}
          {state === 'listening' && '👂 Tiuplah!'}
          {state === 'blowing' && '💨 Terdeteksi!'}
          {state === 'denied' && '🚫 Mic diblokir'}
          {state === 'unsupported' && 'Mic tidak didukung'}
        </button>
      </div>

      {state === 'listening' && (
        <div className="meter">
          <div className="meter-bar" style={{ width: `${pct}%` }} />
          <span className="meter-label">Level: {level} — tiup kencang!</span>
        </div>
      )}
      {state === 'denied' && <div className="hint">Mic diblokir — pakai tombol Tiup ya. Cek ikon gembok di address bar.</div>}
      {!candleLit && <div className="hint success">Yeay! Lilin padam — confetti meledak 🎉</div>}

      <style>{`
        .blow-wrap{ background:#fff; border-radius: var(--radius-md); padding:14px; box-shadow: var(--shadow-bakery); border:2px solid #fff; }
        .blow-main{ display:flex; gap:10px; flex-wrap:wrap; }
        .btn{ font: 700 14px var(--font-body); padding:12px 18px; border-radius:999px; border:none; cursor:pointer; transition: all .15s; display:inline-flex; align-items:center; gap:8px; }
        .btn:disabled{ opacity:.5; cursor:not-allowed; transform:none !important; }
        .btn.blow{ background: var(--color-cherry); color:#fff; box-shadow: 0 6px 16px rgba(230,57,70,0.3); flex:1; justify-content:center; min-width:160px; }
        .btn.blow:hover:not(:disabled){ background:#d5303e; transform: translateY(-1px); }
        .blow-emoji{ font-size:18px; }
        .btn.mic{ background: var(--color-cream-dark); color: var(--color-chocolate); flex: 1; justify-content:center; min-width:140px; }
        .btn.mic.active{ background: var(--color-mint); color: var(--color-chocolate); animation: pulse 1s infinite; }
        .btn.mic.denied{ background: #FFE0E0; color: var(--color-cherry); }
        @keyframes pulse{ 0%,100%{ transform:scale(1);} 50%{ transform:scale(1.03);} }
        .meter{ margin-top:10px; background: var(--color-cream-dark); border-radius:999px; height:10px; overflow:hidden; position:relative; }
        .meter-bar{ height:100%; background: linear-gradient(90deg, var(--color-mint), var(--color-cherry)); border-radius:999px; transition: width .08s; }
        .meter-label{ display:block; font:600 11px var(--font-mono); color: rgba(58,42,26,0.6); margin-top:6px; text-align:center; }
        .hint{ margin-top:8px; font: 500 12px var(--font-body); color: rgba(58,42,26,0.7); background: var(--color-cream); padding:8px 12px; border-radius:999px; text-align:center; }
        .hint.success{ background: var(--color-mint); color: var(--color-chocolate); font-weight:700; }
      `}</style>
    </div>
  )
}
