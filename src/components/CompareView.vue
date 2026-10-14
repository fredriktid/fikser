<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useConverter } from '../composables/useConverter'
import { bytes, clock } from '../lib/format'
import Icon from './ui/Icon.vue'

const { source, result, trim, isTrimmed } = useConverter()

const before = ref<HTMLVideoElement | null>(null)
const after = ref<HTMLVideoElement | null>(null)
const split = ref(50)
const playing = ref(false)
const time = ref(0)
const length = ref(0)
const resultBroken = ref(false)

const kind = computed(() => {
  const c = result.value?.container
  if (c === 'gif') return 'gif'
  if (c === 'mp3') return 'audio'
  return 'video'
})
const canCompare = computed(() => kind.value === 'video' && !!source.value?.playable && !resultBroken.value && !!source.value?.probe.videoCodec)
const offset = computed(() => (isTrimmed.value ? trim.value.start : 0))

function syncBefore() {
  const a = after.value
  const b = before.value
  if (!a || !b) return
  time.value = a.currentTime
  const target = a.currentTime + offset.value
  if (Math.abs(b.currentTime - target) > 0.12) b.currentTime = target
}

async function toggle() {
  const a = after.value
  const b = before.value
  if (!a) return
  if (a.paused) {
    syncBefore()
    await Promise.all([a.play(), b?.play()].filter(Boolean))
    playing.value = true
  } else {
    a.pause()
    b?.pause()
    playing.value = false
  }
}

function seek(e: Event) {
  if (!after.value) return
  after.value.currentTime = Number((e.target as HTMLInputElement).value)
  syncBefore()
}

function drag(e: PointerEvent) {
  if (e.type === 'pointermove' && e.buttons !== 1) return
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
  split.value = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))
}

function ended() {
  playing.value = false
  before.value?.pause()
}

onBeforeUnmount(() => {
  after.value?.pause()
  before.value?.pause()
})
</script>

<template>
  <section v-if="result && source" class="compare" aria-label="Result">
    <template v-if="canCompare">
      <div class="frame" :style="{ '--split': split + '%' }" @pointerdown="drag" @pointermove="drag">
        <video ref="before" class="before" :src="source.url" muted playsinline preload="auto" />
        <video
          ref="after"
          class="after"
          :src="result.url"
          playsinline
          preload="auto"
          @loadedmetadata="length = ($event.target as HTMLVideoElement).duration"
          @timeupdate="syncBefore"
          @ended="ended"
          @error="resultBroken = true"
        />
        <div class="divider" aria-hidden="true"><span /></div>
        <span class="tag left caps">Before · {{ bytes(source.file.size) }}</span>
        <span class="tag right caps">After · {{ bytes(result.blob.size) }}</span>
      </div>
      <div class="controls">
        <button class="play" type="button" :aria-label="playing ? 'Pause both' : 'Play both'" @click="toggle">
          <Icon :name="playing ? 'pause' : 'play'" />
        </button>
        <input class="time" type="range" min="0" :max="length || 0" step="0.01" :value="time" aria-label="Position" @input="seek" />
        <span class="mono clock">{{ clock(time) }} / {{ clock(length) }}</span>
        <label class="split">
          <span class="sr-only">Comparison divider position</span>
          <input type="range" min="0" max="100" step="1" v-model.number="split" />
        </label>
      </div>
      <p class="help">Drag across the picture to move the divider. The left side is your original, the right side the converted file.</p>
    </template>

    <div v-else-if="kind === 'gif'" class="pair">
      <figure>
        <video v-if="source.playable" :src="source.url" muted autoplay loop playsinline />
        <figcaption class="caps">Before · {{ bytes(source.file.size) }}</figcaption>
      </figure>
      <figure>
        <img :src="result.url" alt="The converted animated GIF" />
        <figcaption class="caps">After · {{ bytes(result.blob.size) }}</figcaption>
      </figure>
    </div>

    <div v-else-if="kind === 'audio'" class="solo">
      <Icon name="film" class="glyph" />
      <audio :src="result.url" controls />
      <p class="help">The soundtrack, as {{ result.fileName }}.</p>
    </div>

    <div v-else class="solo">
      <video :src="result.url" controls playsinline @error="resultBroken = true" />
      <p v-if="resultBroken" class="help">Your browser can't preview {{ result.container.toUpperCase() }} files. Download it and open it in a player like VLC.</p>
    </div>
  </section>
</template>

<style scoped>
.compare {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.frame {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--player);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
  user-select: none;
}

.frame video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.after {
  clip-path: inset(0 0 0 var(--split));
}

.divider {
  position: absolute;
  top: 0;
  bottom: 0;
  left: var(--split);
  width: 2px;
  margin-left: -1px;
  background: var(--band);
  pointer-events: none;
}

.divider span {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 44px;
  transform: translate(-50%, -50%);
  background: var(--band);
  border-radius: var(--radius);
}

.tag {
  position: absolute;
  top: var(--space-3);
  padding: 3px var(--space-2);
  background: rgb(0 0 0 / 0.65);
  color: #f2f1ec;
  font-size: var(--text-xs);
  font-weight: 700;
}

.tag.left {
  left: var(--space-3);
}

.tag.right {
  right: var(--space-3);
}

.controls {
  display: grid;
  grid-template-columns: auto 1fr auto 140px;
  align-items: center;
  gap: var(--space-3);
}

.play {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: var(--rule-w) solid var(--rule);
  border-radius: var(--radius);
  background: var(--rule);
  color: var(--paper);
}

.play svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--rule);
}

.clock {
  font-size: var(--text-sm);
}

.help {
  color: var(--ink-muted);
  font-size: var(--text-sm);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

figure {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

figure video,
figure img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  background: var(--player);
  border-radius: var(--radius);
}

figcaption {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--rule);
}

.solo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  background: var(--player);
  color: var(--on-player);
  border-radius: var(--radius);
}

.solo video {
  width: 100%;
}

.solo audio {
  width: min(520px, 100%);
}

.solo .help {
  color: var(--on-player);
  opacity: 0.8;
}

.glyph {
  width: 48px;
  height: 48px;
  opacity: 0.6;
}

@media (max-width: 640px) {
  .controls {
    grid-template-columns: auto 1fr auto;
  }
  .split {
    grid-column: 1 / -1;
  }
  .pair {
    grid-template-columns: 1fr;
  }
}
</style>
