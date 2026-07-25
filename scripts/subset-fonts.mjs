import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { access, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { collectFontCorpus } from './font-corpus.mjs'

const sources = JSON.parse(
  await readFile(new URL('./fonts/sources.json', import.meta.url), 'utf8'),
)
const downloadedFontDirectory = fileURLToPath(
  new URL('./fonts/source/', import.meta.url),
)
const fontDirectory = process.env.LXGW_WENKAI_FONT_DIR
  ?? (
    await containsFontSources(downloadedFontDirectory)
      ? downloadedFontDirectory
      : join(homedir(), 'Library', 'Fonts')
  )
const python = process.env.PYTHON ?? 'python3'
const outputDirectory = new URL('../src/assets/fonts/', import.meta.url)
const outputDirectoryPath = fileURLToPath(outputDirectory)
const manifestFile = new URL('./fonts/characters.json', import.meta.url)
const temporaryDirectory = await mkdtemp(join(tmpdir(), 'lxgw-subset-'))
const corpus = await collectFontCorpus()
const toolchain = getToolchain()

if (
  toolchain.fontTools !== sources.toolchain.fontTools
  || toolchain.brotli !== sources.toolchain.brotli
) {
  throw new Error(
    `字体工具版本不一致：需要 FontTools ${sources.toolchain.fontTools}`
    + ` / Brotli ${sources.toolchain.brotli}，当前为`
    + ` ${toolchain.fontTools} / ${toolchain.brotli}。`,
  )
}

await mkdir(outputDirectory, { recursive: true })
const stagedDirectory = await mkdtemp(join(outputDirectoryPath, '.subset-'))
try {
  await mkdir(new URL('./fonts/', import.meta.url), { recursive: true })
  const generatedFonts = []

  for (const font of sources.fonts) {
    const source = join(fontDirectory, font.source)
    await access(source).catch(() => {
      throw new Error(
        `找不到 ${source}。请安装霞鹜文楷，或通过 LXGW_WENKAI_FONT_DIR 指定字体目录。`,
      )
    })
    const sourceHash = await hashFile(source)
    if (sourceHash !== font.sha256) {
      throw new Error(
        `${font.source} 的 SHA-256 与锁定版本不一致。`
        + '如需升级字体，请同步更新 scripts/fonts/sources.json 并检查视觉变化。',
      )
    }

    const textFile = join(temporaryDirectory, `${font.output}.txt`)
    await writeFile(textFile, corpus[font.corpus])
    const stagedOutput = join(stagedDirectory, font.output)

    try {
      execFileSync(
        python,
        [
          '-m',
          'fontTools.subset',
          source,
          `--output-file=${stagedOutput}`,
          `--text-file=${textFile}`,
          '--flavor=woff2',
          '--layout-features=*',
          '--glyph-names',
          '--symbol-cmap',
          '--legacy-cmap',
          '--notdef-glyph',
          '--notdef-outline',
          '--recommended-glyphs',
          '--name-IDs=*',
          '--name-legacy',
          '--name-languages=*',
        ],
        { stdio: 'inherit' },
      )
    }
    catch (error) {
      throw new Error(
        '字体子集生成失败。请安装 scripts/fonts/README.md 中锁定的工具版本。',
        { cause: error },
      )
    }

    generatedFonts.push({
      file: font.output,
      corpus: font.corpus,
      sha256: await hashFile(stagedOutput),
    })
  }

  for (const font of generatedFonts) {
    await rename(
      join(stagedDirectory, font.file),
      join(outputDirectoryPath, font.file),
    )
  }

  await writeFile(
    manifestFile,
    `${JSON.stringify({
      sourceFileCount: corpus.sourceFileCount,
      toolchain,
      sources: sources.fonts.map(font => ({
        file: font.source,
        sha256: font.sha256,
      })),
      fonts: generatedFonts,
      regular: corpus.regular,
      mono: corpus.mono,
    }, null, 2)}\n`,
  )

  console.log(
    `✓ 已从 ${corpus.sourceFileCount} 个源文件生成霞鹜文楷子集：`
    + `正文 ${[...corpus.regular].length} 字符，等宽 ${[...corpus.mono].length} 字符`,
  )
}
finally {
  await rm(temporaryDirectory, { recursive: true, force: true })
  await rm(stagedDirectory, { recursive: true, force: true })
}

function getToolchain() {
  let versions
  try {
    versions = execFileSync(
      python,
      [
        '-c',
        'import fontTools, brotli; print(fontTools.__version__); print(brotli.__version__)',
      ],
      { encoding: 'utf8' },
    ).trim().split('\n')
  }
  catch (error) {
    throw new Error(
      '无法读取 FontTools/Brotli 版本，请按 scripts/fonts/README.md 安装。',
      { cause: error },
    )
  }

  return {
    fontTools: versions[0],
    brotli: versions[1],
  }
}

async function hashFile(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex')
}

async function containsFontSources(directory) {
  return Promise.all(
    sources.fonts.map(font => access(join(directory, font.source)).then(
      () => true,
      () => false,
    )),
  ).then(results => results.every(Boolean))
}
