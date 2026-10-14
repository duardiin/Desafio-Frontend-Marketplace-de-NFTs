import { useLocation, useMatches } from '@tanstack/react-router'
import type { NavSection } from '@/features/layout/navigation'

interface RouteChrome {
  activeSection: NavSection | undefined
  headerDivider: boolean
}

/**
 * Lê a `staticData` da rota mais profunda para decidir o item ativo do header
 * e a divisória. Em "/#catalogo" o item ativo é "Mercado" (o catálogo vive na Início).
 * Rotas sem `staticData` (ex.: 404) não destacam nenhum item.
 */
export function useRouteChrome(): RouteChrome {
  const staticData = useMatches({ select: (matches) => matches.at(-1)?.staticData })
  const hash = useLocation({ select: (location) => location.hash })

  const declared = staticData?.navSection
  const activeSection = declared === 'inicio' && hash === 'catalogo' ? 'mercado' : declared

  return { activeSection, headerDivider: staticData?.headerDivider ?? true }
}
