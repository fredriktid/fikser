<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AdvancedOptions from './components/AdvancedOptions.vue'
import AppHeader from './components/AppHeader.vue'
import CommandPreview from './components/CommandPreview.vue'
import CompareView from './components/CompareView.vue'
import DropZone from './components/DropZone.vue'
import Filmstrip from './components/Filmstrip.vue'
import JobHistory from './components/JobHistory.vue'
import LogConsole from './components/LogConsole.vue'
import PresetPicker from './components/PresetPicker.vue'
import Recorder from './components/Recorder.vue'
import ProcessPanel from './components/ProcessPanel.vue'
import VideoStage from './components/VideoStage.vue'
import { useConverter } from './composables/useConverter'
import { CREDIT } from './credit'

const { phase, source, open, convert, cancel, setTrimEdge, loadEngine, engine, togglePlay, recorder, developing } = useConverter()
const dragging = ref(false)
let depth = 0

function hasFile(e: DragEvent) {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files')
}

function onDragEnter(e: DragEvent) {
  if (!hasFile(e) || phase.value === 'converting') return
  depth++
  dragging.value = true
}

function onDragLeave() {
  depth = Math.max(0, depth - 1)
  if (!depth) dragging.value = false
}

function onDrop(e: DragEvent) {
  depth = 0
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file && phase.value !== 'converting') open(file)
}

function onPaste(e: ClipboardEvent) {
  const file = Array.from(e.clipboardData?.files ?? [])[0]
  if (file && phase.value !== 'converting') open(file)
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  const typing = target.closest('input:not([type=range]):not([type=radio]):not([type=checkbox]), select, textarea')
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    if (phase.value === 'ready' || phase.value === 'failed') {
      e.preventDefault()
      convert()
    }
    return
  }
  if (e.key === 'Escape' && phase.value === 'converting') {
    e.preventDefault()
    cancel()
    return
  }
  if (typing || e.metaKey || e.ctrlKey || e.altKey || !source.value || phase.value === 'converting') return
  if (e.key === ' ' && phase.value !== 'done' && !target.closest('button, a, input, select, summary, [role=log]')) {
    e.preventDefault()
    togglePlay()
  }
  if (e.key === 'i' || e.key === 'I') setTrimEdge('start')
  if (e.key === 'o' || e.key === 'O') setTrimEdge('end')
}

onMounted(() => {
  loadEngine().catch(() => {})
  window.addEventListener('paste', onPaste)
  window.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPaste)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div class="app" @dragenter.prevent="onDragEnter" @dragover.prevent @dragleave="onDragLeave" @drop.prevent="onDrop">
    <AppHeader />

    <main class="main">
      <div class="stage">
        <p v-if="engine.status === 'error'" class="engine-error" role="alert">
          The video engine couldn't start: {{ engine.error }}. Try reloading the page in a recent version of Chrome, Edge,
          Firefox or Safari.
        </p>

        <Transition name="swap" mode="out-in">
          <Recorder v-if="phase === 'empty' && recorder" key="record" />
          <DropZone v-else-if="phase === 'empty'" key="drop" />
          <CompareView v-else-if="phase === 'done'" key="compare" />
          <div v-else-if="!source" key="wait" class="waiting" role="status">
            <span class="caps">{{ developing }}</span>
          </div>
          <div v-else key="source" class="source">
            <VideoStage />
            <Filmstrip />
          </div>
        </Transition>

      </div>

      <div class="extras">
        <JobHistory />
        <LogConsole />
      </div>

      <aside class="rail" aria-label="Order form">
        <section class="sec" aria-labelledby="s1">
          <h2 id="s1" class="sh caps"><em class="mono">1</em>Process</h2>
          <PresetPicker />
        </section>
        <section class="sec" aria-labelledby="s2">
          <h2 id="s2" class="sh caps"><em class="mono">2</em>Options</h2>
          <AdvancedOptions />
        </section>
        <section class="sec last" aria-labelledby="s3">
          <h2 id="s3" class="sh caps"><em class="mono">3</em>Command</h2>
          <CommandPreview />
        </section>
        <div class="dock">
          <div class="perf" aria-hidden="true" />
          <ProcessPanel />
        </div>
      </aside>
    </main>

    <footer class="footer">
      <span>
        Built by <a :href="CREDIT.url">{{ CREDIT.name }}</a> · <a :href="CREDIT.source">Source on GitHub</a>
      </span>
      <span>Powered by <a href="https://ffmpegwasm.netlify.app/">ffmpeg.wasm</a>. Your files never leave this device.</span>
    </footer>

    <Transition name="fade">
      <div v-if="dragging" class="dropping" aria-hidden="true">
        <p class="caps">Drop to load</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.main {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 520px);
  grid-template-areas:
    'stage rail'
    'extras rail';
  grid-template-rows: auto 1fr;
  gap: var(--space-6) var(--space-8);
  align-items: start;
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-8) var(--space-8);
}

