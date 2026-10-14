export type Container = 'mp4' | 'webm' | 'mov' | 'mkv' | 'gif' | 'mp3'
export type VideoCodec = 'libx264' | 'libvpx'
export type QualityMode = 'crf' | 'bitrate'

export interface Settings {
  container: Container
  videoCodec: VideoCodec
  qualityMode: QualityMode
  crf: number
  videoBitrate: number
  maxHeight: number | null
  gifWidth: number
  fps: number | null
  audio: boolean
  audioBitrate: number
}

export interface Trim {
  start: number
  end: number
}

export interface ContainerInfo {
  label: string
  mime: string
  codecs: VideoCodec[]
  audioCodec: string | null
  isVideo: boolean
}

export const CONTAINERS: Record<Container, ContainerInfo> = {
  mp4: { label: 'MP4', mime: 'video/mp4', codecs: ['libx264'], audioCodec: 'aac', isVideo: true },
  webm: { label: 'WebM', mime: 'video/webm', codecs: ['libvpx'], audioCodec: 'libopus', isVideo: true },
  mov: { label: 'MOV', mime: 'video/quicktime', codecs: ['libx264'], audioCodec: 'aac', isVideo: true },
  mkv: { label: 'MKV', mime: 'video/x-matroska', codecs: ['libx264', 'libvpx'], audioCodec: 'aac', isVideo: true },
  gif: { label: 'GIF', mime: 'image/gif', codecs: [], audioCodec: null, isVideo: true },
  mp3: { label: 'MP3', mime: 'audio/mpeg', codecs: [], audioCodec: 'libmp3lame', isVideo: false },
}

export const CODEC_LABELS: Record<VideoCodec, string> = {
  libx264: 'H.264',
  libvpx: 'VP8',
}

export const CRF_RANGE: Record<VideoCodec, [number, number, number]> = {
  libx264: [16, 35, 23],
  libvpx: [4, 50, 10],
}

export function normalize(s: Settings): Settings {
  const info = CONTAINERS[s.container]
  const next = { ...s }
  if (info.codecs.length && !info.codecs.includes(next.videoCodec)) {
    next.videoCodec = info.codecs[0]
    next.crf = CRF_RANGE[next.videoCodec][2]
  }
  const [min, max] = CRF_RANGE[next.videoCodec]
  next.crf = Math.min(max, Math.max(min, next.crf))
  return next
}
