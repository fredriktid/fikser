export const THREADS = 4
export const FRAME_COUNT = 8
export const LARGE_FILE = 500 * 1024 * 1024

export const CRASH_MESSAGE = 'ffmpeg ran out of memory or crashed on this file. Try a smaller size or another format.'
export const EXIT_MESSAGE = 'ffmpeg stopped with an error. The log has the details.'
export const UNREADABLE_MESSAGE = "ffmpeg couldn't read this file. It may not be a video."

export function timestamp(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`
}

export function remuxArgs(input: string, output: string): string[] {
  return ['-hide_banner', '-i', input, '-c', 'copy', '-y', output]
}

export function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
