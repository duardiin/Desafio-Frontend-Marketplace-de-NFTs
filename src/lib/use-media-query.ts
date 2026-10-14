import { useSyncExternalStore } from 'react'

/**
 * Estado de uma media query. Usado só quando duas versões de um bloco não
 * podem coexistir escondidas por CSS (ex.: a imagem LCP do hero, que seria
 * baixada mesmo com `display: none`).
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
