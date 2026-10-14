<script setup lang="ts">
import { computed } from 'vue'
import { useConverter } from '../composables/useConverter'
import { bytes, clock, took } from '../lib/format'
import Icon from './ui/Icon.vue'
import RubberStamp from './RubberStamp.vue'

const {
  phase,
  source,
  progress,
  result,
  error,
  estimate,
  jobNumber,
  history,
  convert,
  cancel,
  backToSettings,
  settings,
  trimLength,
  largeFile,
  engine,
} = useConverter()

const pct = computed(() => Math.round(progress.ratio * 100))
const number = computed(() => String(phase.value === 'done' || phase.value === 'failed' ? history.value[0]?.number ?? jobNumber.value : jobNumber.value).padStart(4, '0'))
const saved = computed(() => {
  if (!result.value || !source.value) return null
  const ratio = 1 - result.value.blob.size / source.value.file.size
  return Math.round(ratio * 100)
})
const today = computed(() => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase())
const longGif = computed(() => settings.value.container === 'gif' && trimLength.value > 15)
const canConvert = computed(() => phase.value === 'ready' && engine.status !== 'error')
const shortcut = navigator.platform.toLowerCase().includes('mac') ? '⌘ Enter' : 'Ctrl Enter'
</script>

<template>
  <section class="proc" :data-phase="phase" aria-labelledby="proc-title">
    <div class="ph">
      <h2 id="proc-title" class="caps">
        <template v-if="phase === 'done'">Claim stub</template>
        <template v-else-if="phase === 'converting'">Processing</template>
        <template v-else>Ready to process</template>
        <span class="mono num">№ {{ number }}</span>
      </h2>
      <RubberStamp v-if="phase === 'converting'" class="stamp" text="In process" :sub="today" />
      <RubberStamp v-else-if="phase === 'done'" :key="number" class="stamp" text="Processed" :sub="today" landing />
      <RubberStamp v-else-if="phase === 'failed'" :key="number" class="stamp" text="Void" :sub="today" tone="danger" landing />
    </div>

    <template v-if="phase === 'converting'">
      <div class="bar" role="progressbar" aria-label="Conversion progress" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100">
        <i :style="{ transform: `scaleX(${progress.ratio})` }" />
      </div>
      <dl class="cells mono">
        <div><dt>Done</dt><dd>{{ pct }}%</dd></div>
        <div><dt>Elapsed</dt><dd>{{ clock(progress.elapsed, true) }}</dd></div>
        <div><dt>Left</dt><dd>{{ progress.eta != null ? clock(progress.eta, true) : '—' }}</dd></div>
        <div><dt>Speed</dt><dd>{{ progress.speed != null ? `${progress.speed.toFixed(1)}×` : '—' }}</dd></div>
        <div><dt>Output</dt><dd>{{ bytes(progress.size) }}</dd></div>
      </dl>
      <div class="row">
        <button class="btn" type="button" @click="cancel"><Icon name="close" /> Cancel <kbd>Esc</kbd></button>
      </div>
    </template>

    <template v-else-if="phase === 'done' && result && source">
      <dl class="cells mono stub">
        <div><dt>Before</dt><dd>{{ bytes(source.file.size) }}</dd></div>
        <div><dt>After</dt><dd>{{ bytes(result.blob.size) }}</dd></div>
        <div>
          <dt>{{ saved != null && saved >= 0 ? 'Smaller' : 'Larger' }}</dt>
          <dd>{{ saved != null ? `${Math.abs(saved)}%` : '—' }}</dd>
        </div>
        <div><dt>Took</dt><dd>{{ took(result.elapsed) }}</dd></div>
      </dl>
      <div class="row">
        <a class="btn btn-primary" :href="result.url" :download="result.fileName">
          <Icon name="download" />
          Download {{ result.container.toUpperCase() }}
        </a>
        <button class="btn" type="button" @click="backToSettings"><Icon name="back" /> Change settings</button>
      </div>
    </template>

    <template v-else>
      <p v-if="phase === 'failed'" class="error" role="alert">
        <Icon name="alert" />
        <span>{{ error }}</span>
      </p>
      <p v-else-if="!source" class="note">Add a video first. Everything here works offline once the page has loaded.</p>
      <ul v-else class="notes">
        <li v-if="estimate">Expected output <b class="mono">≈ {{ bytes(estimate) }}</b></li>
        <li v-if="longGif" class="warn">GIFs get big fast. Trim to under 15 seconds for a reasonable file.</li>
        <li v-if="largeFile" class="warn">This file is large. Your browser holds it all in memory, so it may be slow or run out.</li>
        <li v-if="!engine.multithreaded && engine.status === 'ready'" class="warn">Running on one thread because this page isn't cross-origin isolated. It will be slower.</li>
      </ul>
      <div class="row">
        <button class="btn btn-primary go" type="button" :disabled="!canConvert" @click="convert">
          <Icon name="film" />
          {{ phase === 'failed' ? 'Try again' : 'Convert' }}
          <kbd v-if="canConvert">{{ shortcut }}</kbd>
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.proc {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5) var(--space-5);
  background: var(--paper-2);
  overflow: hidden;
}

.ph {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 56px;
}

h2 .num {
  margin-left: var(--space-3);
}

h2 {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--rule);
}

.num {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--rule);
}

.bar {
  height: 18px;
  border: var(--rule-w) solid var(--rule);
  background: var(--paper);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: var(--rule);
  transform-origin: left;
  transition: transform 240ms linear;
}

.cells {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: var(--rule-w) solid var(--rule);
  background: var(--paper);
}

.cells.stub {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.cells div {
  padding: var(--space-2);
  border-left: 1px solid var(--rule);
  min-width: 0;
}

.cells div:first-child {
  border-left: 0;
}

dt {
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  font-weight: 600;
  font-stretch: 75%;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
}

dd {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  position: relative;
  z-index: 1;
}

.go {
  min-width: 200px;
  min-height: 52px;
  font-size: var(--text-lg);
}

kbd {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
  padding: 1px 6px;
  border: 1px solid currentColor;
  border-radius: var(--radius);
  opacity: 0.75;
}

.notes {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
  font-size: var(--text-sm);
}

.notes b {
  color: var(--rule);
}

.warn {
  padding-left: var(--space-3);
  border-left: 1px solid var(--danger);
}

.note {
  color: var(--ink-muted);
  font-size: var(--text-sm);
  max-width: 44ch;
}

.error {
  display: flex;
  gap: var(--space-2);
  color: var(--danger);
  font-weight: 600;
}

.error svg {
  width: 20px;
  height: 20px;
  flex: none;
}

.stamp {
  flex: none;
  margin: -4px -4px -8px 0;
}

@media (hover: none), (max-width: 760px) {
  kbd {
    display: none;
  }
}

@media (max-width: 520px) {
  .cells {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ph {
    flex-wrap: wrap;
  }
  .cells div:nth-child(4) {
    border-left: 0;
  }
  .cells div:nth-child(n + 4) {
    border-top: 1px solid var(--rule);
  }
  .cells.stub {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .cells.stub div:nth-child(3) {
    border-left: 0;
    border-top: 1px solid var(--rule);
  }
  .cells.stub div:nth-child(4) {
    border-left: 1px solid var(--rule);
  }
}
</style>
