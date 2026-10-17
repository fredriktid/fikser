import { computed, ref, shallowRef, type Ref } from 'vue'
import { extension } from '../lib/format'
import { FRAME_COUNT, LARGE_FILE, messageOf, remuxArgs, timestamp, UNREADABLE_MESSAGE } from '../lib/media'
import { emptyProbe, type ProbeInfo } from '../lib/parseLog'
import type { Phase, Source } from '../lib/types'
import type { useFFmpeg } from './useFFmpeg'

interface Deps {
  engine: ReturnType<typeof useFFmpeg>
  phase: Ref<Phase>
  error: Ref<string | null>
  onOpen: () => void
  onProbed: (probe: ProbeInfo) => void
}

export function useSource({ engine, phase, error, onOpen, onProbed }: Deps) {
  const source = shallowRef<Source | null>(null)
  const frames = ref<(string | null)[]>([])
  const recorder = ref<'camera' | 'screen' | null>(null)
  const developing = ref('')
  const largeFile = computed(() => (source.value?.file.size ?? 0) > LARGE_FILE)
  let loadToken = 0

  function clearFrames() {
    frames.value.forEach((f) => f && URL.revokeObjectURL(f))
    frames.value = []
  }

  function discard(): Promise<void> {
    const old = source.value
    if (!old) return Promise.resolve()
    source.value = null
    URL.revokeObjectURL(old.url)
    return engine.remove(old.inputName)
  }

  async function open(file: File) {
    const token = ++loadToken
    const removed = discard()
    clearFrames()
    onOpen()
    error.value = null
    recorder.value = null
    phase.value = 'probing'

    const inputName = `input.${extension(file.name)}`
    source.value = { file, url: URL.createObjectURL(file), inputName, probe: emptyProbe(), playable: true }

    try {
      await removed
      await engine.writeInput(inputName, file)
      const probe = await engine.probe(inputName)
      if (token !== loadToken) return
      if (probe.duration === null && probe.videoCodec === null && probe.audioCodec === null) throw new Error(UNREADABLE_MESSAGE)
      source.value = { ...source.value, probe }
      onProbed(probe)
      phase.value = 'ready'
      loadFrames(token, probe)
    } catch (e) {
      if (token !== loadToken) return
      error.value = messageOf(e)
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

  async function record(blob: Blob) {
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
    const raw = `raw.${ext}`
    const fixed = `fixed.${ext}`
    recorder.value = null
    developing.value = 'Developing the recording…'
    phase.value = 'probing'

    let data: Uint8Array | null = null
    try {
      await engine.writeInput(raw, blob)
      if ((await engine.run(remuxArgs(raw, fixed))) === 0) data = await engine.readOutput(fixed)
    } catch {
      data = null
    } finally {
      await engine.remove(raw)
      await engine.remove(fixed)
    }
    await open(new File([data ? data.slice() : blob], `Recording ${timestamp()}.${ext}`, { type: blob.type }))
  }

  function setPlayable(playable: boolean) {
    if (source.value && source.value.playable !== playable) source.value = { ...source.value, playable }
  }

  function clear() {
    loadToken++
    discard()
    clearFrames()
  }

  return { source, frames, recorder, developing, largeFile, open, record, setPlayable, clear }
}
