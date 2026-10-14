import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormAlert } from '@/components/form/form-alert'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas'
import { useLogin } from '@/features/auth/use-auth-actions'
import { applyApiErrors } from '@/lib/form-errors'

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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={errors.root?.server?.message} />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
