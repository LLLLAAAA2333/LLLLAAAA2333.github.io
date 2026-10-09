import type { AstroIntegration } from 'astro'
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { audioUrlPrefix, isAudioSource, remarkAudio } from '../utils/markdown-audio'

export async function copyAudioAttachments(sourceDirectory: string, destinationDirectory: string) {
  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    const source = join(sourceDirectory, entry.name)
    const destination = join(destinationDirectory, entry.name)
    if (entry.isDirectory()) {
      await copyAudioAttachments(source, destination)
    }
    else if (entry.isFile() && isAudioSource(entry.name)) {
      await mkdir(destinationDirectory, { recursive: true })
      await copyFile(source, destination)
    }
  }
}

export default function markdownAudio(): AstroIntegration {
  let contentDirectory: string

  return {
    name: 'markdown-audio',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        contentDirectory = fileURLToPath(new URL('content/', config.srcDir))
        const prefix = audioUrlPrefix(config.base)
        updateConfig({
          markdown: { remarkPlugins: [[remarkAudio, { contentDirectory, base: config.base }]] },
          vite: {
            plugins: [{
              name: 'markdown-audio-assets',
              configureServer(server) {
                server.middlewares.use((request, _response, next) => {
                  const url = new URL(request.url ?? '/', 'http://localhost')
                  if (!url.pathname.startsWith(prefix))
                    return next()

                  let pathname: string
                  try {
                    pathname = decodeURIComponent(url.pathname.slice(prefix.length))
                  }
                  catch {
                    return next()
                  }
                  const attachment = resolve(contentDirectory, pathname)
                  const contentPath = relative(contentDirectory, attachment)
                  if (!isAudioSource(pathname) || contentPath.startsWith('..') || isAbsolute(contentPath))
                    return next()

                  request.url = `/@fs/${encodeURI(attachment.replaceAll('\\', '/'))}${url.search}`
                  next()
                })
              },
            }],
          },
        })
      },
      'astro:build:done': async ({ dir }) => {
        await copyAudioAttachments(contentDirectory, fileURLToPath(new URL('audio/', dir)))
      },
    },
  }
}
