import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { FormAlert } from '@/components/form/form-alert'
import { InputField, PasswordField } from '@/components/form/outlined-fields'
import { Button } from '@/components/ui/button'
import { registerSchema, type RegisterFormValues } from '@/features/auth/schemas'
import { useRegister } from '@/features/auth/use-auth-actions'
import { applyApiErrors } from '@/lib/form-errors'

/** Cadastro no padrão do login do Figma (frame 9:1022, 656 px: nome, e-mail, senha e confirmação). */
/**
 * `screen`: cadastro mobile em tela cheia (Figma 16:1228): "Nome de usuário",
 * "Digite seu e-mail", senha e confirmação, e o botão "Criar perfil".
 */
export function RegisterForm({ onSuccess, variant = 'balloon' }: { onSuccess: () => void; variant?: 'balloon' | 'screen' }) {
  const screen = variant === 'screen'
  const input = screen ? 'h-[50px] rounded-xl px-4' : undefined
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
        label={screen ? 'Nome de usuário' : 'Nome'}
        srOnlyLabel
        autoComplete="name"
        placeholder={screen ? 'Nome de usuário' : 'Seu nome'}
        inputClassName={input}
        error={errors.displayName?.message}
        {...form.register('displayName')}
      />
      <InputField
        label="E-mail"
        srOnlyLabel
        type="email"
        autoComplete="email"
        placeholder={screen ? 'Digite seu e-mail' : 'contato@email.com'}
        inputClassName={input}
        error={errors.email?.message}
        {...form.register('email')}
      />
      <PasswordField
        label="Senha"
        srOnlyLabel
        autoComplete="new-password"
        placeholder="Senha"
        inputClassName={input}
        error={errors.password?.message}
        {...form.register('password')}
      />
      <PasswordField
        label="Confirmar senha"
        srOnlyLabel
        autoComplete="new-password"
        placeholder="Confirmar senha"
        inputClassName={input}
        error={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button
        type="submit"
        className={screen ? 'mt-7 h-[60px] w-full rounded-xl text-body-16' : 'mt-3 h-[45px] w-full rounded-[3px]'}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Criando conta…' : screen ? 'Criar perfil' : 'Criar conta'}
      </Button>
    </form>
  )
}
