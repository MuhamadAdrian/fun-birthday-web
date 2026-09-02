import { useState } from 'react'
import { validateName } from '../utils/sanitize'

export function NameInput({ initial, onSubmit }: { initial: string; onSubmit: (name: string) => void }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string | null>(null)

  const handle = () => {
    const err = validateName(value)
    if (err) {
      setError(err)
      return
    }
    setError(null)
    onSubmit(value.trim().slice(0, 20).replace(/[<>]/g, ''))
  }

  return (
    <div className="name-card">
      <div className="name-header">
        <div className="name-emoji">🎂</div>
        <h1 className="name-title">Siapa yang ulang tahun?</h1>
        <p className="name-sub">Namanya akan muncul di atas kue 3D kamu</p>
      </div>
      <div className="name-field">
        <input
          className={`input ${error ? 'error' : ''}`}
          placeholder="Contoh: Bima, Anya, Ibu..."
          value={value}
          maxLength={20}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handle()}
          autoFocus
        />
        <div className="name-meta">
          <span className={error ? 'err' : 'muted'}>{error ?? `${value.length}/20`}</span>
        </div>
      </div>
      <button className="btn primary large" onClick={handle}>
        Lanjut Pilih Kue →
      </button>
      <div className="name-tip">Bisa juga buka link <code>?to=Nama</code> untuk langsung personalisasi</div>
      <style>{`
        .name-card{ background:#fff; border-radius: var(--radius-lg); padding:24px; box-shadow: var(--shadow-bakery-lg); border:2px solid #fff; max-width:520px; margin:0 auto; }
        .name-header{ text-align:center; margin-bottom:18px; }
        .name-emoji{ font-size:40px; }
        .name-title{ font: 800 28px var(--font-display); color: var(--color-chocolate); margin:8px 0 4px; line-height:1.1; }
        .name-sub{ font: 500 13px var(--font-body); color: rgba(58,42,26,0.65); margin:0; }
        .name-field{ margin:16px 0 12px; }
        .input{ width:100%; font: 600 18px var(--font-body); padding:14px 16px; border:2px solid var(--color-cream-dark); border-radius: var(--radius-md); background: var(--color-cream); outline:none; transition: border-color .15s; color: var(--color-chocolate); }
        .input:focus{ border-color: var(--color-cherry); background:#fff; }
        .input.error{ border-color: var(--color-cherry); background: #FFF0F0; }
        .name-meta{ display:flex; justify-content:flex-end; margin-top:6px; }
        .muted{ font: 500 11px var(--font-mono); color: rgba(58,42,26,0.5); }
        .err{ font: 600 12px var(--font-body); color: var(--color-cherry); }
        .btn.primary{ background: var(--color-cherry); color:#fff; border:none; border-radius:999px; padding:14px 22px; font: 700 15px var(--font-body); cursor:pointer; width:100%; box-shadow: 0 6px 16px rgba(230,57,70,0.3); transition: all .15s; }
        .btn.primary:hover{ transform: translateY(-1px); background:#d5303e; }
        .btn.large{ width:100%; }
        .name-tip{ text-align:center; font: 500 11px var(--font-mono); color: rgba(58,42,26,0.45); margin-top:12px; }
        .name-tip code{ background: var(--color-cream-dark); padding:2px 6px; border-radius:6px; }
      `}</style>
    </div>
  )
}
