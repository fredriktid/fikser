import type { Settings } from './settings'

export type PresetId = 'web' | 'small' | 'hq' | 'webm' | 'gif' | 'mp3'

export interface Preset {
  id: PresetId
  label: string
  description: string
  settings: Settings
}

const base: Settings = {
  container: 'mp4',
  videoCodec: 'libx264',
  qualityMode: 'crf',
  crf: 23,
  videoBitrate: 2500,
  maxHeight: null,
  gifWidth: 480,
  fps: null,
  audio: true,
  audioBitrate: 128,
}

export const PRESETS: Preset[] = [
  {
    id: 'web',
    label: 'Web video',
    description: 'MP4 that plays everywhere',
    settings: { ...base },
  },
  {
    id: 'small',
    label: 'Smaller file',
    description: 'Up to 720p, for email and chat',
    settings: { ...base, crf: 28, maxHeight: 720, audioBitrate: 96 },
  },
  {
    id: 'hq',
    label: 'High quality',
    description: 'Bigger file, the best picture',
    settings: { ...base, crf: 18, audioBitrate: 192 },
  },
  {
    id: 'webm',
    label: 'WebM',
    description: 'Open format for the web, slower to make',
    settings: { ...base, container: 'webm', videoCodec: 'libvpx', crf: 10 },
  },
  {
    id: 'gif',
    label: 'Animated GIF',
    description: 'Short silent loop, 480 px wide',
    settings: { ...base, container: 'gif', fps: 12, gifWidth: 480, audio: false },
  },
  {
    id: 'mp3',
    label: 'Audio only',
    description: 'Just the soundtrack as MP3',
    settings: { ...base, container: 'mp3', audioBitrate: 192 },
  },
]

export const DEFAULT_PRESET = PRESETS[0]

export function matchPreset(s: Settings): Preset | null {
  return PRESETS.find((p) => JSON.stringify(p.settings) === JSON.stringify(s)) ?? null
}
