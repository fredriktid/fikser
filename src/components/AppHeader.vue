<script setup lang="ts">
import { computed } from 'vue'
import { useConverter } from '../composables/useConverter'
import { useTheme } from '../composables/useTheme'
import Icon from './ui/Icon.vue'

const { engine, jobNumber } = useConverter()
const { theme, toggle } = useTheme()

const engineLabel = computed(() => {
  switch (engine.status) {
    case 'idle':
    case 'loading':
      return 'Loading engine'
    case 'error':
      return 'Engine failed'
    case 'busy':
      return engine.multithreaded ? `Working · ${engine.threads} threads` : 'Working · 1 thread'
    default:
      return engine.multithreaded ? `Engine ready · ${engine.threads} threads` : 'Engine ready · 1 thread'
  }
})
</script>

<template>
  <header class="header">
    <div class="brand">
      <h1 class="logo">Fixer</h1>
      <span class="sub">Video lab · runs in your browser</span>
    </div>
    <div class="right">
      <span class="pill mono" :data-status="engine.status" role="status">
        <i aria-hidden="true" />
        {{ engineLabel }}
      </span>
      <span class="job mono" aria-label="Next job number">JOB № {{ String(jobNumber).padStart(4, '0') }}</span>
      <button class="theme" type="button" :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggle">
        <Icon :name="theme === 'dark' ? 'sun' : 'moon'" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--header-h);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0 var(--space-8);
  background: var(--band);
  color: var(--band-ink);
  border-bottom: 2px solid var(--band-ink);
}

.brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.logo {
  font-size: 2.125rem;
  font-weight: 800;
  font-stretch: 68%;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1;
}

.sub {
  margin-left: var(--space-4);
  padding-left: var(--space-4);
  border-left: var(--rule-w) solid currentColor;
  font-size: var(--text-sm);
  white-space: nowrap;
}

.right {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 5px var(--space-3);
  border: var(--rule-w) solid currentColor;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.pill i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.pill[data-status='loading'] i,
.pill[data-status='idle'] i,
.pill[data-status='busy'] i {
  animation: blink 1.1s steps(2, jump-none) infinite;
}

@keyframes blink {
  50% {
    opacity: 0.2;
  }
}

.job {
  font-size: var(--text-md);
  font-weight: 700;
  white-space: nowrap;
}

.theme {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: var(--rule-w) solid currentColor;
  border-radius: var(--radius);
  background: transparent;
}

.theme svg {
  width: 18px;
  height: 18px;
}

.theme:focus-visible {
  outline-color: var(--band-ink);
}

@media (max-width: 760px) {
  .header {
    padding: 0 var(--space-4);
  }
  .sub,
  .job {
    display: none;
  }
  .right {
    gap: var(--space-3);
  }
}
</style>