.stage {
  grid-area: stage;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.stage:has(.drop) {
  min-height: calc(100dvh - var(--header-h) - 160px);
}

.extras {
  grid-area: extras;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  min-width: 0;
}

.source {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.waiting {
  display: grid;
  place-items: center;
  min-height: 420px;
  border: var(--rule-w) dashed var(--rule);
  border-radius: var(--radius);
  color: var(--rule);
  font-weight: var(--weight-strong);
  font-size: var(--text-head);
  animation: pulse 1.4s var(--ease) infinite alternate;
}

@keyframes pulse {
  to {
    border-color: var(--rule-soft);
    background: var(--tint);
  }
}

.engine-error {
  padding: var(--space-3) var(--space-4);
  border: var(--rule-w) solid var(--danger);
  color: var(--danger);
  font-weight: var(--weight-label);
}

.rail {
  grid-area: rail;
  position: sticky;
  top: calc(var(--header-h) + var(--space-6));
  display: flex;
  flex-direction: column;
  border: var(--rule-w) solid var(--rule);
  border-radius: var(--radius);
  background: var(--paper);
  max-height: calc(100dvh - var(--header-h) - var(--space-12));
  overflow: auto;
  scrollbar-width: thin;
}

.sec {
  padding: var(--space-3) var(--space-5) var(--space-4);
  border-bottom: var(--rule-w) solid var(--rule);
}

.sec.last {
  border-bottom: 0;
  padding-bottom: var(--space-5);
}

.sh {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  margin-bottom: var(--space-2);
  font-size: var(--text-head);
  font-weight: var(--weight-strong);
  color: var(--rule);
}

.sh em {
  font-style: normal;
  font-size: var(--text-meta);
  padding: 0 6px;
  border: var(--rule-w) solid var(--rule);
}

.dock {
  margin-top: auto;
  padding-top: var(--space-2);
  background: var(--paper-2);
}

.perf {
  position: relative;
  flex: none;
  height: 0;
  margin: 0 var(--space-4);
  border-top: 2px dashed var(--rule);
}

.perf::before,
.perf::after {
  content: '';
  position: absolute;
  top: -9px;
  width: 16px;
  height: 16px;
  border: var(--rule-w) solid var(--rule);
  border-radius: 50%;
  background: var(--ground);
}

.perf::before {
  left: calc(var(--space-4) * -1 - 9.5px);
}

.perf::after {
  right: calc(var(--space-4) * -1 - 9.5px);
}

.footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-2) var(--space-6);
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-8) var(--space-6);
  font-size: var(--text-meta);
  color: var(--ink-muted);
}

.dropping {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  background: color-mix(in oklab, var(--band) 88%, transparent);
  color: var(--band-ink);
  pointer-events: none;
}

.dropping p {
  padding: var(--space-6) var(--space-10);
  border: 4px double currentColor;
  font-size: var(--text-display);
  font-weight: var(--weight-display);
  font-stretch: var(--width-display);
  transform: rotate(-4deg);
}

.swap-enter-active,
.swap-leave-active {
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease);
}

.swap-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.swap-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dur) var(--ease);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1040px) {
  .main {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'stage'
      'rail'
      'extras';
    grid-template-rows: auto;
    padding: var(--space-4);
    gap: var(--space-6);
  }
  .stage {
    min-height: 0;
  }
  .rail {
    position: static;
    max-height: none;
    overflow: visible;
  }
  .footer {
    padding: var(--space-4);
  }
}
</style>
