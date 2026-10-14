<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useConverter } from '../composables/useConverter'
import Icon from './ui/Icon.vue'

const { engine } = useConverter()
const open = ref(false)
const body = ref<HTMLElement | null>(null)

watch(
  () => engine.log.length,
  async () => {
    if (!open.value || !body.value) return
    const el = body.value
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
    await nextTick()
    if (atBottom) el.scrollTop = el.scrollHeight
  },
)

watch(open, async (v) => {
  if (!v) return
  await nextTick()
  if (body.value) body.value.scrollTop = body.value.scrollHeight
})
</script>

<template>
  <section class="console" :class="{ open }">
    <button class="toggle" type="button" :aria-expanded="open" aria-controls="ffmpeg-log" @click="open = !open">
      <Icon name="terminal" />
      <span class="caps">ffmpeg log</span>
      <span class="count mono">{{ engine.log.length }} {{ engine.log.length === 1 ? 'line' : 'lines' }}</span>
      <Icon name="chevron" class="chev" />
    </button>
    <div v-show="open" id="ffmpeg-log" ref="body" class="body mono" role="log" aria-label="ffmpeg output" tabindex="0">
      <p v-if="!engine.log.length" class="line muted">Nothing yet. ffmpeg's output appears here as it works.</p>
      <p v-for="l in engine.log" :key="l.id" class="line" :data-type="l.type">{{ l.message }}</p>
    </div>
  </section>
</template>

<style scoped>
.console {
  border: var(--rule-w) solid var(--rule);
  border-radius: var(--radius);
  background: var(--paper);
}

.toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 44px;
  padding: 0 var(--space-4);
  border: 0;
  background: transparent;
  color: var(--rule);
  text-align: left;
}

.toggle svg {
  width: 18px;
  height: 18px;
}

.toggle .caps {
  font-weight: var(--weight-strong);
  font-size: var(--text-body);
}

.count {
  margin-left: auto;
  color: var(--ink-muted);
  font-size: var(--text-micro);
}

.chev {
  transition: transform var(--dur) var(--ease);
}

.open .chev {
  transform: rotate(180deg);
}

.body {
  max-height: 320px;
  overflow: auto;
  padding: var(--space-3) var(--space-4);
  border-top: 1px dotted var(--rule-soft);
  background: var(--code-bg);
  font-size: var(--text-micro);
  line-height: 1.6;
}

.line {
  white-space: pre-wrap;
  word-break: break-all;
}

.line[data-type='command'] {
  color: var(--rule);
  font-weight: var(--weight-strong);
  margin-top: var(--space-2);
}

.line[data-type='info'] {
  color: var(--stamp);
}

.muted {
  color: var(--ink-muted);
}
</style>
