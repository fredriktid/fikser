<script setup lang="ts">
import { useConverter } from '../composables/useConverter'
import { bytes, took } from '../lib/format'

const { history } = useConverter()

const label = { done: 'Done', void: 'Void', failed: 'Failed' } as const
</script>

<template>
  <section v-if="history.length" class="history" aria-labelledby="history-title">
    <h2 id="history-title" class="caps">Job log</h2>
    <table>
      <thead class="sr-only">
        <tr>
          <th scope="col">Job</th>
          <th scope="col">File</th>
          <th scope="col">Process</th>
          <th scope="col">Result</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="j in history" :key="j.number" :data-status="j.status">
          <td class="mono no">№ {{ String(j.number).padStart(4, '0') }}</td>
          <td class="file">{{ j.fileName }}</td>
          <td>{{ j.preset }}</td>
          <td class="mono">{{ j.outputSize ? `${bytes(j.inputSize)} → ${bytes(j.outputSize)}` : '—' }} · {{ took(j.elapsed) }}</td>
          <td><span class="mark caps">{{ label[j.status] }}</span></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.history {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

h2 {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--rule);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

td {
  padding: var(--space-2) var(--space-3) var(--space-2) 0;
  border-top: 1px dotted var(--rule-soft);
  vertical-align: middle;
}

.no {
  color: var(--rule);
  font-weight: 700;
  white-space: nowrap;
}

.file {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

td:last-child {
  padding-right: 0;
  text-align: right;
}

.mark {
  display: inline-block;
  padding: 0 var(--space-2);
  border: 2px solid var(--stamp);
  color: var(--stamp);
  font-weight: 800;
  font-size: var(--text-sm);
  transform: rotate(-3deg);
}

tr[data-status='void'] .mark,
tr[data-status='failed'] .mark {
  border-color: var(--danger);
  color: var(--danger);
}

tr[data-status='void'] td:not(:last-child),
tr[data-status='failed'] td:not(:last-child) {
  color: var(--ink-muted);
  text-decoration: line-through;
  text-decoration-color: var(--danger);
}

@media (max-width: 640px) {
  td:nth-child(3),
  td:nth-child(4) {
    display: none;
  }
}
</style>
