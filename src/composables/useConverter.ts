import { computed, reactive, ref, shallowRef, watch } from 'vue'
import { buildJob, toCommand } from '../lib/buildArgs'
import { estimateSize } from '../lib/estimate'
import { baseName, extension } from '../lib/format'
import { emptyProbe, type ProbeInfo } from '../lib/parseLog'
import { DEFAULT_PRESET, matchPreset, PRESETS, type Preset } from '../lib/presets'
import { CONTAINERS, normalize, type Settings, type Trim } from '../lib/settings'
import { useFFmpeg } from './useFFmpeg'

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

const FRAME_COUNT = 8
const THREADS = 4
const LARGE_FILE = 500 * 1024 * 1024

const engine = useFFmpeg()

const phase = ref<Phase>('empty')
const source = shallowRef<Source | null>(null)
const settings = ref<Settings>({ ...DEFAULT_PRESET.settings })
const trim = ref<Trim>({ start: 0, end: 0 })
const frames = ref<(string | null)[]>([])
const result = shallowRef<Result | null>(null)
const error = ref<string | null>(null)
const progress = reactive<Progress>({ ratio: 0, elapsed: 0, eta: null, speed: null, size: null })
const history = ref<HistoryEntry[]>([])
const jobNumber = ref(1)
const playhead = ref(0)
const player = shallowRef<HTMLMediaElement | null>(null)

let cancelled = false
let loadToken = 0

const duration = computed(() => source.value?.probe.duration ?? 0)
const trimLength = computed(() => Math.max(0, trim.value.end - trim.value.start))
const activePreset = computed<Preset | null>(() => matchPreset(settings.value))
const isTrimmed = computed(() => !!duration.value && (trim.value.start > 0.01 || trim.value.end < duration.value - 0.01))
const largeFile = computed(() => (source.value?.file.size ?? 0) > LARGE_FILE)

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

function clearResult() {
  if (result.value) URL.revokeObjectURL(result.value.url)
  result.value = null
}

function clearFrames() {
  frames.value.forEach((f) => f && URL.revokeObjectURL(f))
  frames.value = []
}

async function open(file: File) {
  const token = ++loadToken
  if (source.value) {
    URL.revokeObjectURL(source.value.url)
    await engine.remove(source.value.inputName)
  }
  clearResult()
  clearFrames()
  error.value = null
  phase.value = 'probing'

  const inputName = `input.${extension(file.name)}`
  const url = URL.createObjectURL(file)
  source.value = { file, url, inputName, probe: emptyProbe(), playable: true }

  try {
    await engine.writeInput(inputName, file)
    const probe = await engine.probe(inputName)
    if (token !== loadToken) return
    if (probe.duration === null && probe.videoCodec === null && probe.audioCodec === null) {
      throw new Error("ffmpeg couldn't read this file. It may not be a video.")
    }
    source.value = { ...source.value, probe }
    trim.value = { start: 0, end: probe.duration ?? 0 }
    if (!probe.videoCodec && CONTAINERS[settings.value.container].isVideo) applyPreset(PRESETS.find((p) => p.id === 'mp3')!)
    phase.value = 'ready'
    loadFrames(token, probe)
  } catch (e) {
    if (token !== loadToken) return
    error.value = e instanceof Error ? e.message : String(e)
    phase.value = 'failed'
  }
}

async function loadFrames(token: number, probe: ProbeInfo) {
  if (!probe.videoCodec || !probe.duration || !source.value) return
  const name = source.value.inputName
  frames.value = Array(FRAME_COUNT).fill(null)
  for (let i = 0; i < FRAME_COUNT; i++) {
    if (token !== loadToken || phase.value === 'converting') return
    const t = (probe.duration * (i + 0.5)) / FRAME_COUNT
    const blob = await engine.frameAt(name, t).catch(() => null)
    if (token !== loadToken) return
    const next = [...frames.value]
    next[i] = blob ? URL.createObjectURL(blob) : null
    frames.value = next
  }
}

async function sample() {
  const seconds = 8
  phase.value = 'probing'
  await engine.run([
    '-hide_banner',
    '-f', 'lavfi', '-i', `testsrc2=size=1280x720:rate=30:duration=${seconds},format=yuv420p[out0];sine=frequency=330:beep_factor=4:duration=${seconds}[out1]`,
    '-threads', String(THREADS),
    '-c:v', 'libx264', '-preset', 'ultrafast',
    '-c:a', 'aac', '-b:a', '128k', '-y', 'sample.mp4',
  ])
  const data = await engine.readOutput('sample.mp4')
  await engine.remove('sample.mp4')
  await open(new File([data.slice()], 'test-pattern.mp4', { type: 'video/mp4' }))
}

