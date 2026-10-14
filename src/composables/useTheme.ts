import { computed, ref } from 'vue'

type Theme = 'light' | 'dark'

const KEY = 'fixer-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')
const stored = ref<Theme | null>(read())
const system = ref<Theme>(media.matches ? 'dark' : 'light')
media.addEventListener('change', (e) => (system.value = e.matches ? 'dark' : 'light'))

function read(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function apply(theme: Theme | null) {
  if (theme) document.documentElement.dataset.theme = theme
  else delete document.documentElement.dataset.theme
}

apply(stored.value)

export function useTheme() {
  const theme = computed(() => stored.value ?? system.value)

  function toggle() {
    const next: Theme = theme.value === 'dark' ? 'light' : 'dark'
    stored.value = next
    apply(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      /* private mode */
    }
  }

  return { theme, toggle }
}
