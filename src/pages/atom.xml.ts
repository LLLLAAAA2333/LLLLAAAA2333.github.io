import type { APIContext } from 'astro'
import type { Post } from '~/types'
import rss from '@astrojs/rss'
import { getImage } from 'astro:assets'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { themeConfig } from '~/.config'
import { getPosts } from '~/utils'

const parser = new MarkdownIt()
const { title, description, website, author } = themeConfig.site
const allowedTags = sanitizeHtml.defaults.allowedTags.concat(['img'])

// 扫描所有帖子文件夹下的图片
const images = import.meta.glob<{ default: ImageMetadata }>('/src/content/posts/**/*.{jpeg,jpg,png,gif,webp,svg}', { eager: true })

export async function GET(_context: APIContext) {
  const posts = await getPosts()
  const items = await Promise.all(posts.map(getPostItem))

  return rss({
    title,
    description,
    site: website,
    items,
    customData: getCustomData(),
  })
}

function getCustomData() {
  const follow = themeConfig.rss.follow
  if (!follow)
    return ''
  const { feedId, userId } = follow
  return `<follow_challenge><feedId>${feedId}</feedId><userId>${userId}</userId></follow_challenge>`
}

async function getPostItem(post: Post) {
  const postItem = {
    link: `/posts/${post.id}/`,
    author: post.data.author ?? author,
    content: await getPostContent(post),
    title: post.data.title,
    pubDate: post.data.pubDate,
    description: post.data.description,
    customData: post.data.customData,
    categories: post.data.categories,
    commentsUrl: post.data.commentsUrl,
    source: post.data.source,
    enclosure: post.data.enclosure,
  }

  return postItem
}

async function getPostContent(post: Post) {
  const isFullText = themeConfig.rss.fullText
  if (!isFullText)
    return post.data.description

  let html = parser.render(post.body || '')

  // 匹配图片标签并转换 URL
  // 支持 src="./image.png"
  const imgRegex = /<img\s[^>]*src="(\.\/[^"]+)"[^>]*>/g
  const matches = [...html.matchAll(imgRegex)]

  for (const match of matches) {
    const originalSrc = match[1] // 例如 "./image.png"
    const fileName = originalSrc.replace('./', '')

    // 构建在项目中的完整路径以匹配 glob
    const imagePath = `/src/content/posts/${post.id}/${fileName}`

    if (images[imagePath]) {
      const optimizedImage = await getImage({
        src: images[imagePath].default,
        format: 'webp',
      })

      // 转换为绝对 URL
      const absoluteUrl = new URL(optimizedImage.src, website).toString()
      html = html.replace(originalSrc, absoluteUrl)
    }
    else {
      // 尝试模糊匹配 (不区分大小写的文件夹)
      const foundPath = Object.keys(images).find(p => p.toLowerCase() === imagePath.toLowerCase())
      if (foundPath) {
        const optimizedImage = await getImage({
          src: images[foundPath].default,
          format: 'webp',
        })
        const absoluteUrl = new URL(optimizedImage.src, website).toString()
        html = html.replace(originalSrc, absoluteUrl)
      }
    }
  }

  return sanitizeHtml(html, { allowedTags })
}
