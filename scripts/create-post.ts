// scripts/create-post.ts
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import consola from 'consola'
import dayjs from 'dayjs'

createPost()

/**
 * Create a new post inside a date-named folder.
 */
async function createPost(): Promise<void> {
  consola.start('Ready to create a new post!')

  const title: string = await consola.prompt('Enter post title: ', { type: 'text' })
  const extension: string = await consola.prompt('Select file extension: ', { type: 'select', options: ['.md', '.mdx'] })
  const isDraft: boolean = await consola.prompt('Is this a draft?', { type: 'confirm', initial: true })

  // 1. 使用当前日期作为文件夹名
  const today = dayjs().format('YYYY-MM-DD');
  const slug = title.toLowerCase().replace(/\s+/g, '-'); // slug 仍然基于标题
  const folderName = `${today}-${slug}`; // 文件夹名格式：YYYY-MM-DD-my-post-title
  const targetDir = path.join('./src/content/posts/', folderName);

  // 2. 确保文件夹存在
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 3. 文件路径指向新文件夹内的 index.mdx?
  const fullPath: string = path.join(targetDir, `index${extension}`)

  const frontmatter = getFrontmatter({
    title: `"${title}"`, // 标题使用引号包裹，以防有特殊字符
    pubDate: today,
    categories: '[]',
    tags: '[]', // 默认添加空的 tags 字段
    description: '\'\'',
    draft: isDraft ? 'true' : 'false',
  })

  try {
    fs.writeFileSync(fullPath, frontmatter)
    consola.success(`New post created successfully at: ${fullPath}`)

    const open: boolean = await consola.prompt('Open the new post?', { type: 'confirm', initial: true })
    if (open) {
      consola.info(`Opening ${fullPath}...`)
      execSync(`code "${fullPath}"`)
    }
  }
  catch (error) {
    consola.error((error as Error).message || 'Failed to create new post!')
  }
}

/**
 * Create frontmatter from a data object.
 * @param data The data object to convert to frontmatter.
 * @returns The frontmatter as a string.
 */
function getFrontmatter(data: { [key: string]: string }): string {
  const frontmatter = Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  return `---\n${frontmatter}\n---`
}