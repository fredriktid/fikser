<script setup lang="ts">
const props = defineProps<{
  name: 'upload' | 'film' | 'download' | 'copy' | 'check' | 'close' | 'chevron' | 'sun' | 'moon' | 'play' | 'pause' | 'terminal' | 'back' | 'alert' | 'camera' | 'screen' | 'mic' | 'record' | 'stop'
}>()

const paths: Record<typeof props.name, string> = {
  upload: 'M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15',
  film: 'M4 5h16v14H4zM8 5v14M16 5v14M4 9h4M4 15h4M16 9h4M16 15h4',
  download: 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15',
  copy: 'M9 9h10v11H9zM15 9V4H5v11h4',
  check: 'M5 12.5 10 17.5 19 7',
  close: 'M6 6l12 12M18 6 6 18',
  chevron: 'M8 10l4 4 4-4',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4',
  moon: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
  play: 'M7 5v14l12-7z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  terminal: 'M4 5h16v14H4zM7.5 9.5 10 12l-2.5 2.5M12 15h4.5',
  back: 'M10 6 4 12l6 6M4 12h16',
  alert: 'M12 4 2.5 20h19zM12 10v4.5M12 17.2v.3',
  camera: 'M4 8h3.5l1.5-2.5h6L16.5 8H20v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  screen: 'M3 5h18v12H3zM9 20h6M12 17v3',
  mic: 'M12 3.5a3 3 0 0 1 3 3V12a3 3 0 0 1-6 0V6.5a3 3 0 0 1 3-3zM6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.5M8.5 20.5h7',
  record: 'M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z',
  stop: 'M6.5 6.5h11v11h-11z',
}
</script>

<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path :d="paths[props.name]" />
  </svg>
</template>
