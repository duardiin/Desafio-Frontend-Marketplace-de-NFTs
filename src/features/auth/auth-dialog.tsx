import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoginForm } from '@/features/auth/login-form'
import { RegisterForm } from '@/features/auth/register-form'

export interface AuthSearch {
  /** Para onde voltar após autenticar (sempre um caminho interno). */
  redirect?: string
  /** Motivo de ter caído no login (ex.: sessão expirada). */
  motivo?: 'expirada'
}

interface AuthDialogProps extends AuthSearch {
  mode: 'login' | 'cadastro'
}

/**
 * Login e Cadastro são modais sobre a Início (como no Figma), mas com rota
 * própria: funcionam em acesso direto e no histórico do navegador.
 */
export function AuthDialog({ mode, redirect, motivo }: AuthDialogProps) {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  function close() {
    if (canGoBack) router.history.back()
    else void router.navigate({ to: '/' })
  }

  function finish() {
    void router.navigate({ href: redirect ?? '/', replace: true })
  }

  const isLogin = mode === 'login'

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-6 overflow-y-auto bg-surface-card p-6 sm:max-w-[500px] sm:p-10">
        <DialogHeader className="text-center">
          <DialogTitle className="text-center">{isLogin ? 'Entrar' : 'Criar conta'}</DialogTitle>
          <DialogDescription className="text-center">
            {isLogin
              ? 'Acesse sua conta para favoritar, comprar e acompanhar seus pedidos.'
              : 'Crie sua conta para colecionar arte digital na Kurio.'}
          </DialogDescription>
        </DialogHeader>

        {motivo === 'expirada' && (
          <p role="status" className="rounded-md border border-border-soft bg-surface-dark px-3 py-2 text-body-14">
            Sua sessão expirou. Entre novamente para continuar de onde parou.
          </p>
        )}

        {isLogin ? <LoginForm onSuccess={finish} /> : <RegisterForm onSuccess={finish} />}

        <p className="text-center text-body-14 text-muted-foreground">
          {isLogin ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          <Link
            to={isLogin ? '/cadastro' : '/login'}
            search={{ redirect }}
            replace
            className="font-bold text-highlight underline-offset-4 hover:underline"
          >
            {isLogin ? 'Criar conta' : 'Entrar'}
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  )
}
