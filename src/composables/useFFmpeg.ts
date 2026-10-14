import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'
import { reactive, readonly, shallowRef } from 'vue'
import { emptyProbe, probeLine, progressLine, type ProbeInfo, type ProgressSample } from '../lib/parseLog'

const base = `${import.meta.env.BASE_URL}ffmpeg`

export type EngineStatus = 'idle' | 'loading' | 'ready' | 'busy' | 'error'

export interface LogLine {
  id: number
  type: string
  message: string
}

const MAX_LOG = 2000

const state = reactive({
  status: 'idle' as EngineStatus,
  multithreaded: false,
  threads: 1,
  error: null as string | null,
  log: [] as LogLine[],
})

const instance = shallowRef<FFmpeg | null>(null)
let loading: Promise<FFmpeg> | null = null
let logId = 0
let lineListener: ((line: string) => void) | null = null

function pushLog(type: string, message: string) {
  state.log.push({ id: logId++, type, message })
  if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG)
}

async function load(): Promise<FFmpeg> {
  if (instance.value) return instance.value
  if (loading) return loading

  loading = (async () => {
    state.status = 'loading'
    state.error = null
    const ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ type, message }) => {
      if (message === 'Aborted()') return
      pushLog(type, message)
      lineListener?.(message)
    })

    const canThread = typeof SharedArrayBuffer !== 'undefined' && window.crossOriginIsolated
    try {
      if (canThread) {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${base}/core-mt/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${base}/core-mt/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await toBlobURL(`${base}/core-mt/ffmpeg-core.worker.js`, 'text/javascript'),
        })
        state.multithreaded = true
        state.threads = Math.min(navigator.hardwareConcurrency || 4, 4)
      } else {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${base}/core/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${base}/core/ffmpeg-core.wasm`, 'application/wasm'),
        })
        state.multithreaded = false
        state.threads = 1
      }
      pushLog('info', `[fixer] ffmpeg.wasm loaded (${state.multithreaded ? `multithreaded, ${state.threads} threads` : 'single thread'})`)
      instance.value = ffmpeg
      state.status = 'ready'
      return ffmpeg
    } catch (err) {
      state.status = 'error'
      state.error = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading = null
    }
  })()
  return loading
}

let queue: Promise<unknown> = Promise.resolve()

function run(args: string[], onLine?: (line: string) => void): Promise<number> {
  const next = queue.then(async () => {
    const ffmpeg = await load()
    state.status = 'busy'
    lineListener = onLine ?? null
    pushLog('command', `$ ffmpeg ${args.join(' ')}`)
    try {
      return await ffmpeg.exec(args)
    } catch (err) {
      if (instance.value === ffmpeg) {
        ffmpeg.terminate()
        instance.value = null
        state.status = 'idle'
        pushLog('error', `[fixer] ffmpeg crashed (${err instanceof Error ? err.message : err}); restarting engine`)
      }
      throw err
    } finally {
      lineListener = null
      if (instance.value === ffmpeg) state.status = 'ready'
    }
  })
  queue = next.catch(() => {})
  return next
}

async function writeInput(name: string, file: File | Blob): Promise<void> {
  const ffmpeg = await load()
  await ffmpeg.writeFile(name, await fetchFile(file))
}

async function readOutput(name: string): Promise<Uint8Array> {
  const ffmpeg = await load()
  const data = await ffmpeg.readFile(name)
  if (typeof data === 'string') throw new Error('Unexpected text output')
  return data
}

async function remove(name: string): Promise<void> {
  await instance.value?.deleteFile(name).catch(() => {})
}

async function probe(name: string): Promise<ProbeInfo> {
  const info = emptyProbe()
  await run(['-hide_banner', '-i', name], (l) => probeLine(l, info))
  return info
}

async function frameAt(name: string, time: number, width = 240): Promise<Blob | null> {
  const out = `thumb-${Math.round(time * 1000)}.jpg`
  const code = await run(['-hide_banner', '-loglevel', 'error', '-threads', '2', '-ss', time.toFixed(3), '-i', name, '-an', '-frames:v', '1', '-threads', '1', '-vf', `scale=${width}:-2`, '-q:v', '5', '-y', out])
  if (code !== 0) return null
  try {
    const data = await readOutput(out)
    return new Blob([data.slice()], { type: 'image/jpeg' })
  } catch {
    return null
  } finally {
    await remove(out)
  }
}

async function cancel(): Promise<void> {
  const ffmpeg = instance.value
  instance.value = null
  lineListener = null
  ffmpeg?.terminate()
  queue = Promise.resolve()
  pushLog('info', '[fixer] cancelled; restarting engine')
  state.status = 'idle'
  await load()
}

export function useFFmpeg() {
  return {
    alive: () => !!instance.value,
    engine: readonly(state),
    load,
    run,
    writeInput,
    readOutput,
    remove,
    probe,
    frameAt,
    cancel,
    progressLine: progressLine as (line: string) => ProgressSample | null,
  }
}
