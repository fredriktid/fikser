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
  border-radius: 3px;
  color: var(--c);
  transform: rotate(-6deg);
  opacity: 0.85;
  mix-blend-mode: multiply;
  pointer-events: none;
  user-select: none;
  -webkit-mask-image: radial-gradient(circle at 30% 40%, #000 55%, rgb(0 0 0 / 0.75) 75%, #000 100%);
  mask-image: radial-gradient(circle at 30% 40%, #000 55%, rgb(0 0 0 / 0.75) 75%, #000 100%);
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
  font-size: 1.5rem;
  font-weight: 800;
  font-stretch: 68%;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  line-height: 1.05;
}

.s {
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.08em;
}

.landing {
  animation: thunk 420ms var(--ease) both;
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
    opacity: 0.85;
    transform: rotate(-6deg) scale(1);
  }
}
</style>
