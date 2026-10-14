<script setup lang="ts">
import { computed } from 'vue'
import { useConverter } from '../composables/useConverter'
import { CODEC_LABELS, CONTAINERS, CRF_RANGE, type Container, type VideoCodec } from '../lib/settings'
import Icon from './ui/Icon.vue'

const { settings, update, source, phase } = useConverter()

const info = computed(() => CONTAINERS[settings.value.container])
const isGif = computed(() => settings.value.container === 'gif')
const isAudio = computed(() => settings.value.container === 'mp3')
const hasVideoOptions = computed(() => info.value.codecs.length > 0)
const crfRange = computed(() => CRF_RANGE[settings.value.videoCodec])
const sourceHeight = computed(() => source.value?.probe.height ?? null)

const heights = [2160, 1440, 1080, 720, 480, 360]
const fpsOptions = computed(() => (isGif.value ? [8, 10, 12, 15, 20, 24] : [60, 30, 25, 24, 15]))

function num(e: Event) {
  return Number((e.target as HTMLInputElement | HTMLSelectElement).value)
}

function nullable(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  return v === '' ? null : Number(v)
}
</script>

<template>
  <details class="adv">
    <summary>
      <span>Advanced: format, quality, size, frame rate</span>
      <Icon name="chevron" />
    </summary>

    <fieldset class="grid" :disabled="phase === 'converting'">
      <legend class="sr-only">Advanced options</legend>

      <label class="field">
        <span>Format</span>
        <select :value="settings.container" @change="update({ container: ($event.target as HTMLSelectElement).value as Container })">
          <option v-for="(c, key) in CONTAINERS" :key="key" :value="key">{{ c.label }}</option>
        </select>
      </label>

      <label v-if="hasVideoOptions" class="field">
        <span>Video codec</span>
        <select :value="settings.videoCodec" @change="update({ videoCodec: ($event.target as HTMLSelectElement).value as VideoCodec, crf: CRF_RANGE[($event.target as HTMLSelectElement).value as VideoCodec][2] })">
          <option v-for="c in info.codecs" :key="c" :value="c">{{ CODEC_LABELS[c] }}</option>
        </select>
      </label>

      <div v-if="hasVideoOptions" class="field wide">
        <span id="qmode">Quality by</span>
        <div class="seg" role="radiogroup" aria-labelledby="qmode">
          <label :class="{ on: settings.qualityMode === 'crf' }">
            <input type="radio" name="qmode" :checked="settings.qualityMode === 'crf'" @change="update({ qualityMode: 'crf' })" />
            Constant quality
          </label>
          <label :class="{ on: settings.qualityMode === 'bitrate' }">
            <input type="radio" name="qmode" :checked="settings.qualityMode === 'bitrate'" @change="update({ qualityMode: 'bitrate' })" />
            Target bitrate
          </label>
        </div>
      </div>

      <label v-if="hasVideoOptions && settings.qualityMode === 'crf'" class="field wide">
        <span>
          Quality <b class="mono">CRF {{ settings.crf }}</b>
        </span>
        <input
          type="range"
          :min="crfRange[0]"
          :max="crfRange[1]"
          step="1"
          :value="crfRange[0] + crfRange[1] - settings.crf"
          :aria-valuetext="`CRF ${settings.crf}`"
          @input="update({ crf: crfRange[0] + crfRange[1] - num($event) })"
        />
        <span class="scale"><small>Smaller file</small><small>Better picture</small></span>
      </label>

      <label v-if="hasVideoOptions && settings.qualityMode === 'bitrate'" class="field wide">
        <span>Video bitrate</span>
        <span class="unit">
          <input type="number" min="100" max="50000" step="100" :value="settings.videoBitrate" @change="update({ videoBitrate: Math.max(100, num($event)) })" />
          <span class="mono">kbit/s</span>
        </span>
      </label>

      <label v-if="!isAudio && !isGif" class="field">
        <span>Max height</span>
        <select :value="settings.maxHeight ?? ''" @change="update({ maxHeight: nullable($event) })">
          <option value="">Original{{ sourceHeight ? ` (${sourceHeight}p)` : '' }}</option>
          <option v-for="h in heights" :key="h" :value="h" :disabled="!!sourceHeight && h >= sourceHeight">{{ h }}p</option>
        </select>
      </label>

      <label v-if="isGif" class="field">
        <span>Width</span>
        <select :value="settings.gifWidth" @change="update({ gifWidth: num($event) })">
          <option v-for="w in [240, 320, 480, 640, 800]" :key="w" :value="w">{{ w }} px</option>
        </select>
      </label>

      <label v-if="!isAudio" class="field">
        <span>Frame rate</span>
        <select :value="settings.fps ?? ''" @change="update({ fps: nullable($event) })">
          <option v-if="!isGif" value="">Original</option>
          <option v-for="f in fpsOptions" :key="f" :value="f">{{ f }} fps</option>
        </select>
      </label>

      <label v-if="info.audioCodec && !isAudio" class="field check">
        <input type="checkbox" :checked="settings.audio" @change="update({ audio: ($event.target as HTMLInputElement).checked })" />
        <span>Keep sound</span>
      </label>

      <label v-if="info.audioCodec && settings.audio" class="field">
        <span>Audio bitrate</span>
        <select :value="settings.audioBitrate" @change="update({ audioBitrate: num($event) })">
          <option v-for="b in [64, 96, 128, 160, 192, 256, 320]" :key="b" :value="b">{{ b }} kbit/s</option>
        </select>
      </label>
    </fieldset>
  </details>
</template>

<style scoped>
.adv {
  border: 1px solid var(--rule);
  border-radius: var(--radius);
}

summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 44px;
  padding: 0 var(--space-3);
  cursor: pointer;
  list-style: none;
}

summary::-webkit-details-marker {
  display: none;
}

summary svg {
  width: 18px;
  height: 18px;
  color: var(--rule);
  transition: transform var(--dur) var(--ease);
}

.adv[open] summary svg {
  transform: rotate(180deg);
}

.adv[open] summary {
  border-bottom: 1px dotted var(--rule-soft);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4) var(--space-4);
  padding: var(--space-4) var(--space-3);
  border: 0;
  min-width: 0;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  font-size: var(--text-sm);
}

.field > span:first-child {
  font-weight: 650;
}

.field.wide {
  grid-column: 1 / -1;
}

.field b {
  margin-left: var(--space-2);
  color: var(--rule);
  font-weight: 700;
}

select,
input[type='number'] {
  min-height: 40px;
  width: 100%;
  padding: 0 var(--space-3);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  background: var(--code-bg);
  color: var(--ink);
}

.unit {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.unit input {
  max-width: 140px;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--rule);
  min-height: 28px;
}

.scale {
  display: flex;
  justify-content: space-between;
  color: var(--ink-muted);
}

.seg {
  display: inline-flex;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  align-self: flex-start;
}

.seg label {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 0 var(--space-3);
  cursor: pointer;
}

.seg label + label {
  border-left: 1px solid var(--rule);
}

.seg label.on {
  background: var(--rule);
  color: var(--paper);
  font-weight: 650;
}

.seg input {
  position: absolute;
  opacity: 0;
}

.seg label:has(input:focus-visible) {
  outline: 2px solid var(--focus);
  outline-offset: 2px;
}

.check {
  flex-direction: row;
  align-items: center;
  gap: var(--space-2);
  align-self: end;
  min-height: 40px;
}

.check input {
  width: 18px;
  height: 18px;
  accent-color: var(--rule);
}

.check span {
  font-weight: 650;
}

@media (max-width: 420px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
