import { Link } from '@tanstack/react-router'
import { ChevronDownIcon } from 'lucide-react'
import loginIcon from '@/assets/figma/icon-login.svg'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser } from '@/features/auth/session-query'
import { useLogout } from '@/features/auth/use-auth-actions'
import { openAuthDialog } from '@/features/auth/auth-dialog-store'

/** "Entrar" (Figma) para visitantes; menu da conta para quem está autenticado. */
export function AccountEntry() {
  const user = useCurrentUser()
  const logout = useLogout()

  if (!user) {
    return (
      // Abre o balão de login (Figma) sobre a tela atual, sem trocar de página.
      <Button size="sm" className="w-[100px]" aria-haspopup="dialog" onClick={() => openAuthDialog('login')}>
        <img src={loginIcon} alt="" width={20} height={20} className="size-5 p-px" />
        Entrar
      </Button>
    )
  }

  const firstName = user.displayName.split(' ')[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="max-w-[180px] gap-2 border-primary">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" width={24} height={24} className="size-6 shrink-0 rounded-full object-cover" />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-caption-12 font-bold text-ink"
            >
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="truncate">{firstName}</span>
          <ChevronDownIcon className="size-4" aria-hidden="true" />
          <span className="sr-only">: menu da conta</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-body-14">
          <span className="block font-bold">{user.displayName}</span>
          <span className="block truncate font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/carteiras">Minhas carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/favoritos">Meus favoritos</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
