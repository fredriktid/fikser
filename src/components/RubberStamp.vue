<script setup lang="ts">
defineProps<{
  text: string
  sub?: string
  tone?: 'stamp' | 'danger'
  landing?: boolean
}>()
</script>

<template>
  <div class="rubber" :class="[tone ?? 'stamp', { landing }]" aria-hidden="true">
    <span class="t">{{ text }}</span>
    <span v-if="sub" class="s mono">{{ sub }}</span>
  </div>
</template>

<style scoped>
.rubber {
  --c: var(--stamp);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-1) var(--space-4) var(--space-2);
  border: 4px double var(--c);
  border-radius: var(--radius);
  color: var(--c);
  transform: rotate(-6deg);
  opacity: 0.95;
  mix-blend-mode: multiply;
  pointer-events: none;
  user-select: none;
}

:root[data-theme='dark'] .rubber {
  mix-blend-mode: screen;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) .rubber {
    mix-blend-mode: screen;
  }
}

.danger {
  --c: var(--danger);
}

.t {
  font-size: var(--text-stamp);
  font-weight: var(--weight-display);
  font-stretch: var(--width-display);
  text-transform: uppercase;
  letter-spacing: var(--track-caps);
  line-height: 1.05;
}

.s {
  font-size: var(--text-meta);
  font-weight: var(--weight-strong);
  letter-spacing: var(--track-caps);
}

.landing {
  animation: thunk var(--dur) var(--ease) both;
}

@keyframes thunk {
  0% {
    opacity: 0;
    transform: rotate(-14deg) scale(1.9);
    filter: blur(3px);
  }
  55% {
    opacity: 0.95;
    transform: rotate(-5deg) scale(0.96);
    filter: blur(0);
  }
  100% {
    opacity: 0.95;
    transform: rotate(-6deg) scale(1);
  }
}
</style>
