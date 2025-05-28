import type { Env } from 'hono'
import { globImportEager } from '../globImport.js'
import { createApp as baseCreateApp } from './server.js'
import type { ServerOptions } from './server.js'

export const createApp = async <E extends Env>(options?: ServerOptions<E>) => {
  const projectRoot = options?.projectRoot ?? process.cwd()
  const newOptions = {
    root: options?.root ?? '/app/routes',
    projectRoot,
    app: options?.app,
    init: options?.init,
    trailingSlash: options?.trailingSlash,
    NOT_FOUND:
      options?.NOT_FOUND ??
      await globImportEager('/app/routes/**/_404.(ts|tsx)', projectRoot),
    ERROR:
      options?.ERROR ??
      await globImportEager('/app/routes/**/_error.(ts|tsx)', projectRoot),
    RENDERER:
      options?.RENDERER ??
      await globImportEager('/app/routes/**/_renderer.tsx', projectRoot),
    MIDDLEWARE:
      options?.MIDDLEWARE ??
      await globImportEager('/app/routes/**/_middleware.(ts|tsx)', projectRoot),
    ROUTES:
      options?.ROUTES ??
      await globImportEager(
        [
          '/app/routes/**/!(_*|$*|*.test|*.spec).(ts|tsx|md|mdx)',
          '/app/routes/.well-known/**/!(_*|$*|*.test|*.spec).(ts|tsx|md|mdx)',
        ],
        projectRoot
      ),
  }

  return baseCreateApp(newOptions)
}
