<script setup lang="ts">
import { useConverter } from '../composables/useConverter'
import { bytes } from '../lib/format'
import { PRESETS } from '../lib/presets'

const { activePreset, applyPreset, estimates, source, phase } = useConverter()
</script>

<template>
  <fieldset class="presets" :disabled="phase === 'converting'">
    <legend class="sr-only">Choose what to make</legend>
    <label v-for="p in PRESETS" :key="p.id" class="opt" :class="{ sel: activePreset?.id === p.id }">
      <input type="radio" name="preset" :value="p.id" :checked="activePreset?.id === p.id" @change="applyPreset(p)" />
      <span class="radio" aria-hidden="true" />
      <span class="text">
        <strong>{{ p.label }}</strong>
        <small>{{ p.description }}</small>
      </span>
      <span v-if="source && estimates[p.id]" class="est mono" :aria-label="`About ${bytes(estimates[p.id])}`">≈ {{ bytes(estimates[p.id]) }}</span>
    </label>
    <p v-if="!activePreset" class="custom">Custom settings. Pick a preset to start over.</p>
  </fieldset>
</template>

<style scoped>
.presets {
  border: 0;
  padding: 0;
  min-width: 0;
}

.opt {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-height: 46px;
  margin: 0 calc(var(--space-5) * -1);
  padding: 6px var(--space-5);
  border-top: 1px dotted var(--rule-soft);
  cursor: pointer;
  transition: background-color var(--dur) var(--ease);
}

.opt:first-of-type {
  border-top: 0;
}

.opt:hover {
  background: var(--tint);
}

.opt.sel {
  background: var(--tint);
}

input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio {
  flex: none;
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border: var(--rule-w) solid var(--rule);
  border-radius: 50%;
}

.radio::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--rule);
  transform: scale(0);
  transition: transform var(--dur) var(--ease);
}

.sel .radio::after {
  transform: scale(1);
}

input:focus-visible + .radio {
  outline: 2px solid var(--focus);
  outline-offset: 3px;
}

.text {
  flex: 1;
  min-width: 0;
}

strong {
  display: block;
  font-weight: var(--weight-label);
}


small {
  display: block;
  color: var(--ink-muted);
  font-size: var(--text-meta);
}

.est {
  color: var(--rule);
  font-size: var(--text-meta);
  white-space: nowrap;
}

fieldset:disabled .opt {
  cursor: not-allowed;
  opacity: 0.6;
}

.custom {
  margin-top: var(--space-2);
  padding-top: var(--space-2);
  border-top: 1px dotted var(--rule-soft);
  color: var(--ink-muted);
  font-size: var(--text-meta);
}
</style>
