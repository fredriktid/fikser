import type { ProbeInfo } from './parseLog'
import type { Settings } from './settings'

export type Phase = 'empty' | 'probing' | 'ready' | 'converting' | 'done' | 'failed'

export interface Source {
  file: File
  url: string
  inputName: string
  probe: ProbeInfo
  playable: boolean
}

export interface Result {
  url: string
  blob: Blob
  fileName: string
  mime: string
  container: Settings['container']
  elapsed: number
  command: string
}

export interface Progress {
  ratio: number
  elapsed: number
  eta: number | null
  speed: number | null
  size: number | null
}

export interface HistoryEntry {
  number: number
  fileName: string
  preset: string
  status: 'done' | 'void' | 'failed'
  inputSize: number
  outputSize: number | null
  elapsed: number
  at: Date
}
