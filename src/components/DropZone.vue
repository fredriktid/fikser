<script setup lang="ts">
import { ref } from 'vue'
import { useConverter } from '../composables/useConverter'
import Icon from './ui/Icon.vue'

const { open, sample, engine } = useConverter()
const input = ref<HTMLInputElement | null>(null)
const making = ref(false)
const over = ref(false)

function pick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) open(file)
  ;(e.target as HTMLInputElement).value = ''
}

async function makeSample() {
  making.value = true
  try {
    await sample()
  } finally {
    making.value = false
  }
}

const lines = [
  ['Service', 'Convert, shrink, trim, or turn a clip into a GIF or MP3'],
  ['Processed', 'On this computer. Nothing is uploaded'],
  ['Accepted', 'MP4, MOV, WebM, MKV, AVI and most other video'],
  ['Collect', 'Download from the claim stub when it is stamped'],
]
</script>

<template>
  <section class="drop" aria-labelledby="drop-title">
    <div class="front">
      <h2 id="drop-title" class="title">Drop off<br />a video</h2>
      <dl class="lines">
        <div v-for="[k, v] in lines" :key="k" class="line">
          <dt class="caps">{{ k }}</dt>
          <dd>{{ v }}</dd>
        </div>
      </dl>
    </div>

    <div class="window" :class="{ over }" @dragenter="over = true" @dragleave="over = false" @drop="over = false">
      <Icon name="film" class="glyph" />
      <p class="place">Place your video in the window</p>
      <div class="actions">
        <button class="btn btn-primary" type="button" @click="input?.click()">
          <Icon name="upload" />
          Choose a video
        </button>
        <button class="btn" type="button" :disabled="making || engine.status === 'error'" @click="makeSample">
          <Icon name="pattern" />
          {{ making ? 'Making test clip…' : 'Use a test clip' }}
        </button>
      </div>
      <p class="hint">Or drag it anywhere onto the page, or paste it.</p>
      <input ref="input" class="sr-only" type="file" accept="video/*,audio/*,.mkv,.avi,.flv,.wmv,.ts,.m2ts" tabindex="-1" aria-label="Choose a video file" @change="pick" />
    </div>
  </section>
</template>

<style scoped>
.drop {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: clamp(var(--space-6), 4vw, var(--space-12));
  align-items: center;
  min-height: 520px;
  padding: clamp(var(--space-6), 4vw, var(--space-12));
  background: var(--paper);
  border: var(--rule-w) solid var(--rule);
  border-radius: var(--radius);
}

.front {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  min-width: 0;
}

.title {
  font-size: var(--text-display);
  font-weight: var(--weight-display);
  font-stretch: var(--width-display);
  line-height: 0.95;
  text-transform: uppercase;
  text-wrap: balance;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 46ch;
}

.line {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  align-items: baseline;
  gap: var(--space-3);
}

dt {
  color: var(--rule);
  font-weight: var(--weight-strong);
  font-size: var(--text-meta);
}

dd {
  margin: 0;
  padding-bottom: var(--space-1);
  border-bottom: 1px dotted var(--rule);
  font-size: var(--text-body);
  line-height: 1.5;
}

.window {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  min-height: 380px;
  padding: var(--space-8) var(--space-6);
  background: var(--paper-2);
  border: var(--rule-w) solid var(--rule);
  border-radius: 28px;
  box-shadow:
    inset 0 0 0 6px var(--paper-2),
    inset 0 0 0 7px var(--rule-soft);
  text-align: center;
  transition:
    background-color var(--dur) var(--ease),
    box-shadow var(--dur) var(--ease);
}

.window.over {
  background: var(--tint);
  box-shadow:
    inset 0 0 0 6px var(--paper-2),
    inset 0 0 0 8px var(--rule);
}

.glyph {
  width: 44px;
  height: 44px;
  color: var(--rule);
}

.place {
  font-size: var(--text-head);
  font-weight: var(--weight-strong);
  font-stretch: var(--width-caps);
  text-transform: uppercase;
  letter-spacing: var(--track-caps);
  color: var(--rule);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
}

.hint {
  font-size: var(--text-meta);
  color: var(--ink-muted);
}

@media (max-width: 1200px) {
  .drop {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
  }
  .front {
    display: contents;
  }
  .window {
    min-height: 280px;
  }
  .lines {
    order: 1;
  }
}

@media (max-width: 520px) {
  .line {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-1);
  }
}
</style>
