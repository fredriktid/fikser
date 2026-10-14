import type { ProbeInfo } from './parseLog'
import type { Settings } from './settings'

export function estimateSize(s: Settings, probe: ProbeInfo, seconds: number): number | null {
  if (!seconds || !Number.isFinite(seconds)) return null
  const audioBits = s.audio ? s.audioBitrate * 1000 : 0

  if (s.container === 'mp3') return ((s.audioBitrate * 1000) / 8) * seconds

  const srcW = probe.width ?? 1280
  const srcH = probe.height ?? 720
  const fpsIn = probe.fps ?? 30

  if (s.container === 'gif') {
    const w = s.gifWidth
    const h = (w * srcH) / srcW
    const fps = s.fps ?? 12
    return w * h * fps * seconds * 0.09
  }

  let h = srcH
  if (s.maxHeight && s.maxHeight < h) h = s.maxHeight
  const w = (srcW * h) / srcH
  const fps = s.fps ?? fpsIn

  let videoBits: number
  if (s.qualityMode === 'bitrate') {
    videoBits = s.videoBitrate * 1000
  } else {
    const [ref, bpp] = s.videoCodec === 'libx264' ? [23, 0.07] : [10, 0.09]
    videoBits = w * h * fps * bpp * Math.pow(2, (ref - s.crf) / 6)
  }
  return ((videoBits + audioBits) / 8) * seconds
}
