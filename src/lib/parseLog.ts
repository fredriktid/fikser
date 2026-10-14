export interface ProbeInfo {
  duration: number | null
  width: number | null
  height: number | null
  fps: number | null
  videoCodec: string | null
  audioCodec: string | null
  container: string | null
}

export interface ProgressSample {
  time: number
  speed: number | null
  size: number | null
}

export function emptyProbe(): ProbeInfo {
  return { duration: null, width: null, height: null, fps: null, videoCodec: null, audioCodec: null, container: null }
}

export function hms(text: string): number {
  const [h, m, s] = text.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

export function probeLine(line: string, info: ProbeInfo): void {
  let m = line.match(/^Input #0, ([^,]+)/)
  if (m) info.container = m[1]
  m = line.match(/Duration: (\d+:\d+:\d+(?:\.\d+)?)/)
  if (m && info.duration === null) info.duration = hms(m[1])
  if (/Stream #0:\d+.*: Video:/.test(line) && info.videoCodec === null) {
    info.videoCodec = line.match(/Video: (\w+)/)?.[1] ?? null
    const size = line.match(/, (\d{2,5})x(\d{2,5})/)
    if (size) {
      info.width = Number(size[1])
      info.height = Number(size[2])
    }
    const fps = line.match(/([\d.]+) fps/) ?? line.match(/([\d.]+) tbr/)
    if (fps) info.fps = Number(fps[1])
  }
  if (/Stream #0:\d+.*: Audio:/.test(line) && info.audioCodec === null) {
    info.audioCodec = line.match(/Audio: (\w+)/)?.[1] ?? null
  }
}

export function progressLine(line: string): ProgressSample | null {
  const t = line.match(/time=\s*(-?\d+:\d+:\d+(?:\.\d+)?)/)
  if (!t) return null
  const speed = line.match(/speed=\s*([\d.]+)x/)
  const size = line.match(/size=\s*(\d+)(k|ki)B/i)
  return {
    time: Math.max(0, hms(t[1].replace('-', ''))),
    speed: speed ? Number(speed[1]) : null,
    size: size ? Number(size[1]) * 1024 : null,
  }
}
