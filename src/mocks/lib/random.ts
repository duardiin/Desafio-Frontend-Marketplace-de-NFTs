/** PRNG determinístico (mulberry32): mesma semente, mesma sequência. */
export function createRandom(seed: number) {
  let state = seed >>> 0
  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1))
    },
    pick<T>(items: readonly T[]): T {
      return items[Math.floor(next() * items.length)]
    },
    hex(length: number): string {
      let out = ''
      for (let i = 0; i < length; i++) out += Math.floor(next() * 16).toString(16)
      return out
    },
  }
}