async function convert() {
  if (!source.value || phase.value === 'converting') return
  const src = source.value
  const s = settings.value
  const current = job.value
  const cmd = command.value
  const presetLabel = activePreset.value?.label ?? 'Custom'
  const number = jobNumber.value
  const target = isTrimmed.value ? trimLength.value : duration.value

  clearResult()
  error.value = null
  cancelled = false
  phase.value = 'converting'
  Object.assign(progress, { ratio: 0, elapsed: 0, eta: null, speed: null, size: null })

  const started = performance.now()
  const timer = setInterval(() => (progress.elapsed = (performance.now() - started) / 1000), 200)

  const finish = (status: HistoryEntry['status'], outputSize: number | null) => {
    clearInterval(timer)
    history.value.unshift({
      number,
      fileName: src.file.name,
      preset: presetLabel,
      status,
      inputSize: src.file.size,
      outputSize,
      elapsed: (performance.now() - started) / 1000,
      at: new Date(),
    })
    jobNumber.value++
  }

  try {
    const code = await engine.run(current.args, (line) => {
      const p = engine.progressLine(line)
      if (!p) return
      const ratio = target ? Math.min(1, p.time / target) : 0
      progress.ratio = Math.max(progress.ratio, ratio)
      progress.speed = p.speed
      progress.size = p.size
      progress.eta = p.speed && target ? Math.max(0, (target - p.time) / p.speed) : null
    })
    if (cancelled) return
    if (code !== 0) throw new Error('ffmpeg stopped with an error. The log has the details.')

    const data = await engine.readOutput(current.output)
    await engine.remove(current.output)
    const info = CONTAINERS[s.container]
    const blob = new Blob([data.slice()], { type: info.mime })
    progress.ratio = 1
    progress.size = blob.size
    result.value = {
      url: URL.createObjectURL(blob),
      blob,
      fileName: `${baseName(src.file.name)}.${s.container}`,
      mime: info.mime,
      container: s.container,
      elapsed: (performance.now() - started) / 1000,
      command: cmd,
    }
    finish('done', blob.size)
    phase.value = 'done'
  } catch (e) {
    if (cancelled) return
    error.value = engine.alive() ? (e instanceof Error ? e.message : String(e)) : 'ffmpeg ran out of memory or crashed on this file. Try a smaller size or another format.'
    finish('failed', null)
    phase.value = 'failed'
    if (!engine.alive()) await engine.writeInput(src.inputName, src.file).catch(() => {})
  }
}

async function cancel() {
  if (phase.value !== 'converting' || !source.value) return
  cancelled = true
  const src = source.value
  history.value.unshift({
    number: jobNumber.value,
    fileName: src.file.name,
    preset: activePreset.value?.label ?? 'Custom',
    status: 'void',
    inputSize: src.file.size,
    outputSize: null,
    elapsed: progress.elapsed,
    at: new Date(),
  })
  jobNumber.value++
  phase.value = 'ready'
  await engine.cancel()
  await engine.writeInput(src.inputName, src.file)
}

function backToSettings() {
  clearResult()
  phase.value = source.value ? 'ready' : 'empty'
}

function reset() {
  loadToken++
  if (source.value) {
    URL.revokeObjectURL(source.value.url)
    engine.remove(source.value.inputName)
  }
  source.value = null
  clearResult()
  clearFrames()
  error.value = null
  phase.value = 'empty'
}

function togglePlay() {
  const el = player.value
  if (!el) return
  if (el.paused) el.play()
  else el.pause()
}

function seek(time: number) {
  if (player.value) player.value.currentTime = time
  playhead.value = time
}

function setTrimEdge(edge: 'start' | 'end', time = playhead.value) {
  const d = duration.value
  if (!d) return
  const t = Math.min(d, Math.max(0, time))
  if (edge === 'start') trim.value = { start: Math.min(t, trim.value.end - 0.1), end: trim.value.end }
  else trim.value = { start: trim.value.start, end: Math.max(t, trim.value.start + 0.1) }
}

function resetTrim() {
  trim.value = { start: 0, end: duration.value }
}

function setPlayable(playable: boolean) {
  if (source.value && source.value.playable !== playable) source.value = { ...source.value, playable }
}

export function useConverter() {
  return {
    engine: engine.engine,
    loadEngine: engine.load,
    phase,
    source,
    settings,
    trim,
    frames,
    result,
    error,
    progress,
    history,
    jobNumber,
    duration,
    trimLength,
    isTrimmed,
    largeFile,
    activePreset,
    command,
    estimate,
    estimates,
    applyPreset,
    update,
    open,
    sample,
    convert,
    cancel,
    backToSettings,
    reset,
    setPlayable,
    playhead,
    player,
    seek,
    togglePlay,
    setTrimEdge,
    resetTrim,
  }
}
