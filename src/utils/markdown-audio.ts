import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import MarkdownIt from 'markdown-it'

export interface AudioOptions {
  contentDirectory?: string
  base?: string
}

interface AudioEmbed {
  start: number
  end: number
  label: string
  source: string
}

interface MarkdownNode {
  type: string
  value?: string
  url?: string
  alt?: string | null
  children?: MarkdownNode[]
  data?: Record<string, unknown>
  position?: { start: { offset?: number }, end: { offset?: number } }
}

const markdownUtilities = new MarkdownIt().utils
const audioExtension = /\.(?:mp3|m4a|ogg|oga|wav|flac|aac|opus)(?:[?#].*)?$/i

export function isAudioSource(source: string) {
  return audioExtension.test(source)
    && (!/^[a-z][\w+.-]*:/i.test(source) || /^https?:\/\//i.test(source))
}

export function audioUrlPrefix(base = '/') {
  return `${base.replace(/\/$/, '')}/audio/`
}

export function resolveAudioSource(source: string, filePath: string | undefined, options: AudioOptions = {}) {
  if (/^(?:https?:)?\//i.test(source))
    return source

  if (!filePath)
    throw new Error('Relative audio embeds require a Markdown file path')

  const suffixStart = source.search(/[?#]/)
  const pathname = suffixStart === -1 ? source : source.slice(0, suffixStart)
  const suffix = suffixStart === -1 ? '' : source.slice(suffixStart)
  const contentDirectory = options.contentDirectory ?? resolve('src/content')
  let decodedPath = pathname
  try {
    decodedPath = decodeURIComponent(pathname)
  }
  catch {
    // A raw filename may contain a literal percent sign.
  }
  const audioPath = resolve(dirname(resolve(filePath)), decodedPath)
  const contentPath = relative(contentDirectory, audioPath)
  if (contentPath === '..' || contentPath.startsWith(`..${sep}`) || isAbsolute(contentPath))
    throw new Error(`Audio attachment is outside the content directory: ${source}`)

  const encodedPath = contentPath.split(sep).map(segment => encodeURIComponent(segment)).join('/')
  return `${audioUrlPrefix(options.base)}${encodedPath}${suffix}`
}

function parseAudioEmbed(text: string, start: number): AudioEmbed | undefined {
  let precedingSlashes = 0
  for (let index = start - 1; index >= 0 && text[index] === '\\'; index--)
    precedingSlashes++
  if (precedingSlashes % 2)
    return

  const label = text.slice(start).match(/^!\[((?:\\.|[^\]\\\r\n])*)\]\(/)
  if (!label)
    return

  const destinationStart = start + label[0].length
  let depth = 1
  let end = destinationStart
  for (; end < text.length; end++) {
    const character = text[end]
    if (character === '\r' || character === '\n')
      return
    if (character === '\\') {
      end++
      continue
    }
    if (character === '(')
      depth++
    if (character === ')' && --depth === 0)
      break
  }
  if (depth !== 0)
    return

  let destination = text.slice(destinationStart, end).trim()
  const quote = destination.at(-1)
  if (quote === '"' || quote === '\'') {
    for (let index = destination.length - 2; index > 0; index--) {
      if (destination[index] !== quote)
        continue
      let slashes = 0
      for (let preceding = index - 1; preceding >= 0 && destination[preceding] === '\\'; preceding--)
        slashes++
      if (slashes % 2)
        continue
      if (/\s/.test(destination[index - 1]))
        destination = destination.slice(0, index).trimEnd()
      break
    }
  }
  const source = destination.startsWith('<') && destination.endsWith('>')
    ? destination.slice(1, -1)
    : destination
  if (!isAudioSource(source))
    return

  return { start, end: end + 1, label: markdownUtilities.unescapeAll(label[1]), source: markdownUtilities.unescapeAll(source) }
}

function audioNode(label: string, source: string): MarkdownNode {
  return {
    type: 'audio',
    data: {
      hName: 'audio',
      hProperties: { src: source, controls: true, preload: 'metadata', ariaLabel: label || '录音' },
    },
    children: [{ type: 'link', url: source, children: [{ type: 'text', value: '下载录音' }] }],
  }
}

export function remarkAudio(options: AudioOptions = {}) {
  return (tree: MarkdownNode, file: { path?: string, value: unknown }) => {
    const source = String(file.value)
    const convert = (embed: Pick<AudioEmbed, 'label' | 'source'>) =>
      audioNode(embed.label, resolveAudioSource(embed.source, file.path, options))

    function transform(node: MarkdownNode): MarkdownNode[] {
      if (node.type === 'image' && node.url && isAudioSource(node.url))
        return [convert({ label: node.alt ?? '', source: node.url })]

      if (node.type === 'text' && node.value) {
        const start = node.position?.start.offset
        const end = node.position?.end.offset
        const text = start !== undefined && end !== undefined ? source.slice(start, end) : node.value
        const replacements: MarkdownNode[] = []
        let cursor = 0
        let search = 0
        while (search < text.length) {
          const next = text.indexOf('![', search)
          if (next === -1)
            break
          search = next
          const embed = parseAudioEmbed(text, search)
          if (!embed) {
            search += 2
            continue
          }
          if (embed.start > cursor)
            replacements.push({ type: 'text', value: markdownUtilities.unescapeAll(text.slice(cursor, embed.start)) })
          replacements.push(convert(embed))
          cursor = search = embed.end
        }
        if (replacements.length > 0) {
          if (cursor < text.length)
            replacements.push({ type: 'text', value: markdownUtilities.unescapeAll(text.slice(cursor)) })
          return replacements
        }
      }

      if (node.children)
        node.children = node.children.flatMap(transform)
      return [node]
    }

    transform(tree)
  }
}

export function markdownItAudio(parser: MarkdownIt, options: AudioOptions = {}) {
  parser.inline.ruler.before('image', 'audio_embed', (state, silent) => {
    const embed = parseAudioEmbed(state.src, state.pos)
    if (!embed)
      return false
    if (!silent) {
      const token = state.push('audio_embed', '', 0)
      token.meta = embed
    }
    state.pos = embed.end
    return true
  })

  parser.renderer.rules.audio_embed = (tokens, index, _options, env) => {
    const embed = tokens[index].meta as AudioEmbed
    const source = parser.utils.escapeHtml(resolveAudioSource(embed.source, env.filePath, options))
    const label = parser.utils.escapeHtml(embed.label || '录音')
    return `<audio controls preload="metadata" aria-label="${label}" src="${source}"><a href="${source}">下载录音</a></audio>`
  }
}
