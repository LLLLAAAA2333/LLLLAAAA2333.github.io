import type { CollectionEntry } from 'astro:content'

export type Post = CollectionEntry<'posts'>

export interface PostSummary {
  title: string
  href: string
  pubDate: Date
  modDate?: Date
  description: string
  categories: string[]
  tags: string[]
  pin: boolean
}

export * from './themeConfig.ts'
