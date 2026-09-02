export function sanitizeName(input: string): string {
  // trim, limit 20, escape HTML entities, allow letters numbers space apostrophe hyphen
  let s = input.trim().slice(0, 20)
  // escape < > & " '
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // decode back for canvas (we want literal text, not HTML), so reverse after validation
  // For canvas we need raw text, but we prevent script execution by not using innerHTML
  // So return trimmed raw limited string without HTML tags
  const raw = input.trim().slice(0, 20).replace(/[<>]/g, '')
  return raw
}

export function validateName(name: string): string | null {
  const t = name.trim()
  if (!t) return 'Masukkan nama yang valid'
  if (t.length > 20) return 'Maksimal 20 karakter'
  if (!/^[\p{L}\p{N}\s\-'’.]+$/u.test(t)) return 'Hanya huruf, angka, spasi, dan tanda petik'
  return null
}
