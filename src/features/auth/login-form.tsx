import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormAlert } from '@/components/form/form-alert'
import { InputField, PasswordField } from '@/components/form/outlined-fields'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas'
import { useLogin } from '@/features/auth/use-auth-actions'
import { ComingSoon } from '@/features/layout/coming-soon'
import { applyApiErrors } from '@/lib/form-errors'

/** Login do Figma (9:115): campos só com placeholder (rótulo para leitores de tela). */
export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useLogin()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values)
      onSuccess()
    } catch (error) {
      applyApiErrors(error, form.setError, ['email', 'password'])
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <FormAlert message={errors.root?.server?.message} />
      <InputField
        label="E-mail"
        srOnlyLabel
        type="email"
        autoComplete="email"
        placeholder="contato@email.com"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        srOnlyLabel
        autoComplete="current-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...form.register('password')}
      />
      {/* Recuperação de senha está fora do escopo da entrega. */}
      <ComingSoon className="self-end text-body-14 leading-4 text-highlight">Esqueceu a senha?</ComingSoon>
      <Button type="submit" className="mt-3 h-[45px] w-full rounded-[3px]" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
