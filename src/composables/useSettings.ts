import { computed, ref, watch, type ShallowRef } from 'vue'
import { buildJob, toCommand } from '../lib/buildArgs'
import { estimateSize } from '../lib/estimate'
import { THREADS } from '../lib/media'
import type { ProbeInfo } from '../lib/parseLog'
import { DEFAULT_PRESET, matchPreset, PRESETS, type Preset } from '../lib/presets'
import { CONTAINERS, normalize, type Settings, type Trim } from '../lib/settings'
import type { Source } from '../lib/types'
import type { useFFmpeg } from './useFFmpeg'

interface Deps {
  engine: ReturnType<typeof useFFmpeg>
  source: ShallowRef<Source | null>
}

export function useSettings({ engine, source }: Deps) {
  const settings = ref<Settings>({ ...DEFAULT_PRESET.settings })
  const trim = ref<Trim>({ start: 0, end: 0 })

  const duration = computed(() => source.value?.probe.duration ?? 0)
  const trimLength = computed(() => Math.max(0, trim.value.end - trim.value.start))
  const isTrimmed = computed(() => !!duration.value && (trim.value.start > 0.01 || trim.value.end < duration.value - 0.01))
  const activePreset = computed<Preset | null>(() => matchPreset(settings.value))

  const job = computed(() => {
    const name = source.value?.inputName ?? 'input.mp4'
    return buildJob(settings.value, name, duration.value ? trim.value : null, duration.value, engine.engine.multithreaded ? THREADS : 1)
  })
  const command = computed(() => toCommand(job.value.args))

  function estimateFor(s: Settings): number | null {
    if (!source.value) return null
    return estimateSize(s, source.value.probe, trimLength.value || duration.value)
  }

  const estimates = computed(() => Object.fromEntries(PRESETS.map((p) => [p.id, estimateFor(p.settings)])))
  const estimate = computed(() => estimateFor(settings.value))

  watch(
    () => settings.value.container,
    () => (settings.value = normalize(settings.value)),
  )

  function applyPreset(p: Preset) {
    settings.value = { ...p.settings }
  }

  function update(patch: Partial<Settings>) {
    settings.value = normalize({ ...settings.value, ...patch })
  }

  function load(probe: ProbeInfo) {
    trim.value = { start: 0, end: probe.duration ?? 0 }
    if (!probe.videoCodec && CONTAINERS[settings.value.container].isVideo) applyPreset(PRESETS.find((p) => p.id === 'mp3')!)
  }

  function setTrimEdge(edge: 'start' | 'end', time: number) {
    const d = duration.value
    if (!d) return
    const t = Math.min(d, Math.max(0, time))
    if (edge === 'start') trim.value = { start: Math.min(t, trim.value.end - 0.1), end: trim.value.end }
    else trim.value = { start: trim.value.start, end: Math.max(t, trim.value.start + 0.1) }
  }

  function resetTrim() {
    trim.value = { start: 0, end: duration.value }
  }

  return { settings, trim, duration, trimLength, isTrimmed, activePreset, job, command, estimate, estimates, applyPreset, update, load, setTrimEdge, resetTrim }
}
