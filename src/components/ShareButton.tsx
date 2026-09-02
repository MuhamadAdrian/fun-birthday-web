import { useState } from 'react'
import { buildShareUrl } from '../utils/url'

export function ShareButton({ name, cakeId }: { name: string; cakeId: string }) {
  const [copied, setCopied] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const url = buildShareUrl(name, cakeId)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setShowFallback(true)
    }
  }

  return (
    <div className="share">
      <button className="btn share-btn" onClick={copy}>
        {copied ? '✓ Tersalin!' : '🔗 Bagikan Link'}
      </button>
      {showFallback ? (
        <div className="fallback">
          <input className="share-input" value={url} readOnly onFocus={(e) => e.target.select()} />
          <div className="hint">Salin manual — tekan & tahan lalu Salin</div>
          <button className="btn ghost sm" onClick={() => setShowFallback(false)}>
            Tutup
          </button>
        </div>
      ) : (
        <div className="share-url">{url}</div>
      )}
      <style>{`
        .share{ background:#fff; border-radius: var(--radius-md); padding:14px; box-shadow: var(--shadow-bakery); border:2px solid #fff; text-align:center; }
        .btn.share-btn{ background: var(--color-chocolate); color:#fff; border:none; border-radius:999px; padding:10px 18px; font:700 13px var(--font-body); cursor:pointer; }
        .btn.share-btn:hover{ background:#2a1e12; }
        .share-url{ margin-top:8px; font: 500 11px var(--font-mono); color: rgba(58,42,26,0.6); word-break: break-all; background: var(--color-cream); padding:8px; border-radius:8px; }
        .fallback{ margin-top:10px; }
        .share-input{ width:100%; font: 500 12px var(--font-mono); padding:10px; border:2px solid var(--color-cream-dark); border-radius:8px; background: var(--color-cream); }
        .hint{ font: 500 11px var(--font-body); color: rgba(58,42,26,0.6); margin-top:6px; }
        .btn.ghost.sm{ margin-top:8px; background: var(--color-cream-dark); color: var(--color-chocolate); padding:6px 12px; font-size:12px; border:none; border-radius:999px; cursor:pointer; }
      `}</style>
    </div>
  )
}
