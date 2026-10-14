<script setup lang="ts">
import { ref } from 'vue'
import { useConverter } from '../composables/useConverter'
import Icon from './ui/Icon.vue'

const props = defineProps<{ command?: string }>()
const { command } = useConverter()
const copied = ref(false)
let timer = 0

async function copy() {
  await navigator.clipboard.writeText(props.command ?? command.value)
  copied.value = true
  clearTimeout(timer)
  timer = window.setTimeout(() => (copied.value = false), 1600)
}
</script>

<template>
  <div class="cmd">
    <code class="mono">{{ props.command ?? command }}</code>
    <button class="copy" type="button" :aria-label="copied ? 'Copied' : 'Copy command'" @click="copy">
      <Icon :name="copied ? 'check' : 'copy'" />
    </button>
    <span class="sr-only" aria-live="polite">{{ copied ? 'Command copied' : '' }}</span>
  </div>
</template>

<style scoped>
.cmd {
  position: relative;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background: var(--code-bg);
}

code {
  display: block;
  padding: var(--space-3) 48px var(--space-3) var(--space-3);
  font-size: var(--text-xs);
  line-height: 1.6;
  color: var(--ink);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.copy {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius);
  background: transparent;
  color: var(--rule);
}

.copy:hover {
  background: var(--tint);
}

.copy svg {
  width: 18px;
  height: 18px;
}
</style>
