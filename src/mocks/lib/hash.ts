/** Hash FNV-1a de 32 bits em hex. Uso: ids determinísticos (cotação, transação). Não é criptográfico. */
export function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** Hash determinístico longo (n blocos FNV encadeados), ex.: hash de transação simulado. */
export function longHash(input: string, blocks: number): string {
  let out = ''
  let seed = input
  for (let i = 0; i < blocks; i++) {
    seed = fnv1a(`${seed}:${i}`)
    out += seed
  }
  return out
}

/**
 * Hash de senha do "servidor" simulado: SHA-256(salt + ":" + senha).
 * A senha nunca é armazenada; só o salt e o hash.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function randomSalt(): string {
  return crypto.randomUUID().slice(0, 13)
}
