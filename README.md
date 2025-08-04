# Hono File-based Router

**Hono File-based Router** is a sample implementation of a file-based router for the Hono framework. It allows you to define routes in a file system structure, making it easier to manage and organize your routes.

This is a fork of the Honox (https://github.com/honojs/honox) project. I recommend using the original project for any new development.

## Key differences from Honox

- No Vite
- No Predefined island / hydration features

## No Vite

Honox needs Vite to both client and server side. When I migrate the existing project (Next.js) to Honox, it's hard to use Vite because it requires a lot of configuration and tricks (especially Common JS related things). I implemented the own filed-based routing with glob and `import()`.

## No Predefined island / hydration features

Honox's hydration features and Script / Link components are developed on top of Vite. So I just removed them. If you want to use hydration features, you can implement it by yourself. I did that with reading https://zenn.dev/kfly8/articles/sample-island-architecture-using-hono .

### Static Assets

For Static Assets (client JS and CSS), You can implement that with sha-256 hash and glob to find the files. That's not as smart as Vite, but it works.

app/routes/render.tsx:

```tsx
import { jsxRenderer } from 'hono/jsx-renderer';

import { clientJsFilename, styleCssFilename } from '../libs/distHash';

export default jsxRenderer(({ children }) => {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href={`/dist/${styleCssFilename}`} rel="stylesheet" />
        <script defer src={`/dist/${clientJsFilename}`} />
...
```

libs/distHash.ts:

```ts
// Very naive implementation. Looks for files like `client-*.js` and `style-*.css`
// in the `dist` directory when the app boots.
import { globSync } from 'tinyglobby'

export const clientJsFilename = (() => {
  if (process.env.NODE_ENV !== 'production') {
    return 'client.js'
  }
  const files = globSync('client-*.js', { cwd: './dist' })
  if (files.length === 0) {
    throw new Error('Client JS file not found')
  }
  return files[0]
})()
export const styleCssFilename = (() => {
  if (process.env.NODE_ENV !== 'production') {
    return 'style.css'
  }
  const files = globSync('style-*.css', { cwd: './dist' })
  if (files.length === 0) {
    throw new Error('Style CSS file not found')
  }
  return files[0]
})()
```

### Building

Here is my package.json:

```
...
  "scripts": {
    "test": "vitest run",
    "dev:server": "NODE_ENV=development dotenv -e ../../.env -e ./.env -- tsx watch --clear-screen=false app/server.ts",
    "dev:tailwind": "tailwindcss --input app/style.css --output dist/style.css --watch",
    "dev:esbuild": "esbuild app/client.ts --bundle --outdir=./dist --watch",
    "dev": "concurrently -n server,tailwind,esbuild -c green,yellow,blue \"pnpm run dev:server\" \"pnpm run dev:tailwind\" \"pnpm run dev:esbuild\"",
    "dev:bundles": "concurrently -n tailwind,esbuild -c yellow,blue \"pnpm run dev:tailwind\" \"pnpm run dev:esbuild\"",
    "build": "concurrently -n tailwind,esbuild -c yellow,blue \"esbuild app/client.ts --bundle --outdir=dist\" \"tailwindcss --input app/style.css --output dist/style.css\" && tsx app/build.ts",
    "start": "tsx app/server.ts"
  },
...
```

Key points:

- Use `tsx` to run TypeScript files directly. Or you don't need if you use Bun or Deno.
- Use esbuild to bundle client-side code. I tried several bundlers, but esbuild is the fastest and easiest to use.
- Use Tailwind with CLI mode. Because that's the easiest way to use Tailwind without Vite.
- Use `concurrently` to run multiple commands in parallel. This is useful for development mode.
- Add the simple script to add dist hash to the client-side code. This is useful to avoid caching issues in production. Like Next.js and Honox, we recommend to host them on S3 or other object storage services to avoid disruptions between old and new versions. Adding the new file to S3 avoids the cache issues, old page can still use the old file, and new page can use the new file.

app/build.ts:

```ts
// example: client.js -> client-12abff33.js
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { renameSync } from 'node:fs'

const getHash = (filename: string) => {
  const content = readFileSync(filename, 'utf-8')
  return createHash('sha1').update(content).digest('hex').slice(0, 8)
}

const files = ['client.js', 'style.css']
for (const file of files) {
  const hash = getHash(`./dist/${file}`)
  const [name, ext] = file.split('.')
  const newFilename = `${name}-${hash}.${ext}`
  renameSync(`./dist/${file}`, `./dist/${newFilename}`)
  console.log(`Renamed ${file} -> ${newFilename}`)
}
```
