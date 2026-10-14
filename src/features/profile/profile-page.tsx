import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser } from '@/features/auth/session-query'
import { profileQueryOptions } from '@/features/profile/api'

/** Perfil do colecionador. Leitura dos dados; edição, avatar e senha entram no bloco de conta (P8). */
export function ProfilePage() {
  const user = useCurrentUser()
  // A rota é protegida; `user` só fica nulo por um instante durante o logout.
  if (!user) return null
  return <ProfileContent userId={user.id} />
}

function ProfileContent({ userId }: { userId: string }) {
  const profile = useQuery(profileQueryOptions(userId))

  return (
    <section className="container-page mt-8" aria-labelledby="perfil-titulo" aria-busy={profile.isPending}>
      <h1 id="perfil-titulo" className="text-heading-28 font-bold">
        Perfil do colecionador
      </h1>

      <div className="mt-6 bg-surface-card p-6 md:p-8">
        {profile.isPending && (
          <div className="flex flex-col gap-4">
            <span className="sr-only">Carregando perfil…</span>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[44px] w-full max-w-[480px]" />
            ))}
          </div>
        )}

        {profile.isError && (
          <div role="alert" className="flex flex-col items-start gap-3">
            <p className="text-body-14">
              <span className="font-bold text-destructive">Erro: </span>
              {profile.error.message}
            </p>
            <Button onClick={() => void profile.refetch()}>Tentar novamente</Button>
          </div>
        )}

        {profile.isSuccess && (
          <dl className="grid gap-4 text-body-14 sm:grid-cols-[160px_1fr]">
            <dt className="text-muted-foreground">Nome</dt>
            <dd className="font-bold">{profile.data.displayName}</dd>
            <dt className="text-muted-foreground">Usuário</dt>
            <dd>@{profile.data.username}</dd>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="break-all">{profile.data.email}</dd>
            <dt className="text-muted-foreground">Bio</dt>
            <dd>{profile.data.bio || 'Sem bio.'}</dd>
          </dl>
        )}
      </div>
    </section>
  )
}
