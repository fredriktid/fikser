import { ref, shallowRef } from 'vue'

export function usePlayer() {
  const player = shallowRef<HTMLMediaElement | null>(null)
  const playhead = ref(0)

  function togglePlay() {
    const el = player.value
    if (!el) return
    if (el.paused) el.play()
    else el.pause()
  }

  function seek(time: number) {
    if (player.value) player.value.currentTime = time
    playhead.value = time
  }

  return { player, playhead, togglePlay, seek }
}
