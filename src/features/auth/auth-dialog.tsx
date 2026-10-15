import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeftIcon, XIcon } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'
import facebookIcon from '@/assets/figma/login-facebook.svg'
import googleIcon from '@/assets/figma/login-google.svg'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { closeAuthDialog, openAuthDialog, useAuthDialogMode, type AuthMode } from '@/features/auth/auth-dialog-store'
import { LoginForm } from '@/features/auth/login-form'
import { RegisterForm } from '@/features/auth/register-form'
import { ComingSoon } from '@/features/layout/coming-soon'
import { useMediaQuery } from '@/lib/use-media-query'
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
 * Login e cadastro: "balão" sobre a tela no desktop (Figma 9:115) e tela
 * cheia no mobile (16:1022 e 16:1228). Uma versão por vez.
 */
function AuthDialogView(props: AuthDialogViewProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  return isDesktop ? <AuthBalloon {...props} /> : <AuthScreen {...props} />
}

/** Foco inicial no primeiro campo (e não no botão de fechar): é o que a pessoa vai preencher. */
function focusFirstField(event: Event) {
  event.preventDefault()
  ;(event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('form input')?.focus()
}

function SessionExpiredNotice({ motivo }: { motivo: AuthSearch['motivo'] }) {
  if (motivo !== 'expirada') return null
  return (
    <p role="status" className="mt-4 rounded-[3px] border border-border-soft bg-surface-dark px-3 py-2 text-body-14">
      Sua sessão expirou. Entre novamente para continuar de onde parou.
    </p>
  )
}

/**
 * Mobile (Figma 16:1022 e 16:1228): login e cadastro em tela cheia, com KURIO
 * no topo, título, campos de 50 px, botão de 60 px, login social "em breve" e
 * o link para alternar entre entrar e criar conta. Continua sendo um diálogo
 * (foco preso, Esc fecha); o "voltar" no topo segue o padrão das telas mobile.
 */
function AuthScreen({ mode, motivo, onModeChange, onClose, onSuccess }: AuthDialogViewProps) {
  const isLogin = mode === 'login'
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={focusFirstField}
        overlayClassName="bg-ink supports-backdrop-filter:backdrop-blur-none"
        className="top-0 left-0 h-dvh w-full max-w-none translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none bg-ink p-0 ring-0 sm:max-w-none"
      >
        <div className="mx-auto flex min-h-full w-full max-w-[440px] flex-col px-7 pt-6 pb-10">
          <BackButtonLike onClick={onClose} />
          <p aria-hidden="true" className="mt-[clamp(24px,8dvh,90px)] text-center text-[32px] leading-10 font-bold tracking-[3px]">
            KURIO
          </p>
          <DialogTitle className="mt-[clamp(32px,10dvh,100px)] text-center text-[20px] leading-7 font-bold">
            {isLogin ? 'Entrar' : 'Criar perfil de colecionador'}
          </DialogTitle>
          <DialogDescription className="sr-only">{DESCRIPTIONS[mode]}</DialogDescription>
          <SessionExpiredNotice motivo={motivo} />

          <div className="mt-6">
            {isLogin ? <LoginForm onSuccess={onSuccess} variant="screen" /> : <RegisterForm onSuccess={onSuccess} variant="screen" />}
          </div>

          <SocialSignIn variant="screen" />

          <p className="mt-auto pt-10 text-center text-body-15 text-muted-foreground">
            {isLogin ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
            <button
              type="button"
              onClick={() => onModeChange(isLogin ? 'cadastro' : 'login')}
              className="rounded-sm underline-offset-4 outline-none hover:text-highlight hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {isLogin ? 'Crie uma conta' : 'Entre'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** "Voltar" redondo das telas mobile (o frame do login não tem; mantém a saída por toque). */
function BackButtonLike({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface-raised text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ChevronLeftIcon className="size-4" strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}

/** Desktop (Figma 9:115): "balão" de 500 px sobre a tela, com as abas "Entrar | Criar conta". */
function AuthBalloon({ mode, motivo, onModeChange, onClose, onSuccess }: AuthDialogViewProps) {
  const isLogin = mode === 'login'

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={focusFirstField}
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

          <SessionExpiredNotice motivo={motivo} />

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
function SocialSignIn({ variant = 'balloon' }: { variant?: 'balloon' | 'screen' }) {
  const screen = variant === 'screen'
  const button =
    'flex h-10 w-full items-center justify-center gap-2.5 rounded-[3px] border border-border text-caption-13 font-medium text-muted-foreground'
  return (
    <>
      <div className={cn('relative flex justify-center', screen ? 'mt-12' : '-mx-6 mt-6 sm:-mx-20')}>
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-border" />
        <span className={cn('relative px-3 text-caption-13 leading-4 text-foreground', screen ? 'bg-ink' : 'bg-surface-card')}>
          Ou continue com
        </span>
      </div>
      <div className={cn('flex flex-col', screen ? 'mt-5 gap-4' : 'mt-3 gap-3')}>
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
