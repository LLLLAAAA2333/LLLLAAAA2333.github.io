import { Buffer } from 'node:buffer'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sources = JSON.parse(
  await readFile(new URL('./fonts/sources.json', import.meta.url), 'utf8'),
)
const destination = fileURLToPath(new URL('./fonts/source/', import.meta.url))
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lxgw-download-'))
const archive = join(temporaryDirectory, `lxgw-wenkai-v${sources.version}.zip`)

try {
  const response = await fetch(sources.archiveUrl)
  if (!response.ok) {
    throw new Error(`字体下载失败：HTTP ${response.status}`)
  }

  await writeFile(archive, Buffer.from(await response.arrayBuffer()))
  await mkdir(destination, { recursive: true })
  execFileSync(
    'unzip',
    [
      '-jo',
      archive,
      ...sources.fonts.map(font => `*${font.source}`),
      '-d',
      destination,
    ],
    { stdio: 'inherit' },
  )

  for (const font of sources.fonts) {
    const file = join(destination, font.source)
    const hash = createHash('sha256').update(await readFile(file)).digest('hex')
    if (hash !== font.sha256) {
      throw new Error(`${font.source} 下载后校验失败`)
    }
  }

  console.log(`✓ 已下载并校验 LXGW WenKai v${sources.version} 字体源`)
}
finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
}
