import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import activityIcon from '@/assets/figma/icon-activity.svg'
import dangerIcon from '@/assets/figma/icon-danger-triangle.svg'
import downloadIcon from '@/assets/figma/icon-download.svg'
import heartIcon from '@/assets/figma/icon-heart-outline.svg'
import locationIcon from '@/assets/figma/icon-location.svg'
import logoutIcon from '@/assets/figma/icon-logout-accent.svg'
import shoppingIcon from '@/assets/figma/icon-shopping.svg'
import userIcon from '@/assets/figma/icon-user.svg'
import { useLogout } from '@/features/auth/use-auth-actions'
import { ComingSoon } from '@/features/layout/coming-soon'
import { cn } from '@/lib/utils'

export type AccountSection = 'perfil' | 'carteiras' | 'favoritos'

type SidebarItem =
  | { label: string; icon: string; size: number; section: AccountSection; to: '/perfil' | '/carteiras' | '/favoritos' }
  | { label: string; icon: string; size: number; section?: undefined; to?: undefined }

/** Itens da barra "Meu perfil" (Figma 9:1238). Os sem rota estão fora do escopo da entrega. */
const ITEMS: SidebarItem[] = [
  { label: 'Dados do perfil', icon: userIcon, size: 18, section: 'perfil', to: '/perfil' },
  { label: 'Carteiras', icon: locationIcon, size: 20, section: 'carteiras', to: '/carteiras' },
  { label: 'Atividade', icon: shoppingIcon, size: 18 },
  { label: 'Lista de interesse', icon: heartIcon, size: 16, section: 'favoritos', to: '/favoritos' },
  { label: 'Ofertas', icon: activityIcon, size: 18 },
  { label: 'Arquivos baixados', icon: downloadIcon, size: 18 },
  { label: 'Suporte', icon: dangerIcon, size: 18 },
]

const ITEM =
  'flex h-[45px] shrink-0 items-center gap-3 px-4 text-body-15 whitespace-nowrap text-highlight outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset'

/**
 * Área da conta: barra lateral de 310 px + conteúdo (gap 28) no desktop.
 * Abaixo de 1024 px não há frame no Figma: a barra vira uma faixa rolável
 * acima do conteúdo, com o item ativo sublinhado.
 */
export function AccountLayout({ active, children }: { active: AccountSection; children: ReactNode }) {
  return (
    <div className="container-page mt-8 flex flex-col gap-7 lg:flex-row lg:items-start">
      <AccountSidebar active={active} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

function AccountSidebar({ active }: { active: AccountSection }) {
  const logout = useLogout()

  // Nome "Minha conta": o rodapé já tem uma navegação "Meu perfil" (landmarks distintos para leitores de tela).
  return (
    <nav aria-label="Minha conta" className="min-w-0 bg-surface-card py-2 lg:w-[310px] lg:shrink-0">
      <h2 className="p-2.5 text-body-18 leading-4 font-bold">
        Meu perfil
      </h2>
      {/* `relative`: os textos sr-only (absolutos) ficam contidos na faixa rolável e não alargam a página. */}
      <ul className="relative flex overflow-x-auto lg:flex-col lg:overflow-visible">
        {ITEMS.map((item) => {
          const icon = <img src={item.icon} alt="" width={item.size} height={item.size} className="shrink-0" />
          if (!item.to) {
            return (
              <li key={item.label}>
                <ComingSoon className={ITEM}>
                  {icon}
                  {item.label}
                </ComingSoon>
              </li>
            )
          }
          const isActive = item.section === active
          return (
            <li key={item.label}>
              <Link
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  ITEM,
                  'hover:bg-surface-raised',
                  isActive && 'gap-4 border-b-[3px] border-primary lg:border-b-0 lg:border-l-[6px]',
                )}
              >
                {icon}
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
      <div aria-hidden="true" className="h-[0.3px] bg-primary" />
      <button
        type="button"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
        className={cn(ITEM, 'h-10 w-full gap-2 font-bold leading-[15px] hover:bg-surface-raised disabled:opacity-60')}
      >
        <img src={logoutIcon} alt="" width={20} height={20} className="size-5 p-[1.7px]" />
        Sair
      </button>
    </nav>
  )
}
