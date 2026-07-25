import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { collectFontCorpus, formatCodePoint } from './font-corpus.mjs'

const manifestFile = new URL('./fonts/characters.json', import.meta.url)
const corpus = await collectFontCorpus()
const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))

const missingRegular = findMissing(corpus.regular, manifest.regular)
const missingMono = findMissing(corpus.mono, manifest.mono)

if (missingRegular.length > 0 || missingMono.length > 0) {
  throw new Error(
    [
      '站点包含字体子集尚未收录的字符，请运行 `pnpm fonts:subset` 后重新构建。',
      formatMissing('正文', missingRegular),
      formatMissing('等宽', missingMono),
    ].filter(Boolean).join('\n'),
  )
}

for (const font of manifest.fonts) {
  const file = new URL(`../src/assets/fonts/${font.file}`, import.meta.url)
  const hash = createHash('sha256').update(await readFile(file)).digest('hex')
  if (hash !== font.sha256) {
    throw new Error(
      `${font.file} 与字符清单不匹配，请运行 \`pnpm fonts:subset\` 后重新提交。`,
    )
  }
}

console.log(
  `✓ ${manifest.fonts.length} 个字体子集及字符清单一致：`
  + `正文 ${[...corpus.regular].length}，等宽 ${[...corpus.mono].length}`,
)

function findMissing(current, generated) {
  const generatedCharacters = new Set(generated)
  return [...current].filter(character => !generatedCharacters.has(character))
}

function formatMissing(label, characters) {
  if (characters.length === 0) {
    return ''
  }

  const preview = characters
    .slice(0, 24)
    .map(character => `${character} (${formatCodePoint(character)})`)
    .join('、')
  const remainder = characters.length > 24 ? `，另有 ${characters.length - 24} 个` : ''
  return `${label}缺少：${preview}${remainder}`
}
