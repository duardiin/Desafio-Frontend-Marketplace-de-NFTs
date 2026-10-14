import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormAlert } from '@/components/form/form-alert'
import { InputField, PasswordField } from '@/components/form/outlined-fields'
import { Button } from '@/components/ui/button'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas'
import { useRegister } from '@/features/auth/use-auth-actions'
import { applyApiErrors } from '@/lib/form-errors'

/** Cadastro no padrão do login do Figma (frame 9:1022, 656 px: nome, e-mail, senha e confirmação). */
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
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <FormAlert message={errors.root?.server?.message} />
      <InputField
        label="Nome"
        srOnlyLabel
        autoComplete="name"
        placeholder="Seu nome"
        error={errors.displayName?.message}
        {...form.register('displayName')}
      />
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
        autoComplete="new-password"
        placeholder="Senha"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        srOnlyLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button type="submit" className="mt-3 h-[45px] w-full rounded-[3px]" disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
