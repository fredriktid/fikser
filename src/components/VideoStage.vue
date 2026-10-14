<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useConverter } from '../composables/useConverter'
import { bytes, clock } from '../lib/format'
import Icon from './ui/Icon.vue'

const { source, frames, playhead, player, setPlayable, reset, phase } = useConverter()
const video = ref<HTMLMediaElement | null>(null)

watch(video, (el) => (player.value = el), { immediate: true })
onBeforeUnmount(() => (player.value = null))

function onTime(e: Event) {
  playhead.value = (e.target as HTMLMediaElement).currentTime
}

const probe = computed(() => source.value?.probe)
const poster = computed(() => frames.value.find(Boolean) ?? undefined)
const audioOnly = computed(() => !!probe.value && !probe.value.videoCodec && !!probe.value.audioCodec)

const timecode = computed(() => {
  const fps = Math.round(probe.value?.fps ?? 30)
  const t = playhead.value
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = Math.floor(t % 60)
  const f = Math.floor((t % 1) * fps)
  return [h, m, s, f].map((n) => String(n).padStart(2, '0')).join(':')
})

const chips = computed(() => {
  const p = probe.value
  const src = source.value
  if (!p || !src) return []
  return [
    p.duration != null ? clock(p.duration, true) : null,
    bytes(src.file.size),
    p.width && p.height ? `${p.width}×${p.height}` : null,
    p.fps ? `${Math.round(p.fps * 100) / 100} fps` : null,
    p.videoCodec?.toUpperCase().replace('H264', 'H.264').replace('HEVC', 'H.265'),
    p.audioCodec?.toUpperCase(),
  ].filter(Boolean) as string[]
})
</script>

<template>
  <section v-if="source" class="stage" aria-label="Source video">
    <div class="player" :class="{ audio: audioOnly }">
      <video
        v-if="source.playable && !audioOnly"
        ref="video"
        :src="source.url"
        controls
        playsinline
        preload="auto"
        @timeupdate="onTime"
        @seeked="onTime"
        @error="setPlayable(false)"
      />
      <template v-else-if="audioOnly">
        <Icon name="film" class="placeholder-icon" />
        <audio ref="video" :src="source.url" controls @timeupdate="onTime" />
      </template>
      <div v-else class="unplayable">
        <img v-if="poster" :src="poster" alt="" />
        <p>Your browser can't play this format, but ffmpeg can still convert it.</p>
      </div>
      <span v-if="!audioOnly" class="tc mono" aria-hidden="true">{{ timecode }}</span>
    </div>

    <div class="meta">
      <ul class="chips mono" aria-label="File details">
        <li class="name" :title="source.file.name">{{ source.file.name }}</li>
        <li v-for="c in chips" :key="c">{{ c }}</li>
        <li v-if="phase === 'probing'" class="probing">Reading file…</li>
      </ul>
      <button class="btn btn-quiet" type="button" :disabled="phase === 'converting'" @click="reset">
        <Icon name="close" />
        New file
      </button>
    </div>
  </section>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.player {
  position: relative;
  aspect-ratio: 16 / 9;
  background: var(--player);
  color: var(--on-player);
  border-radius: var(--radius);
  overflow: hidden;
  display: grid;
  place-items: center;
}

.player video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player.audio {
  aspect-ratio: 16 / 6;
  gap: var(--space-4);
  align-content: center;
}

.player.audio audio {
  width: min(480px, 85%);
}

.placeholder-icon {
  width: 48px;
  height: 48px;
  opacity: 0.6;
}

.tc {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  padding: 3px var(--space-2);
  background: rgb(0 0 0 / 0.6);
  color: #f2f1ec;
  font-size: var(--text-meta);
  letter-spacing: var(--track-caps);
  pointer-events: none;
}

.unplayable {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.unplayable img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0.45;
}

.unplayable p {
  position: relative;
  max-width: 36ch;
  padding: var(--space-3) var(--space-4);
  background: rgb(0 0 0 / 0.7);
  text-align: center;
  font-size: var(--text-body);
}

.meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  padding: 0;
  list-style: none;
  min-width: 0;
}

.chips li {
  padding: 4px 10px;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  color: var(--rule);
  font-size: var(--text-micro);
  font-weight: var(--weight-body);
  white-space: nowrap;
}

.chips .name {
  background: var(--rule);
  color: var(--paper);
  max-width: 28ch;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chips .probing {
  border-style: dashed;
}

.meta .btn {
  min-height: 32px;
  flex: none;
  font-size: var(--text-meta);
}
</style>
