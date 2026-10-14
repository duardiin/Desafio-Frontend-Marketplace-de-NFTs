/**
 * Gera variantes WebP responsivas das artes do Figma (design/nfts-original/*.png).
 *
 * Usa o Chromium do Playwright (já instalado para os E2E) para redimensionar
 * e codificar em WebP via canvas: nenhuma dependência extra.
 *
 * Uso: node scripts/optimize-images.mjs
 * Saída: public/nfts/<nome>-<largura>.webp para cada largura em WIDTHS.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const WIDTHS = [256, 512, 900]
const QUALITY = 0.82
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const sourceDir = path.join(root, 'design', 'nfts-original')
const dir = path.join(root, 'public', 'nfts')

const browser = await chromium.launch()
const page = await browser.newPage()

for (const file of (await readdir(sourceDir)).filter((name) => name.endsWith('.png'))) {
  const source = await readFile(path.join(sourceDir, file))
  const dataUrl = `data:image/png;base64,${source.toString('base64')}`

  for (const width of WIDTHS) {
    const webp = await page.evaluate(
      async ({ dataUrl, width, quality }) => {
        const image = new Image()
        image.src = dataUrl
        await image.decode()
        const height = Math.round((image.naturalHeight / image.naturalWidth) * width)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        context.imageSmoothingQuality = 'high'
        context.drawImage(image, 0, 0, width, height)
        return canvas.toDataURL('image/webp', quality)
      },
      { dataUrl, width, quality: QUALITY },
    )
    const output = path.join(dir, `${path.basename(file, '.png')}-${width}.webp`)
    await writeFile(output, Buffer.from(webp.split(',')[1], 'base64'))
    console.log(`${path.relative(root, output)}`)
  }
}

await browser.close()
