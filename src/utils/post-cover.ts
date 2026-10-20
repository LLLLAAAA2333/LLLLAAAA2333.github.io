import type { ImageMetadata } from 'astro'
import type { Post } from '~/types'
import { dirname, relative, resolve, sep } from 'node:path'
import MarkdownIt from 'markdown-it'

const parser = new MarkdownIt()
const images = import.meta.glob<ImageMetadata>(
  '/src/content/posts/**/*.{avif,gif,jpeg,jpg,png,svg,webp}',
  { import: 'default' },
)

function imageSources(tokens: ReturnType<MarkdownIt['parse']>): string[] {
  return tokens.flatMap((token) => {
    const source = token.type === 'image' ? token.attrGet('src') : null
    return source ? [source] : token.children ? imageSources(token.children) : []
  })
}

export async function getPostCover(post: Post): Promise<ImageMetadata | string | undefined> {
  if (post.data.banner) {
    return post.data.banner
  }

  for (const source of imageSources(parser.parse(post.body ?? '', {}))) {
    if (!/\.(?:avif|gif|jpe?g|png|svg|webp)(?:[?#]|$)/i.test(source)) {
      continue
    }
    if (/^(?:https?:)?\//i.test(source)) {
      return source
    }
    if (!post.filePath) {
      continue
    }

    const pathname = source.split(/[?#]/, 1)[0]
    let decoded = pathname
    try {
      decoded = decodeURIComponent(pathname)
    }
    catch {
      // A literal percent sign can be part of an attachment filename.
    }
    const path = relative(resolve('.'), resolve(dirname(post.filePath), decoded)).split(sep).join('/')
    const loadImage = images[`/${path}`]
    if (loadImage) {
      return loadImage()
    }
  }
}
