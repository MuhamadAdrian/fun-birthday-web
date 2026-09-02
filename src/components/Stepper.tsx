type Step = 1 | 2 | 3

export function Stepper({ step }: { step: Step }) {
  const items = [
    { n: 1, label: 'Nama' },
    { n: 2, label: 'Pilih Kue' },
    { n: 3, label: 'Rayakan' },
  ] as const
  return (
    <div className="stepper">
      {items.map((it, idx) => (
        <div key={it.n} className="stepper-item">
          <div className={`stepper-dot ${step >= it.n ? 'active' : ''} ${step === it.n ? 'current' : ''}`}>{it.n}</div>
          <span className={`stepper-label ${step === it.n ? 'current' : ''}`}>{it.label}</span>
          {idx < items.length - 1 && <div className={`stepper-line ${step > it.n ? 'done' : ''}`} />}
        </div>
      ))}
      <style>{`
        .stepper { display:flex; align-items:center; justify-content:center; gap: 0; padding: 14px 0 10px; }
        .stepper-item { display:flex; align-items:center; gap: 8px; position:relative; }
        .stepper-dot { width:28px; height:28px; border-radius:999px; display:grid; place-items:center; font: 700 13px var(--font-body); background:#fff; border:2px solid var(--color-cream-dark); color: var(--color-chocolate); transition: all .2s; }
        .stepper-dot.active { background: var(--color-cherry); color:#fff; border-color: var(--color-cherry); }
        .stepper-dot.current { box-shadow: 0 0 0 4px rgba(230,57,70,0.15); }
        .stepper-label { font: 600 13px var(--font-body); color: var(--color-chocolate); opacity:.5; }
        .stepper-label.current { opacity:1; }
        .stepper-line { width:32px; height:3px; border-radius:999px; background: var(--color-cream-dark); margin:0 6px; }
        .stepper-line.done { background: var(--color-cherry); }
        @media(max-width:400px){ .stepper-label{ display:none; } .stepper-line{ width:20px; } }
      `}</style>
    </div>
  )
}
