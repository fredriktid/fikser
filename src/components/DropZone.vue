<script setup lang="ts">
import { ref } from 'vue'
import { useConverter } from '../composables/useConverter'
import Icon from './ui/Icon.vue'

const { open, sample, engine } = useConverter()
const input = ref<HTMLInputElement | null>(null)
const making = ref(false)

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
</script>

<template>
  <section class="drop" aria-labelledby="drop-title">
    <div class="window">
      <h2 id="drop-title" class="title">Drop a video.<br />Get it back in any format.</h2>
      <p class="lede">
        Convert, shrink, trim or turn clips into GIFs. ffmpeg runs right here in your browser, so the file never leaves
        your computer.
      </p>
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
      <p class="hint">Or drag a file anywhere onto the page, or paste it. MP4, MOV, WebM, MKV, AVI and most others.</p>
      <input ref="input" class="sr-only" type="file" accept="video/*,audio/*,.mkv,.avi,.flv,.wmv,.ts,.m2ts" tabindex="-1" aria-label="Choose a video file" @change="pick" />
    </div>
  </section>
</template>

<style scoped>
.drop {
  flex: 1;
  display: grid;
  min-height: 520px;
  padding: var(--space-2);
  border: var(--rule-w) dashed var(--rule);
  border-radius: var(--radius);
}

.window {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-5);
  padding: clamp(var(--space-6), 5vw, var(--space-12));
  background: var(--paper);
  border: var(--rule-w) solid var(--rule);
}

.title {
  font-size: var(--text-display);
  font-weight: var(--weight-display);
  font-stretch: var(--width-display);
  line-height: 0.98;
  letter-spacing: -0.01em;
  text-transform: uppercase;
  text-wrap: balance;
  max-width: 14ch;
}

.lede {
  max-width: 52ch;
  font-size: var(--text-head);
  color: var(--ink-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-2);
}

.hint {
  font-size: var(--text-meta);
  color: var(--ink-muted);
  max-width: 60ch;
}
</style>
