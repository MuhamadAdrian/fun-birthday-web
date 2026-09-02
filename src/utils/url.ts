export function getParams() {
  const p = new URLSearchParams(window.location.search)
  return {
    to: p.get('to')?.trim() ?? '',
    cake: p.get('cake')?.trim() ?? '',
    source: p.get('source') ?? '',
  }
}

export function updateUrl(to: string, cakeId: string) {
  const url = new URL(window.location.href)
  if (to) url.searchParams.set('to', to)
  else url.searchParams.delete('to')
  if (cakeId) url.searchParams.set('cake', cakeId)
  else url.searchParams.delete('cake')
  window.history.replaceState({}, '', url.toString())
}

export function buildShareUrl(to: string, cakeId: string) {
  const url = new URL(window.location.origin + window.location.pathname)
  if (to) url.searchParams.set('to', to)
  if (cakeId) url.searchParams.set('cake', cakeId)
  return url.toString()
}
