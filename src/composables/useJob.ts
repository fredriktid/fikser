import { reactive, ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import { baseName } from '../lib/format'
import { CRASH_MESSAGE, EXIT_MESSAGE, messageOf } from '../lib/media'
import { CONTAINERS } from '../lib/settings'
import type { HistoryEntry, Phase, Progress, Result, Source } from '../lib/types'
import type { useFFmpeg } from './useFFmpeg'
import type { useSettings } from './useSettings'

interface Deps {
  engine: ReturnType<typeof useFFmpeg>
  phase: Ref<Phase>
  error: Ref<string | null>
  source: ShallowRef<Source | null>
  settings: ReturnType<typeof useSettings>
}

export function useJob({ engine, phase, error, source, settings }: Deps) {
  const result = shallowRef<Result | null>(null)
  const progress = reactive<Progress>({ ratio: 0, elapsed: 0, eta: null, speed: null, size: null })
  const history = ref<HistoryEntry[]>([])
  const jobNumber = ref(1)
  let cancelled = false

  function clearResult() {
    if (result.value) URL.revokeObjectURL(result.value.url)
    result.value = null
  }

  function log(src: Source, status: HistoryEntry['status'], outputSize: number | null, elapsed: number) {
    history.value.unshift({
      number: jobNumber.value,
      fileName: src.file.name,
      preset: settings.activePreset.value?.label ?? 'Custom',
      status,
      inputSize: src.file.size,
      outputSize,
      elapsed,
      at: new Date(),
    })
    jobNumber.value++
  }

  function track(target: number) {
    return (line: string) => {
      const p = engine.progressLine(line)
      if (!p) return
      progress.ratio = Math.max(progress.ratio, target ? Math.min(1, p.time / target) : 0)
      progress.speed = p.speed
      progress.size = p.size
      progress.eta = p.speed && target ? Math.max(0, (target - p.time) / p.speed) : null
    }
  }

  async function convert() {
    if (!source.value || phase.value === 'converting') return
    const src = source.value
    const { container } = settings.settings.value
    const { args, output } = settings.job.value
    const command = settings.command.value
    const target = settings.isTrimmed.value ? settings.trimLength.value : settings.duration.value

    clearResult()
    error.value = null
    cancelled = false
    phase.value = 'converting'
    Object.assign(progress, { ratio: 0, elapsed: 0, eta: null, speed: null, size: null })

    const started = performance.now()
    const elapsed = () => (performance.now() - started) / 1000
    const timer = setInterval(() => (progress.elapsed = elapsed()), 200)

    try {
      const code = await engine.run(args, track(target))
      if (cancelled) return
      if (code !== 0) throw new Error(EXIT_MESSAGE)

      const data = await engine.readOutput(output)
      await engine.remove(output)
      const { mime } = CONTAINERS[container]
      const blob = new Blob([data.slice()], { type: mime })
      progress.ratio = 1
      progress.size = blob.size
      result.value = { url: URL.createObjectURL(blob), blob, fileName: `${baseName(src.file.name)}.${container}`, mime, container, elapsed: elapsed(), command }
      log(src, 'done', blob.size, elapsed())
      phase.value = 'done'
    } catch (e) {
      if (cancelled) return
      error.value = engine.alive() ? messageOf(e) : CRASH_MESSAGE
      log(src, 'failed', null, elapsed())
      phase.value = 'failed'
      if (!engine.alive()) await engine.writeInput(src.inputName, src.file).catch(() => {})
    } finally {
      clearInterval(timer)
    }
  }

  async function cancel() {
    if (phase.value !== 'converting' || !source.value) return
    cancelled = true
    const src = source.value
    log(src, 'void', null, progress.elapsed)
    phase.value = 'ready'
    await engine.cancel()
    await engine.writeInput(src.inputName, src.file)
  }

  return { result, progress, history, jobNumber, clearResult, convert, cancel }
}
