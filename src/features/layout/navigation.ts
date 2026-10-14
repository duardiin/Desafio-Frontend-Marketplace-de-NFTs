/** Seção do header destacada como ativa (definida por rota em `staticData`). */
export type NavSection = 'inicio' | 'mercado'

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Item do header marcado como ativo nesta rota. */
    navSection?: NavSection
    /** Mostra a divisória abaixo do header (Início, Perfil, Carteiras, Login, Cadastro). */
    headerDivider?: boolean
    /** Header abaixo de 768 px. O Início mobile do Figma não tem header (busca no topo + tab bar). */
    mobileHeader?: boolean
  }
}

export type NavItem =
  | { label: string; section: NavSection; to: '/'; hash?: string }
  | { label: string; comingSoon: true }

/** Itens do header. "Criadores" e "Aprenda" são editoriais e estão fora do escopo. */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Início', section: 'inicio', to: '/' },
  { label: 'Mercado', section: 'mercado', to: '/', hash: 'catalogo' },
  { label: 'Criadores', comingSoon: true },
  { label: 'Aprenda', comingSoon: true },
]
