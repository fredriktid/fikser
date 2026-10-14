export function bytes(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—'
  if (n < 1024) return `${n} B`
  const units = ['KB', 'MB', 'GB']
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`
}

export function clock(seconds: number | null | undefined, whole = false): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—:—'
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const secText = whole ? String(Math.floor(sec)).padStart(2, '0') : sec.toFixed(1).padStart(4, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${secText}` : `${m}:${secText}`
}

export function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, '')
}

export function extension(name: string): string {
  return name.match(/\.([^.]+)$/)?.[1]?.toLowerCase() ?? 'mp4'
}

export function took(seconds: number): string {
  return seconds < 60 ? `${seconds.toFixed(1)} s` : clock(seconds, true)
}
