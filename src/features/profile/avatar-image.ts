/** Mesmos limites da API (PUT /me/avatar). */
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const AVATAR_MAX_BYTES = 300 * 1024
const AVATAR_SIZE = 256

export class AvatarImageError extends Error {}

function dataUrlBytes(dataUrl: string) {
  return Math.floor((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
}

/**
 * Lê o arquivo escolhido, recorta ao centro em quadrado e reduz para 256 px
 * em WebP. O avatar é exibido em no máximo 50 px, então o envio fica pequeno
 * (alguns KB) mesmo para fotos grandes.
 */
export async function prepareAvatar(file: File): Promise<string> {
  if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
    throw new AvatarImageError('Envie uma imagem PNG, JPEG ou WebP.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new AvatarImageError('Não foi possível ler esta imagem. Tente outro arquivo.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  const size = Math.min(AVATAR_SIZE, side)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) throw new AvatarImageError('Seu navegador não conseguiu processar a imagem.')
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/webp', 0.85)
  if (dataUrlBytes(dataUrl) > AVATAR_MAX_BYTES) {
    throw new AvatarImageError('A imagem precisa ter no máximo 300 KB.')
  }
  return dataUrl
}
