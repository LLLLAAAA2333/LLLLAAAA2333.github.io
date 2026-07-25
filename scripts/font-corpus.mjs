import { readdir, readFile } from 'node:fs/promises'
import { extname } from 'node:path'
import MarkdownIt from 'markdown-it'

const textExtensions = new Set([
  '.astro',
  '.css',
  '.js',
  '.json',
  '.md',
  '.mdx',
  '.mjs',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
])

const baselineCharacters = `
ABCDEFGHIJKLMNOPQRSTUVWXYZ
abcdefghijklmnopqrstuvwxyz
0123456789
 !"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~
，。！？、；：“”‘’（）【】《》〈〉「」『』—…·
`
const markdownParser = new MarkdownIt()

export async function collectFontCorpus() {
  const sourceDirectory = new URL('../src/', import.meta.url)
  const files = await findTextFiles(sourceDirectory)
  const regularCharacters = new Set()
  const monoCharacters = new Set()

  addPrintableCharacters(regularCharacters, baselineCharacters)
  addPrintableCharacters(monoCharacters, baselineCharacters)

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    addPrintableCharacters(regularCharacters, content)

    if (['.md', '.mdx'].includes(extname(file.pathname))) {
      addPrintableCharacters(monoCharacters, extractCode(content))
    }
  }

  return {
    regular: sortCharacters(regularCharacters),
    mono: sortCharacters(monoCharacters),
    sourceFileCount: files.length,
  }
}

export function formatCodePoint(character) {
  return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`
}

function addPrintableCharacters(target, content) {
  for (const character of content) {
    const codePoint = character.codePointAt(0)
    if (codePoint >= 0x20 && codePoint !== 0x7F) {
      target.add(character)
    }
  }
}

function extractCode(source) {
  return collectCodeTokens(markdownParser.parse(source, {})).join('\n')
}

function collectCodeTokens(tokens) {
  const code = []

  for (const token of tokens) {
    if (['code_block', 'code_inline', 'fence'].includes(token.type)) {
      code.push(token.content)
    }
    if (token.children) {
      code.push(...collectCodeTokens(token.children))
    }
  }

  return code
}

async function findTextFiles(directory) {
  const files = []

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = new URL(entry.name, ensureTrailingSlash(directory))
    if (entry.isDirectory()) {
      files.push(...await findTextFiles(path))
    }
    else if (textExtensions.has(extname(entry.name))) {
      files.push(path)
    }
  }

  return files
}

function sortCharacters(characters) {
  return [...characters]
    .sort((left, right) => left.codePointAt(0) - right.codePointAt(0))
    .join('')
}

function ensureTrailingSlash(url) {
  return new URL(url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`, url)
}
