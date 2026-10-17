<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useConverter } from '../composables/useConverter'
import { bytes, clock } from '../lib/format'
import Icon from './ui/Icon.vue'

type Kind = 'camera' | 'screen'
type State = 'idle' | 'asking' | 'live' | 'recording'

const { record, recorder } = useConverter()

const kind = computed<Kind>(() => recorder.value ?? 'camera')
const mic = ref(true)
const state = ref<State>('idle')
const error = ref<string | null>(null)
const preview = ref<HTMLVideoElement | null>(null)
const elapsed = ref(0)
const size = ref(0)

let stream: MediaStream | null = null
let rec: MediaRecorder | null = null
let chunks: Blob[] = []
let started = 0
let timer: ReturnType<typeof setInterval> | undefined
let audio: AudioContext | null = null
let discard = false

const MIME_TYPES = [
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/webm',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
]

const mimeType = MIME_TYPES.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
const sourceLabel = computed(() => (kind.value === 'camera' ? 'camera' : 'screen'))

watch(preview, (el) => {
  if (el && stream) el.srcObject = stream
})

function explain(e: unknown): string {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return kind.value === 'camera'
      ? 'Camera access was refused. Allow it in the browser and try again.'
      : 'Screen sharing was cancelled or blocked.'
  }
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No camera was found on this device.'
  if (name === 'NotReadableError') return 'The camera is busy in another app.'
  return e instanceof Error ? e.message : String(e)
}

function stopTracks(s: MediaStream | null) {
  s?.getTracks().forEach((t) => t.stop())
}

function mixAudio(tracks: MediaStreamTrack[]): MediaStreamTrack[] {
  if (tracks.length < 2) return tracks
  audio = new AudioContext()
  const out = audio.createMediaStreamDestination()
  for (const t of tracks) audio.createMediaStreamSource(new MediaStream([t])).connect(out)
  return out.stream.getAudioTracks()
}

async function acquire() {
  error.value = null
  state.value = 'asking'
  let capture: MediaStream | null = null
  let voice: MediaStream | null = null
  try {
    if (kind.value === 'camera') {
      capture = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } },
        audio: mic.value,
      })
    } else {
      capture = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 30 } }, audio: true })
      if (mic.value) voice = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null)
    }
    const [video] = capture.getVideoTracks()
    const sound = mixAudio([...capture.getAudioTracks(), ...(voice?.getAudioTracks() ?? [])])
    stream = new MediaStream([video, ...sound])
    video.addEventListener('ended', onEnded)
    if (preview.value) preview.value.srcObject = stream
    state.value = 'live'
  } catch (e) {
    stopTracks(capture)
    stopTracks(voice)
    error.value = explain(e)
    state.value = 'idle'
  }
  raw = [capture, voice]
}

let raw: (MediaStream | null)[] = []

function release() {
  if (preview.value) preview.value.srcObject = null
  stopTracks(stream)
  raw.forEach(stopTracks)
  raw = []
  stream = null
  audio?.close().catch(() => {})
  audio = null
  state.value = 'idle'
}

function onEnded() {
  if (state.value === 'recording') stop()
  else release()
}

function start() {
  if (!stream || state.value !== 'live') return
  chunks = []
  size.value = 0
  elapsed.value = 0
  try {
    rec = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 8_000_000 } : undefined)
  } catch (e) {
    error.value = explain(e)
    return
  }
  rec.addEventListener('dataavailable', (e) => {
    if (e.data.size) {
      chunks.push(e.data)
      size.value += e.data.size
    }
  })
  rec.addEventListener('stop', onStop)
  rec.addEventListener('error', () => {
    error.value = 'Recording stopped unexpectedly.'
    stop()
  })
  rec.start(1000)
  started = performance.now()
  timer = setInterval(() => (elapsed.value = (performance.now() - started) / 1000), 200)
  state.value = 'recording'
}

function stop() {
  clearInterval(timer)
  if (rec && rec.state !== 'inactive') rec.stop()
  else onStop()
}

async function onStop() {
  clearInterval(timer)
  const type = rec?.mimeType || mimeType || 'video/webm'
  const blob = new Blob(chunks, { type })
  rec = null
  chunks = []
  release()
  if (discard) return
  if (!blob.size) {
    error.value = 'Nothing was recorded. Try again.'
    return
  }
  await record(blob)
}

function back() {
  discard = true
  if (state.value === 'recording') stop()
  else release()
  recorder.value = null
}

onBeforeUnmount(() => {
  discard = true
  clearInterval(timer)
  if (rec && rec.state !== 'inactive') rec.stop()
  release()
})
</script>

