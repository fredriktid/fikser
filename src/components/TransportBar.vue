<script setup lang="ts">
import { clock } from '../lib/format'
import Icon from './ui/Icon.vue'

defineProps<{
  playing: boolean
  time: number
  length: number
  label?: string
}>()

const emit = defineEmits<{ toggle: []; seek: [time: number] }>()
</script>

<template>
  <div class="transport">
    <button class="play" type="button" :aria-label="playing ? `Pause ${label ?? ''}`.trim() : `Play ${label ?? ''}`.trim()" @click="emit('toggle')">
      <Icon :name="playing ? 'pause' : 'play'" />
    </button>
    <input
      class="seek"
      type="range"
      min="0"
      :max="length || 0"
      step="0.01"
      :value="time"
      aria-label="Position"
      :aria-valuetext="clock(time)"
      @input="emit('seek', Number(($event.target as HTMLInputElement).value))"
    />
    <span class="mono clock">{{ clock(time) }} / {{ clock(length) }}</span>
    <slot />
  </div>
</template>

<style scoped>
.transport {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.play {
  flex: none;
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

.seek {
  flex: 1;
  min-width: 0;
  accent-color: var(--rule);
}

.clock {
  flex: none;
  font-size: var(--text-meta);
}
</style>
