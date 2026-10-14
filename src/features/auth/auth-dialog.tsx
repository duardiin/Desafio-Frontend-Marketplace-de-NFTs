import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { XIcon } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import facebookIcon from '@/assets/figma/login-facebook.svg'
import googleIcon from '@/assets/figma/login-google.svg'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { closeAuthDialog, openAuthDialog, useAuthDialogMode, type AuthMode } from '@/features/auth/auth-dialog-store'
import { LoginForm } from '@/features/auth/login-form'
import { RegisterForm } from '@/features/auth/register-form'
import { ComingSoon } from '@/features/layout/coming-soon'
import { cn } from '@/lib/utils'

export interface AuthSearch {
  /** Para onde voltar após autenticar (sempre um caminho interno). */
  redirect?: string
  /** Motivo de ter caído no login (ex.: sessão expirada). */
  motivo?: 'expirada'
}

interface AuthDialogViewProps {
  mode: AuthMode
  motivo?: AuthSearch['motivo']
  onModeChange: (mode: AuthMode) => void
  onClose: () => void
  onSuccess: () => void
}

const DESCRIPTIONS: Record<AuthMode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  cadastro: 'Crie sua conta para gerenciar sua carteira, coleção e perfil de criador.',
}

/**
 * Login e cadastro do Figma (9:115 e 9:1022): um "balão" de 500 px sobre a
 * tela, sem escurecer o fundo, com as abas "Entrar | Criar conta".
 */
function AuthDialogView({ mode, motivo, onModeChange, onClose, onSuccess }: AuthDialogViewProps) {
  const isLogin = mode === 'login'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        // Foco inicial no primeiro campo (e não no "X"): é o que a pessoa vai preencher.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('form input')?.focus()
        }}
        overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
        className="top-4 max-h-[calc(100dvh-2rem)] translate-y-0 gap-0 overflow-y-auto rounded-none bg-surface-card p-0 shadow-2xl ring-0 sm:top-[clamp(1rem,calc(50dvh-300px),192px)] sm:max-w-[500px]"
      >
        <DialogClose
          aria-label="Fechar"
          className="absolute top-3 right-3 grid size-8 place-items-center rounded-sm text-primary outline-none hover:text-highlight focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <XIcon className="size-4" aria-hidden="true" />
        </DialogClose>

        <div className="flex flex-col px-6 pt-11 pb-14 sm:px-20 sm:pb-[103px]">
          {/* O título acessível acompanha a aba ativa; as abas são o título visual. */}
          <DialogTitle className="sr-only">{isLogin ? 'Entrar' : 'Criar conta'}</DialogTitle>
          <AuthTabs mode={mode} onModeChange={onModeChange} />

          <DialogDescription className="mt-9 text-center text-caption-13 leading-4 text-foreground sm:-mx-8">
            {DESCRIPTIONS[mode]}
          </DialogDescription>

          {motivo === 'expirada' && (
            <p role="status" className="mt-4 rounded-[3px] border border-border-soft bg-surface-dark px-3 py-2 text-body-14">
              Sua sessão expirou. Entre novamente para continuar de onde parou.
            </p>
          )}

          <div className="mt-6">
            {isLogin ? <LoginForm onSuccess={onSuccess} /> : <RegisterForm onSuccess={onSuccess} />}
          </div>

          <SocialSignIn />
        </div>

        {/* Faixa laranja na base do balão (Figma). */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2.5 bg-primary" />
      </DialogContent>
    </Dialog>
  )
}

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'login', label: 'Entrar' },
  { mode: 'cadastro', label: 'Criar conta' },
]

/** "Entrar | Criar conta": abas com setas do teclado (padrão WAI-ARIA). */
function AuthTabs({ mode, onModeChange }: { mode: AuthMode; onModeChange: (mode: AuthMode) => void }) {
  const refs = useRef<Record<AuthMode, HTMLButtonElement | null>>({ login: null, cadastro: null })

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    const next = mode === 'login' ? 'cadastro' : 'login'
    onModeChange(next)
    refs.current[next]?.focus()
  }

  return (
    <div role="tablist" aria-label="Acesso à conta" onKeyDown={onKeyDown} className="flex items-center justify-center">
      {TABS.map((tab, index) => {
        const selected = tab.mode === mode
        return (
          <div key={tab.mode} className="flex items-center">
            {index > 0 && <span aria-hidden="true" className="mx-2 h-5 w-px bg-primary" />}
            <button
              ref={(element) => {
                refs.current[tab.mode] = element
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onModeChange(tab.mode)}
              className={cn(
                'rounded-sm text-[20px] leading-7 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                selected ? 'text-highlight' : 'font-medium text-foreground hover:text-highlight',
              )}
            >
              {tab.label}
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** "Ou continue com" + Google e Facebook: login social está fora do escopo ("em breve"). */
function SocialSignIn() {
  const button =
    'flex h-10 w-full items-center justify-center gap-2.5 rounded-[3px] border border-border text-caption-13 font-medium text-muted-foreground'
  return (
    <>
      <div className="relative -mx-6 mt-6 flex justify-center sm:-mx-20">
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className="relative bg-surface-card px-3 text-caption-13 leading-4 text-foreground">Ou continue com</span>
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <ComingSoon className={button}>
          <img src={googleIcon} alt="" width={20} height={20} />
          Continuar com Google
        </ComingSoon>
        <ComingSoon className={button}>
          <img src={facebookIcon} alt="" width={20} height={20} />
          Continuar com Facebook
        </ComingSoon>
      </div>
    </>
  )
}

/**
 * Rotas /login e /cadastro: acesso direto, rotas protegidas e sessão expirada.
 * As abas trocam de rota (mantendo o `redirect`), e o login volta à tela pedida.
 */
export function AuthDialog({ mode, redirect, motivo }: AuthSearch & { mode: AuthMode }) {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  return (
    <AuthDialogView
      mode={mode}
      motivo={motivo}
      onModeChange={(next) =>
        void navigate({ to: next === 'login' ? '/login' : '/cadastro', search: { redirect }, replace: true })
      }
      onClose={() => {
        if (canGoBack) router.history.back()
        else void router.navigate({ to: '/' })
      }}
      onSuccess={() => void router.navigate({ href: redirect ?? '/', replace: true })}
    />
  )
}

/** Balão aberto pelo "Entrar" do header sobre a tela atual: fechar ou entrar mantém a página. */
export function AuthDialogHost() {
  const mode = useAuthDialogMode()
  if (!mode) return null
  return (
    <AuthDialogView
      mode={mode}
      onModeChange={openAuthDialog}
      onClose={closeAuthDialog}
      onSuccess={closeAuthDialog}
    />
  )
}
