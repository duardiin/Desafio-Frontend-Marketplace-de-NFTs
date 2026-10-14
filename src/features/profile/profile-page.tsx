import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { ENS_SUFFIXES, type Profile } from '@/api/contracts/profile'
import ensArrow from '@/assets/figma/ens-arrow-down.svg'
import { FormAlert } from '@/components/form/form-alert'
import { CONTROL, FieldShell, InputField, PasswordField } from '@/components/form/outlined-fields'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountLayout } from '@/features/account/account-layout'
import { useCurrentUser } from '@/features/auth/session-query'
import { notify } from '@/features/feedback/notifications'
import { profileQueryOptions, useChangePassword, useUpdateProfile } from '@/features/profile/api'
import { AvatarField } from '@/features/profile/avatar-field'
import { profileFormValues, profileSchema, type ProfileFormValues } from '@/features/profile/schema'
import { applyApiErrors } from '@/lib/form-errors'
import { cn } from '@/lib/utils'

/** Perfil do colecionador (Figma 9:1238): dados, avatar e troca de senha. */
export function ProfilePage() {
  const user = useCurrentUser()
  // A rota é protegida; `user` só fica nulo por um instante durante o logout.
  if (!user) return null
  return (
    <AccountLayout active="perfil">
      <ProfileContent userId={user.id} />
    </AccountLayout>
  )
}

function ProfileContent({ userId }: { userId: string }) {
  const profile = useQuery(profileQueryOptions(userId))

  return (
    <section className="flex flex-col gap-8" aria-labelledby="perfil-titulo" aria-busy={profile.isPending}>
      <h1 id="perfil-titulo" className="text-body-16 leading-4 font-bold">
        Perfil do colecionador
      </h1>

      {profile.isPending && <ProfileSkeleton />}

      {profile.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-6">
          <p className="text-body-14">
            <span className="font-bold text-destructive">Erro: </span>
            {profile.error.message}
          </p>
          <Button onClick={() => void profile.refetch()}>Tentar novamente</Button>
        </div>
      )}

      {profile.isSuccess && <ProfileForm userId={userId} profile={profile.data} />}
    </section>
  )
}

function ProfileSkeleton() {
  return (
    <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
      <span className="sr-only">Carregando perfil…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex flex-col gap-2.5">
          <Skeleton className="h-[15px] w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

const PROFILE_FIELDS = ['displayName', 'username', 'email', 'walletNickname'] as const

function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profileFormValues(profile),
  })
  const updateProfile = useUpdateProfile(userId)
  const changePassword = useChangePassword()
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (values) => {
    const ensName = `${values.ensLabel}.${values.ensSuffix}`
    const profileChanged =
      values.displayName !== profile.displayName ||
      values.username !== profile.username ||
      values.email !== profile.email ||
      ensName !== profile.ensName ||
      values.walletNickname !== profile.walletNickname
    const passwordRequested = Boolean(values.newPassword)

    if (!profileChanged && !passwordRequested) {
      notify('Nada para salvar: nenhum dado foi alterado.', 'info')
      return
    }

    let saved = profile
    if (profileChanged) {
      try {
        saved = await updateProfile.mutateAsync({
          displayName: values.displayName,
          username: values.username,
          email: values.email,
          ensName,
          walletNickname: values.walletNickname,
        })
      } catch (error) {
        // A API valida `ensName`; no formulário, o campo é `ensLabel`.
        applyApiErrors(error, form.setError, PROFILE_FIELDS, { ensName: 'ensLabel' })
        return
      }
    }

    if (passwordRequested) {
      try {
        await changePassword.mutateAsync({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      } catch (error) {
        // Os dados (se alterados) já foram salvos; só a senha falhou.
        applyApiErrors(error, form.setError, ['currentPassword', 'newPassword'])
        if (profileChanged) notify('Dados do perfil salvos. A senha não foi alterada.', 'info')
        return
      }
    }

    form.reset(profileFormValues(saved))
    notify(
      profileChanged && passwordRequested
        ? 'Perfil e senha atualizados.'
        : passwordRequested
          ? 'Senha alterada.'
          : 'Perfil atualizado.',
      'success',
    )
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-8">
      <FormAlert message={errors.root?.server?.message} />

      <div className="grid gap-x-7 gap-y-6 md:grid-cols-2">
        <InputField
          label="Nome de exibição"
          required
          autoComplete="name"
          className="gap-2.5"
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <InputField
          label="Nome de usuário"
          required
          autoComplete="username"
          className="gap-2.5"
          error={errors.username?.message}
          {...form.register('username')}
        />
        <InputField
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          className="gap-2.5"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <EnsField form={form} />
        <InputField
          label="Apelido da carteira"
          required
          className="gap-2.5"
          error={errors.walletNickname?.message}
          {...form.register('walletNickname')}
        />
        <AvatarField userId={userId} avatarUrl={profile.avatarUrl} />
      </div>

      <fieldset className="flex flex-col gap-6 md:max-w-[calc(50%-14px)]">
        <legend className="mb-6 text-body-16 leading-4 font-medium">Alterar senha</legend>
        <PasswordField
          label="Senha atual"
          autoComplete="current-password"
          className="gap-3"
          error={errors.currentPassword?.message}
          {...form.register('currentPassword')}
        />
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          className="gap-3"
          hint="Mínimo de 8 caracteres, com letras e números."
          error={errors.newPassword?.message}
          {...form.register('newPassword')}
        />
        <PasswordField
          label="Confirmar nova senha"
          autoComplete="new-password"
          className="gap-3"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
      </fieldset>

      <Button type="submit" className="h-10 w-[131px] rounded-[3px] text-body-14" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  )
}

/** "Nome ENS" (Figma): seletor de domínio de 78 px + campo do nome, gap 10. */
function EnsField({ form }: { form: UseFormReturn<ProfileFormValues> }) {
  const error = form.formState.errors.ensLabel?.message
  return (
    <FieldShell label="Nome ENS" required error={error} className="gap-2.5">
      {({ id, describedBy }) => (
        <div className="flex gap-2.5">
          <div className="relative w-[78px] shrink-0">
            <select
              aria-label="Domínio ENS"
              className={cn(CONTROL, 'cursor-pointer appearance-none pr-7 pl-2.5')}
              {...form.register('ensSuffix')}
            >
              {ENS_SUFFIXES.map((suffix) => (
                <option key={suffix} value={suffix} className="bg-surface-card">
                  .{suffix}
                </option>
              ))}
            </select>
            <img
              src={ensArrow}
              alt=""
              width={20}
              height={20}
              className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
            />
          </div>
          <input
            id={id}
            aria-required
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            autoCapitalize="none"
            spellCheck={false}
            className={cn(CONTROL, 'min-w-0')}
            {...form.register('ensLabel')}
          />
        </div>
      )}
    </FieldShell>
  )
}
