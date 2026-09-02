import type { CakeDefinition } from '../data/cakes'

export function CakeCatalog({
  cakes,
  selectedId,
  onSelect,
}: {
  cakes: CakeDefinition[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="catalog">
      {cakes.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className={`card ${selectedId === c.id ? 'selected' : ''}`}
          aria-pressed={selectedId === c.id}
        >
          <div className="card-emoji" style={{ background: c.colors.frosting, borderColor: c.colors.accent }}>
            {c.thumbnailEmoji}
          </div>
          <div className="card-info">
            <div className="card-name">{c.name}</div>
            <div className="card-desc">{c.description}</div>
            <span className={`badge ${c.style}`}>{c.style === 'cute' ? 'Cute' : 'Realistis'}</span>
          </div>
          {selectedId === c.id && <div className="check">✓</div>}
        </button>
      ))}
      <style>{`
        .catalog { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        @media(max-width:560px){ .catalog{ grid-template-columns:1fr; } }
        .card { position:relative; display:flex; gap:12px; align-items:center; text-align:left; background:#fff; border:2px solid var(--color-cream-dark); border-radius: var(--radius-md); padding:14px; cursor:pointer; box-shadow: var(--shadow-bakery); transition: all .18s; }
        .card:hover{ transform: translateY(-2px); box-shadow: var(--shadow-bakery-lg); border-color: var(--color-sprinkle); }
        .card.selected{ border-color: var(--color-cherry); background: #fff; box-shadow: 0 0 0 3px rgba(230,57,70,0.15), var(--shadow-bakery-lg); }
        .card-emoji{ width:56px; height:56px; border-radius:16px; display:grid; place-items:center; font-size:28px; border:2px solid; flex-shrink:0; }
        .card-info{ flex:1; min-width:0; }
        .card-name{ font: 700 15px var(--font-display); color: var(--color-chocolate); line-height:1.1; }
        .card-desc{ font: 500 12px var(--font-body); color: rgba(58,42,26,0.65); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .badge{ display:inline-block; margin-top:6px; font:700 10px var(--font-body); letter-spacing:.06em; text-transform:uppercase; padding:4px 8px; border-radius:999px; }
        .badge.cute{ background: var(--color-sprinkle); color:#fff; }
        .badge.realistic{ background: var(--color-mint); color: var(--color-chocolate); }
        .check{ position:absolute; top:10px; right:10px; width:22px; height:22px; border-radius:999px; background: var(--color-cherry); color:#fff; display:grid; place-items:center; font-size:12px; }
      `}</style>
    </div>
  )
}