<template>
  <section class="rec" aria-labelledby="rec-title">
    <div class="head">
      <h2 id="rec-title" class="title">Record<br />{{ kind === 'camera' ? 'a video' : 'your screen' }}</h2>
      <div class="controls">
        <label class="check">
          <input type="checkbox" :checked="mic" :disabled="state !== 'idle'" @change="mic = ($event.target as HTMLInputElement).checked" />
          <Icon name="mic" />
          <span>Microphone</span>
        </label>
      </div>
    </div>

    <div class="player" :class="{ mirror: kind === 'camera', live: state !== 'idle' }">
      <video v-show="state === 'live' || state === 'recording'" ref="preview" muted autoplay playsinline />
      <div v-if="state === 'idle' || state === 'asking'" class="empty">
        <Icon :name="kind" class="glyph" />
        <p v-if="state === 'asking'" class="caps">Waiting for the browser…</p>
        <p v-else class="caps">Open your {{ sourceLabel }} to see a preview</p>
      </div>
      <div v-if="state === 'recording'" class="badge mono" role="status" aria-live="polite">
        <i aria-hidden="true" />
        <span class="caps">Rec</span>
        <span>{{ clock(elapsed, true) }}</span>
        <span class="size">{{ bytes(size) }}</span>
      </div>
    </div>

    <div class="actions">
      <button v-if="state === 'idle' || state === 'asking'" class="btn btn-primary" type="button" :disabled="state === 'asking'" @click="acquire">
        <Icon :name="kind" />
        {{ kind === 'camera' ? 'Open camera' : 'Pick a screen' }}
      </button>
      <button v-else-if="state === 'live'" class="btn btn-primary" type="button" @click="start">
        <Icon name="record" />
        Start recording
      </button>
      <button v-else class="btn btn-stop" type="button" @click="stop">
        <Icon name="stop" />
        Stop and use it
      </button>
      <button v-if="state === 'live'" class="btn" type="button" @click="release">
        <Icon name="close" />
        Change source
      </button>
      <button class="btn btn-quiet" type="button" @click="back">
        <Icon name="back" />
        Back
      </button>
      <p class="hint">
        <template v-if="mimeType">Recorded as {{ mimeType.includes('mp4') ? 'MP4' : 'WebM' }} and kept on this device.</template>
        <template v-else>This browser can't record video.</template>
      </p>
    </div>

    <p v-if="error" class="error" role="alert">
      <Icon name="alert" />
      {{ error }}
    </p>
  </section>
</template>

<style scoped>
.rec {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: clamp(var(--space-5), 3vw, var(--space-8));
  background: var(--paper);
  border: var(--rule-w) solid var(--rule);
  border-radius: var(--radius);
}

.head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4) var(--space-6);
}

.title {
  font-size: var(--text-display);
  font-weight: var(--weight-display);
  font-stretch: var(--width-display);
  line-height: 0.95;
  text-transform: uppercase;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
}

.check {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 40px;
  font-weight: var(--weight-label);
  cursor: pointer;
}

.check:has(input:disabled) {
  cursor: not-allowed;
  opacity: 0.6;
}

.check input {
  width: 18px;
  height: 18px;
  accent-color: var(--rule);
}

.player {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--player);
  color: var(--on-player);
  border-radius: var(--radius);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.player video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player.mirror video {
  transform: scaleX(-1);
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  opacity: 0.7;
}

.glyph {
  width: 48px;
  height: 48px;
}

.empty p {
  font-size: var(--text-meta);
  font-weight: var(--weight-strong);
}

.badge {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 4px var(--space-3) 4px var(--space-2);
  background: var(--scrim);
  color: var(--on-player);
  font-size: var(--text-meta);
  font-weight: var(--weight-strong);
}

.badge i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #e5392c;
  animation: blink 1s steps(2, start) infinite;
}

.badge .size {
  opacity: 0.7;
  font-weight: var(--weight-body);
}

@keyframes blink {
  to {
    opacity: 0.2;
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}

.btn-stop {
  border-color: var(--danger);
  background: var(--danger);
  color: var(--paper);
}

.btn-stop:hover:not(:disabled) {
  background: color-mix(in oklab, var(--danger) 86%, var(--ink));
}

.hint {
  margin-left: auto;
  font-size: var(--text-meta);
  color: var(--ink-muted);
}

.error {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: var(--rule-w) solid var(--danger);
  color: var(--danger);
  font-weight: var(--weight-label);
}

.error svg {
  width: 18px;
  height: 18px;
  flex: none;
  margin-top: 2px;
}

@media (max-width: 760px) {
  .hint {
    margin-left: 0;
    width: 100%;
  }
}
</style>
