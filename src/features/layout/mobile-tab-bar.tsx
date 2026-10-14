import { Link, useLocation } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import scanBottomLeft from '@/assets/figma/m-scan-2.svg'
import scanBottomRight from '@/assets/figma/m-scan-4.svg'
import scanLine from '@/assets/figma/m-scan-1.svg'
import scanTopLeft from '@/assets/figma/m-scan-5.svg'
import scanTopRight from '@/assets/figma/m-scan-3.svg'
import cartIcon from '@/assets/figma/m-tab-cart.svg'
import heartIcon from '@/assets/figma/m-tab-heart.svg'
import homeIcon from '@/assets/figma/m-tab-home.svg'
import userIcon from '@/assets/figma/m-tab-user.svg'
import { cartItemCount, useCart } from '@/features/cart/use-cart'
import { cn } from '@/lib/utils'

type TabPath = '/' | '/favoritos' | '/carrinho' | '/perfil'

/**
 * Tab bar do Início mobile (Figma 14:5226), fixa embaixo abaixo de 768 px.
 * O fundo curvo é desenhado em três partes (lados + recorte central de
 * largura fixa) para o recorte não distorcer em larguras diferentes de 414.
 */
export function MobileTabBar() {
  const pathname = useLocation({ select: (location) => location.pathname })
  const cart = useCart()
  const count = cartItemCount(cart.data)

  return (
    <nav
      aria-label="Atalhos"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[126px] pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="absolute inset-x-0 bottom-0 flex h-[95px] drop-shadow-[0_-10px_15px_rgba(10,6,4,0.45)]">
        <div className="pointer-events-auto flex flex-1 items-start justify-start gap-7 rounded-tl-[29px] bg-surface-card pt-[29px] pl-6">
          <TabLink to="/" label="Início" icon={homeIcon} iconSize={[16, 17]} active={pathname === '/'} />
          <TabLink to="/favoritos" label="Favoritos" icon={heartIcon} iconSize={[20, 18]} active={pathname === '/favoritos'} />
        </div>
        {/* -mx-px: as partes se sobrepõem para não aparecer emenda entre elas. */}
        <svg aria-hidden="true" width="152" height="95" viewBox="0 0 151.7 94.95" className="relative -mx-px shrink-0">
          <path
            d="M151.7 0C137.94 0 125.72 8.2 119.87 20.65C112.11 37.17 95.31 48.62 75.85 48.62C56.39 48.62 39.59 37.18 31.83 20.65C25.98 8.2 13.75 0 0 0V94.95H151.7Z"
            fill="var(--surface-card)"
          />
        </svg>
        <div className="pointer-events-auto flex flex-1 items-start justify-end gap-[18px] rounded-tr-[29px] bg-surface-card pt-[29px] pr-7">
          <TabLink
            to="/carrinho"
            label={count === 0 ? 'Carrinho, vazio' : `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}`}
            icon={cartIcon}
            iconSize={[20, 20]}
            active={pathname === '/carrinho'}
            badge={count}
          />
          <TabLink
            to="/perfil"
            label="Minha conta"
            icon={userIcon}
            iconSize={[20, 20]}
            active={pathname === '/perfil' || pathname === '/carteiras'}
          />
        </div>
      </div>
      <CenterButton />
    </nav>
  )
}

interface TabLinkProps {
  to: TabPath
  label: string
  icon: string
  iconSize: [number, number]
  active: boolean
  badge?: number
}

/** Ícones recoloridos por máscara: ativo em `text-accent` (#E89B55), inativo em `text-secondary` (#CFB28C). */
function TabLink({ to, label, icon, iconSize: [width, height], active, badge = 0 }: TabLinkProps) {
  const mask: CSSProperties = {
    width,
    height,
    maskImage: `url("${icon}")`,
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
    maskPosition: 'center',
  }
  return (
    <Link
      to={to}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative grid size-11 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        active ? 'text-highlight' : 'text-muted-foreground',
      )}
    >
      <span aria-hidden="true" className="block bg-current" style={mask} />
      {badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1 grid size-4 min-w-4 place-items-center rounded-full border-2 border-surface-card bg-primary px-0.5 text-tiny-10 font-medium text-ink"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}

/**
 * Botão central do Figma (círculo de 65 px com ícone de leitura). A função
 * ainda não foi definida: fica só visual, sem foco nem ação, e fora da
 * árvore de acessibilidade.
 */
function CenterButton() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-0 left-1/2 size-[65px] -translate-x-1/2 rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.4)_-17%,#d28a4c_109%)]"
    >
      <span className="absolute top-[21px] left-[19px] h-6 w-[27px]">
        <img src={scanTopLeft} alt="" width={10} height={10} className="absolute top-0 left-[1.3px]" />
        <img src={scanTopRight} alt="" width={10} height={10} className="absolute top-0 left-[15px]" />
        <img src={scanLine} alt="" width={27} height={2} className="absolute top-[11px] left-0" />
        <img src={scanBottomLeft} alt="" width={10} height={10} className="absolute top-[13.7px] left-[1.3px]" />
        <img src={scanBottomRight} alt="" width={10} height={10} className="absolute top-[13.7px] left-[15px]" />
      </span>
    </span>
  )
}
