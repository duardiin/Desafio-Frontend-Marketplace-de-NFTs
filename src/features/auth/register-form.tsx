import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormAlert } from '@/components/form/form-alert'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas'
import { useRegister } from '@/features/auth/use-auth-actions'
import { applyApiErrors } from '@/lib/form-errors'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const register = useRegister()
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async ({ displayName, email, password }) => {
    try {
      await register.mutateAsync({ displayName, email, password })
      onSuccess()
    } catch (error) {
      applyApiErrors(error, form.setError, ['displayName', 'email', 'password'])
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <FormAlert message={errors.root?.server?.message} />
      <TextField
        label="Nome"
        autoComplete="name"
        error={errors.displayName?.message}
        {...form.register('displayName')}
      />
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
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres, com letras e números."
        error={errors.password?.message}
        {...form.register('password')}
      />
      <TextField
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
