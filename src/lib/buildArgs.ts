import { CONTAINERS, type Settings, type Trim } from './settings'

export interface Job {
  input: string
  output: string
  args: string[]
}

export function buildJob(settings: Settings, inputName: string, trim: Trim | null, sourceDuration: number, threads = 1): Job {
  const s = settings
  const info = CONTAINERS[s.container]
  const output = `output.${s.container}`
  const args: string[] = []

  const trimmed = trim && (trim.start > 0.01 || trim.end < sourceDuration - 0.01)
  if (threads > 1) args.push('-threads', String(threads))
  if (trimmed) args.push('-ss', fixed(trim.start))
  args.push('-i', inputName)
  if (trimmed) args.push('-t', fixed(trim.end - trim.start))
  if (threads > 1) args.push('-threads', String(threads))

  if (s.container === 'gif') {
    const fps = s.fps ?? 12
    args.push(
      '-vf',
      `fps=${fps},scale=${s.gifWidth}:-2:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
      '-loop',
      '0',
    )
  } else if (s.container === 'mp3') {
    args.push('-vn', '-c:a', 'libmp3lame', '-b:a', `${s.audioBitrate}k`)
  } else {
    const filters: string[] = []
    if (s.maxHeight) filters.push(`scale=-2:'min(${s.maxHeight},ih)'`)
    if (s.fps) filters.push(`fps=${s.fps}`)
    if (filters.length) args.push('-vf', filters.join(','))

    args.push('-c:v', s.videoCodec)
    if (s.videoCodec === 'libx264') {
      args.push('-preset', 'veryfast', '-pix_fmt', 'yuv420p')
      if (s.qualityMode === 'crf') args.push('-crf', String(s.crf))
      else args.push('-b:v', `${s.videoBitrate}k`, '-maxrate', `${s.videoBitrate * 1.5}k`, '-bufsize', `${s.videoBitrate * 2}k`)
    } else {
      args.push('-deadline', 'realtime', '-cpu-used', '8')
      if (s.qualityMode === 'crf') args.push('-crf', String(s.crf), '-b:v', '10M')
      else args.push('-b:v', `${s.videoBitrate}k`)
    }

    if (s.audio && info.audioCodec) args.push('-c:a', info.audioCodec, '-b:a', `${s.audioBitrate}k`)
    else args.push('-an')

    if (s.container === 'mp4' || s.container === 'mov') args.push('-movflags', '+faststart')
  }

  args.push('-y', output)
  return { input: inputName, output, args }
}

export function toCommand(args: string[]): string {
  return ['ffmpeg', ...args].map(shellQuote).join(' ')
}

function shellQuote(a: string): string {
  return /^[\w@%+=:,./-]+$/.test(a) ? a : `"${a.replace(/(["\\$`])/g, '\\$1')}"`
}

function fixed(n: number): string {
  return n.toFixed(3).replace(/\.?0+$/, '') || '0'
}
