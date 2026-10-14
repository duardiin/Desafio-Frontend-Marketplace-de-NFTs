import { Link } from '@tanstack/react-router'
import { AccountEntry } from '@/features/auth/account-entry'
import { SearchDialog } from '@/features/catalog/search-dialog'
import { CartLink } from '@/features/cart/cart-link'
import { ComingSoon } from '@/features/layout/coming-soon'
import { MobileNav } from '@/features/layout/mobile-nav'
import { NAV_ITEMS, type NavItem, type NavSection } from '@/features/layout/navigation'
import { useRouteChrome } from '@/features/layout/use-route-chrome'
import { Wordmark } from '@/features/layout/wordmark'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const { activeSection, headerDivider } = useRouteChrome()

  return (
    <header className="container-page pt-6">
      <div className="flex h-[45px] items-center justify-between gap-4">
        <Wordmark className="lg:w-40" />

        <nav aria-label="Principal" className="hidden h-full lg:block">
          <ul className="flex h-full items-center gap-10">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="h-full">
                <DesktopNavEntry item={item} activeSection={activeSection} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-5 lg:gap-7">
          <SearchDialog />
          <CartLink />
          <div className="hidden lg:block">
            <AccountEntry />
          </div>
          <MobileNav activeSection={activeSection} className="lg:hidden" />
        </div>
      </div>
      {headerDivider && <div aria-hidden="true" className="h-px bg-primary/50" />}
    </header>
  )
}

function DesktopNavEntry({
  item,
  activeSection,
}: {
  item: NavItem
  activeSection: NavSection | undefined
}) {
  const baseClass = 'relative flex h-full items-center text-body-16 whitespace-nowrap'

  if ('comingSoon' in item) {
    return <ComingSoon className={cn(baseClass, 'text-foreground')}>{item.label}</ComingSoon>
  }

  const isActive = item.section === activeSection
  return (
    <Link
      to={item.to}
      hash={item.hash}
      activeOptions={{ exact: true, includeHash: true }}
      className={cn(
        baseClass,
        'hover:text-highlight',
        isActive
          ? 'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-[3px] after:bg-primary'
          : 'text-foreground',
      )}
    >
      {item.label}
    </Link>
  )
}
