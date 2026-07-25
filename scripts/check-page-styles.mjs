import { readdir, readFile } from 'node:fs/promises'
import { relative } from 'node:path'

const distDirectory = new URL('../dist/', import.meta.url)
const homeHtml = await readFile(new URL('index.html', distDirectory), 'utf8')
const homeStyles = getLocalStyles(homeHtml)
const homeCss = await readLocalStyles(homeStyles)
const postFiles = await findHtmlFiles(new URL('posts/', distDirectory))
const articleFontStyles = new Map()
const requiredCssFragments = [
  '.code-container',
  '.clipboard-copy',
  'lxgw-wenkai-mono-site-regular',
]

for (const fragment of requiredCssFragments) {
  if (!homeCss.includes(fragment)) {
    throw new Error(`全局构建 CSS 缺少关键样式：${fragment}`)
  }
}

for (const file of postFiles) {
  const html = await readFile(file, 'utf8')
  const additionalStyles = [...getLocalStyles(html)].filter(href => !homeStyles.has(href))
  const fontStyles = []

  for (const href of additionalStyles) {
    const css = await readLocalStyles([href])
    if (css.includes('lxgw-wenkai-mono-site')) {
      fontStyles.push(href)
    }
  }

  if (fontStyles.length > 0) {
    articleFontStyles.set(relative(distDirectory.pathname, file.pathname), fontStyles)
  }
}

if (articleFontStyles.size > 0) {
  const details = [...articleFontStyles]
    .slice(0, 5)
    .map(([file, styles]) => `- ${file}: ${styles.join(', ')}`)
    .join('\n')

  throw new Error(
    `文章页临时加载了等宽字体样式表，这会让 Swup 等待额外 CSS：\n${details}`,
  )
}

console.log(`✓ ${postFiles.length} 个文章页没有临时加载等宽字体 CSS`)

function getLocalStyles(html) {
  const styles = new Set()
  const linkPattern = /<link\s[^>]*rel=(?:"stylesheet"|'stylesheet')[^>]*>/gi

  for (const [link] of html.matchAll(linkPattern)) {
    const href = link.match(/href=(?:"([^"]+)"|'([^']+)')/i)?.slice(1).find(Boolean)
    if (href?.startsWith('/')) {
      styles.add(href)
    }
  }

  return styles
}

async function readLocalStyles(styles) {
  const contents = []

  for (const href of styles) {
    const file = new URL(href.replace(/^\//, ''), distDirectory)
    contents.push(await readFile(file, 'utf8'))
  }

  return contents.join('\n')
}

async function findHtmlFiles(directory) {
  const files = []

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name, ensureTrailingSlash(directory))
    if (entry.isDirectory()) {
      files.push(...await findHtmlFiles(path))
    }
    else if (entry.name === 'index.html') {
      files.push(path)
    }
  }

  return files
}

function ensureTrailingSlash(url) {
  return new URL(url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`, url)
}
