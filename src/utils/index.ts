import type { Post, PostSummary } from '~/types'
import { getCollection } from 'astro:content'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'
import { markdownItAudio } from './markdown-audio'

export async function getCategories() {
  const posts = await getPosts()
  const categories = new Map<string, Post[]>()

  for (const post of posts) {
    if (post.data.categories) {
      for (const c of post.data.categories) {
        const posts = categories.get(c) || []
        posts.push(post)
        categories.set(c, posts)
      }
    }
  }

  return categories
}

export async function getTags() {
  const posts = await getPosts()
  const tags = new Map<string, Post[]>()

  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      const taggedPosts = tags.get(tag) ?? []
      taggedPosts.push(post)
      tags.set(tag, taggedPosts)
    }
  }

  return tags
}

export async function getPosts(isArchivePage = false) {
  const posts = await getCollection('posts')

  posts.sort((a, b) => {
    if (isArchivePage) {
      return dayjs(a.data.pubDate).isBefore(dayjs(b.data.pubDate)) ? 1 : -1
    }

    const aDate = a.data.modDate ? dayjs(a.data.modDate) : dayjs(a.data.pubDate)
    const bDate = b.data.modDate ? dayjs(b.data.modDate) : dayjs(b.data.pubDate)

    return aDate.isBefore(bDate) ? 1 : -1
  })

  if (import.meta.env.PROD) {
    return posts.filter(post => post.data.draft !== true)
  }

  return posts
}

const parser = new MarkdownIt().use(markdownItAudio, { base: import.meta.env.BASE_URL })
const descriptionCache = new WeakMap<Post, string>()
const summaryMetadataCache = new WeakMap<Post, Omit<PostSummary, 'description'>>()

export function getPostDescription(post: Post) {
  const cached = descriptionCache.get(post)
  if (cached !== undefined) {
    return cached
  }

  if (post.data.description) {
    descriptionCache.set(post, post.data.description)
    return post.data.description
  }

  const html = parser.render(post.body || '', { filePath: post.filePath })
  const sanitized = sanitizeHtml(html, { allowedTags: [] })
  const description = sanitized.slice(0, 400)
  descriptionCache.set(post, description)
  return description
}

export function getPostSummary(post: Post, includeDescription = true): PostSummary {
  let metadata = summaryMetadataCache.get(post)
  if (!metadata) {
    metadata = {
      title: post.data.title,
      href: getPostCanonicalPath(post),
      pubDate: post.data.pubDate,
      modDate: post.data.modDate,
      categories: post.data.categories ?? [],
      tags: post.data.tags ?? [],
      pin: post.data.pin ?? false,
    }
    summaryMetadataCache.set(post, metadata)
  }

  return {
    ...metadata,
    description: includeDescription ? getPostDescription(post) : '',
  }
}

export function formatDate(date: Date, format: string = 'YYYY-MM-DD') {
  return dayjs(date).format(format)
}

export function getPathFromCategory(
  category: string,
  category_map: { name: string, path: string }[],
) {
  const mappingPath = category_map.find(l => l.name === category)
  return mappingPath ? mappingPath.path : category
}

export function getPostCanonicalPath(post: Post) {
  return `/posts/${post.data.slug ?? post.id}`
}
