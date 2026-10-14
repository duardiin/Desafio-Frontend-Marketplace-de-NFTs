import { Link } from '@tanstack/react-router'
import { MenuIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useCurrentUser } from '@/features/auth/session-query'
import { useLogout } from '@/features/auth/use-auth-actions'
import { openAuthDialog } from '@/features/auth/auth-dialog-store'
import { NAV_ITEMS, type NavSection } from '@/features/layout/navigation'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  activeSection: NavSection | undefined
  className?: string
}

/**
 * Navegação abaixo de 1024 px. O frame mobile do header ainda não foi extraído
 * do Figma: adaptamos com um drawer (Radix Dialog), que prende o foco,
 * fecha com Esc e devolve o foco ao botão que o abriu.
 */
export function MobileNav({ activeSection, className }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const user = useCurrentUser()
  const logout = useLogout()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('text-foreground', className)}>
          <MenuIcon className="size-6" aria-hidden="true" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(320px,85vw)] gap-0 border-border-soft bg-surface-card">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="text-body-14 font-bold tracking-brand">KURIO</SheetTitle>
          <SheetDescription className="sr-only">Navegação principal</SheetDescription>
        </SheetHeader>

        <nav aria-label="Principal (menu)" className="px-6">
          <ul className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <li key={item.label} className="border-b border-border">
                {'comingSoon' in item ? (
                  <span
                    aria-disabled="true"
                    className="flex h-12 cursor-not-allowed items-center justify-between text-body-16 text-muted-foreground"
                  >
                    {item.label}
                    <span className="text-caption-12">em breve</span>
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    hash={item.hash}
                    activeOptions={{ exact: true, includeHash: true }}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex h-12 items-center text-body-16',
                      item.section === activeSection
                        ? 'border-l-[3px] border-primary pl-3 font-bold text-highlight'
                        : 'text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 p-6">
          {user ? (
            <>
              <p className="text-body-14 text-muted-foreground">
                Conectado como <span className="font-bold text-foreground">{user.displayName}</span>
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/perfil" onClick={() => setOpen(false)}>
                  Meu perfil
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/carteiras" onClick={() => setOpen(false)}>
                  Minhas carteiras
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/favoritos" onClick={() => setOpen(false)}>
                  Meus favoritos
                </Link>
              </Button>
              <Button
                className="w-full"
                disabled={logout.isPending}
                onClick={() => {
                  setOpen(false)
                  logout.mutate()
                }}
              >
                Sair
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={() => {
                // Fecha o menu e abre o balão de login sobre a tela atual.
                setOpen(false)
                openAuthDialog('login')
              }}
            >
              Entrar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
