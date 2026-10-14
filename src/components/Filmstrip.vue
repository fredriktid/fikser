<script setup lang="ts">
import { computed } from 'vue'
import { useConverter } from '../composables/useConverter'
import { clock } from '../lib/format'

const { source, frames, duration, trim, trimLength, isTrimmed, playhead, seek, setTrimEdge, resetTrim, phase } = useConverter()

const pct = (t: number) => (duration.value ? (t / duration.value) * 100 : 0)
const step = computed(() => (duration.value > 120 ? 0.5 : 0.1))
const locked = computed(() => phase.value === 'converting')
const hasVideo = computed(() => !!source.value?.probe.videoCodec)

function onStart(e: Event) {
  setTrimEdge('start', Number((e.target as HTMLInputElement).value))
  seek(trim.value.start)
}

function onEnd(e: Event) {
  setTrimEdge('end', Number((e.target as HTMLInputElement).value))
  seek(trim.value.end)
}

function scrub(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement
  const r = el.getBoundingClientRect()
  seek(((e.clientX - r.left) / r.width) * duration.value)
}
</script>

<template>
  <section v-if="duration" class="strip-wrap" aria-labelledby="trim-title">
    <div class="head">
      <h2 id="trim-title" class="caps">Trim</h2>
      <p class="range mono">
        <span>{{ clock(trim.start) }}</span>
        <span aria-hidden="true">→</span>
        <span>{{ clock(trim.end) }}</span>
        <span class="len">{{ clock(trimLength) }} selected</span>
      </p>
    </div>

    <div class="strip" :style="{ '--a': pct(trim.start) + '%', '--b': pct(trim.end) + '%', '--p': pct(playhead) + '%' }">
      <div class="frames" :class="{ audio: !hasVideo }" @pointerdown="scrub">
        <template v-if="hasVideo">
          <span v-for="(f, i) in frames" :key="i" class="frame">
            <img v-if="f" :src="f" alt="" draggable="false" />
          </span>
        </template>
      </div>
      <div class="shade left" aria-hidden="true" />
      <div class="shade right" aria-hidden="true" />
      <div class="window" aria-hidden="true" />
      <div class="head-line" aria-hidden="true" />
      <input
        class="handle start"
        type="range"
        min="0"
        :max="duration"
        :step="step"
        :value="trim.start"
        :disabled="locked"
        aria-label="Trim start"
        :aria-valuetext="clock(trim.start)"
        @input="onStart"
      />
      <input
        class="handle end"
        type="range"
        min="0"
        :max="duration"
        :step="step"
        :value="trim.end"
        :disabled="locked"
        aria-label="Trim end"
        :aria-valuetext="clock(trim.end)"
        @input="onEnd"
      />
    </div>
    <ol class="edge mono" aria-hidden="true">
      <li v-for="i in 8" :key="i">{{ i }}{{ i < 8 ? ' ▸' : '' }}</li>
    </ol>

    <div class="tools">
      <button class="btn btn-quiet" type="button" :disabled="locked" @click="setTrimEdge('start')">
        Start at playhead <kbd>I</kbd>
      </button>
      <button class="btn btn-quiet" type="button" :disabled="locked" @click="setTrimEdge('end')">
        End at playhead <kbd>O</kbd>
      </button>
      <button v-if="isTrimmed" class="btn btn-quiet" type="button" :disabled="locked" @click="resetTrim">Use whole clip</button>
    </div>
  </section>
</template>

<style scoped>
.strip-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

h2 {
  font-size: var(--text-head);
  font-weight: var(--weight-strong);
  color: var(--rule);
}

.range {
  display: flex;
  gap: var(--space-2);
  font-size: var(--text-meta);
}

.len {
  margin-left: var(--space-2);
  color: var(--ink-muted);
}

.strip {
  position: relative;
  height: 76px;
  touch-action: none;
}

.frames {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 3px;
  padding: 3px;
  background: var(--player);
  cursor: pointer;
}

.frames.audio {
  background: repeating-linear-gradient(90deg, var(--player) 0 6px, color-mix(in oklab, var(--player) 80%, var(--on-player)) 6px 8px);
}

.frame {
  background: color-mix(in oklab, var(--player) 85%, var(--on-player));
  overflow: hidden;
}

.frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: develop var(--dur) var(--ease) both;
}

@keyframes develop {
  from {
    opacity: 0;
    filter: blur(6px) brightness(1.6);
  }
}

.shade {
  position: absolute;
  top: 0;
  bottom: 0;
  background: color-mix(in oklab, var(--ground) 72%, transparent);
  pointer-events: none;
}

.shade.left {
  left: 0;
  width: var(--a);
}

.shade.right {
  right: 0;
  width: calc(100% - var(--b));
}

.window {
  position: absolute;
  top: -3px;
  bottom: -3px;
  left: var(--a);
  width: calc(var(--b) - var(--a));
  border-top: 3px solid var(--rule);
  border-bottom: 3px solid var(--rule);
  pointer-events: none;
}

.head-line {
  position: absolute;
  top: -6px;
  bottom: -6px;
  left: var(--p);
  width: 2px;
  margin-left: -1px;
  background: var(--stamp);
  pointer-events: none;
}

.handle {
  position: absolute;
  inset: -6px 0;
  width: 100%;
  height: calc(100% + 12px);
  margin: 0;
  appearance: none;
  background: transparent;
  pointer-events: none;
}

.handle::-webkit-slider-runnable-track {
  height: 100%;
  background: transparent;
}

.handle::-moz-range-track {
  height: 100%;
  background: transparent;
}

.handle::-webkit-slider-thumb {
  appearance: none;
  pointer-events: auto;
  width: 16px;
  height: 88px;
  border-radius: var(--radius);
  background: var(--rule)
    linear-gradient(var(--paper), var(--paper)) center / 2px 22px no-repeat;
  cursor: ew-resize;
}

.handle::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 88px;
  border: 0;
  border-radius: var(--radius);
  background: var(--rule)
    linear-gradient(var(--paper), var(--paper)) center / 2px 22px no-repeat;
  cursor: ew-resize;
}

.handle:focus-visible {
  outline: none;
}

.handle:focus-visible::-webkit-slider-thumb {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.handle:focus-visible::-moz-range-thumb {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.handle:disabled::-webkit-slider-thumb {
  opacity: 0.5;
  cursor: not-allowed;
}

.edge {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  padding: 0;
  list-style: none;
  font-size: var(--text-micro);
  color: var(--ink-muted);
  letter-spacing: var(--track-caps);
}

.tools {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-left: calc(var(--space-3) * -1);
}

.tools .btn {
  min-height: 36px;
  font-size: var(--text-meta);
}


</style>
