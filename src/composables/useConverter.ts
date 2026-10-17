import { ref } from 'vue'
import type { Phase } from '../lib/types'
import { useFFmpeg } from './useFFmpeg'
import { useJob } from './useJob'
import { usePlayer } from './usePlayer'
import { useSettings } from './useSettings'
import { useSource } from './useSource'

const engine = useFFmpeg()
const phase = ref<Phase>('empty')
const error = ref<string | null>(null)

const src = useSource({
  engine,
  phase,
  error,
  onOpen: () => job.clearResult(),
  onProbed: (probe) => settings.load(probe),
})
const settings = useSettings({ engine, source: src.source })
const job = useJob({ engine, phase, error, source: src.source, settings })
const player = usePlayer()

function backToSettings() {
  job.clearResult()
  phase.value = src.source.value ? 'ready' : 'empty'
}

function reset() {
  src.clear()
  job.clearResult()
  error.value = null
  phase.value = 'empty'
}

function setTrimEdge(edge: 'start' | 'end', time = player.playhead.value) {
  settings.setTrimEdge(edge, time)
}

export function useConverter() {
  return {
    engine: engine.engine,
    loadEngine: engine.load,
    phase,
    error,
    ...src,
    ...settings,
    ...job,
    ...player,
    setTrimEdge,
    backToSettings,
    reset,
  }
}
