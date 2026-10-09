import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// eslint-disable-next-line test/no-import-node-test -- Use the built-in runner without adding a test framework.
import test from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import MarkdownIt from 'markdown-it'
import { copyAudioAttachments } from '../src/integrations/markdown-audio'
import { markdownItAudio, remarkAudio, resolveAudioSource } from '../src/utils/markdown-audio'

const require = createRequire(import.meta.url)
const requireAstro = createRequire(require.resolve('astro/package.json'))
const { createMarkdownProcessor } = await import(pathToFileURL(requireAstro.resolve('@astrojs/markdown-remark')).href)
const options = { contentDirectory: fileURLToPath(new URL('../src/content/', import.meta.url)) }
const fileURL = new URL('../src/content/posts/audio-test/index.md', import.meta.url)
const filePath = fileURLToPath(fileURL)
const processor = await createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [[remarkAudio, options]] })
const rssParser = new MarkdownIt({ html: true }).use(markdownItAudio, options)

async function renderBoth(source: string) {
  const result = await processor.render(source, { fileURL })
  return [result.code, rssParser.render(source, { filePath })] as string[]
}

test('converts the original spaced, Chinese audio embed in table cells', async () => {
  const source = '| Call |\n| --- |\n| tsu-WEET<br>![黄眉柳莺](./XC1148200 - 黄眉柳莺 - Phylloscopus inornatus.mp3) |'
  for (const html of await renderBoth(source)) {
    assert.match(html, /tsu-WEET<br\s*\/?>/)
    assert.match(html, /<audio\b/)
    assert.match(html, /\scontrols[=>\s]/)
    assert.match(html, /aria-label="黄眉柳莺"/)
    assert.match(html, /src="\/audio\/posts\/audio-test\/XC1148200%20-%20%E9%BB%84%E7%9C%89%E6%9F%B3%E8%8E%BA%20-%20Phylloscopus%20inornatus\.mp3"/)
    assert.equal((html.match(/<audio\b/g) ?? []).length, 1)
    assert.doesNotMatch(html, /<img\b|!\[黄眉柳莺\]/)
  }
})

test('supports encoded paths, angle brackets, parentheses, query strings and multiple recordings', async () => {
  const source = '![one](./bird%20call.mp3) ![two](<./bird (two).ogg>) ![three](./bird three.WAV?download=1#sample)'
  for (const html of await renderBoth(source)) {
    assert.equal((html.match(/<audio\b/g) ?? []).length, 3)
    assert.match(html, /bird%20call\.mp3/)
    assert.match(html, /bird%20\(two\)\.ogg/)
    assert.match(html, /bird%20three\.WAV\?download=1#sample/)
  }
})

test('supports Markdown titles and escapes labels without altering surrounding entities', async () => {
  const source = 'before &amp; ![a "quoted" label](./bird call.mp3 "Bird call") after'
  for (const html of await renderBoth(source)) {
    assert.equal((html.match(/<audio\b/g) ?? []).length, 1)
    assert.match(html, /before (?:&amp;|&#x26;|&#38;) <audio/)
    assert.match(html, /aria-label="a (?:&quot;|&#x22;|&#34;)quoted(?:&quot;|&#x22;|&#34;) label"/)
    assert.match(html, /<\/audio> after/)
  }
})

test('leaves inline code, fenced code and escaped literal examples unchanged', async () => {
  const embed = '![example](./bird call.mp3)'
  const source = `\`${embed}\`\n\n\`\`\`md\n${embed}\n\`\`\`\n\n\\${embed}`
  for (const html of await renderBoth(source)) {
    assert.doesNotMatch(html, /<audio\b/)
    assert.match(html, /<code[^>]*>!\[example\]/)
  }
})

test('preserves ordinary images and external or public audio URLs', async () => {
  const source = '![photo](./bird.png) ![remote](https://example.com/bird.mp3) ![public](/recordings/bird.mp3)'
  for (const html of await renderBoth(source)) {
    assert.match(html, /<img\b/)
    assert.equal((html.match(/<audio\b/g) ?? []).length, 2)
    assert.match(html, /src="https:\/\/example\.com\/bird\.mp3"/)
    assert.match(html, /src="\/recordings\/bird\.mp3"/)
  }
})

test('retains all six original article embeds and excludes MP3s from image processing', async () => {
  const article = new URL('../src/content/posts/2026_10_08_note_e2ea85dd/index.md', import.meta.url)
  const source = (await readFile(article, 'utf8')).replace(/^---[\s\S]*?---\r?\n/, '')
  const result = await processor.render(source, { fileURL: article })
  assert.equal((result.code.match(/<audio\b/g) ?? []).length, 6)
  assert.equal(result.metadata.localImagePaths.length, 7)
  assert.ok(result.metadata.localImagePaths.every((image: string) => !image.endsWith('.mp3')))
  const rss = rssParser.render(source, { filePath: fileURLToPath(article) })
  assert.equal((rss.match(/<audio\b/g) ?? []).length, 6)
})

test('resolves attachments against the source file with a site base path', () => {
  assert.equal(resolveAudioSource('./call.mp3', filePath, { ...options, base: '/blog/' }), '/blog/audio/posts/audio-test/call.mp3')
  assert.equal(resolveAudioSource('./100% recording.mp3', filePath, options), '/audio/posts/audio-test/100%25%20recording.mp3')
  assert.throws(() => resolveAudioSource('../../../outside.mp3', filePath, options), /outside the content directory/)
})

test('copies only audio attachments, preserves nested filenames, and refreshes changed files', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'codex-markdown-audio-'))
  try {
    const source = join(fixture, 'content')
    const post = join(source, 'posts', 'example')
    const destination = join(fixture, 'dist', 'audio')
    await mkdir(post, { recursive: true })
    await writeFile(join(post, 'bird call.mp3'), 'original')
    await writeFile(join(post, 'image.jpg'), 'image')
    await writeFile(join(post, 'index.md'), 'post')
    await copyAudioAttachments(source, destination)
    const output = join(destination, 'posts', 'example')
    assert.deepEqual(await readdir(output), ['bird call.mp3'])
    assert.equal(await readFile(join(output, 'bird call.mp3'), 'utf8'), 'original')
    await writeFile(join(post, 'bird call.mp3'), 'updated')
    await copyAudioAttachments(source, destination)
    assert.equal(await readFile(join(output, 'bird call.mp3'), 'utf8'), 'updated')
  }
  finally {
    await rm(fixture, { recursive: true, force: true })
  }
})
