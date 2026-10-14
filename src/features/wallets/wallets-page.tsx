import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { toApiError } from '@/api/api-error'
import { WALLET_PROVIDER_LABELS, type Wallet, type WalletRole } from '@/api/contracts/wallets'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AccountLayout } from '@/features/account/account-layout'
import { useCurrentUser } from '@/features/auth/session-query'
import { notify } from '@/features/feedback/notifications'
import { useUpdateWallet, walletsQueryOptions } from '@/features/wallets/api'
import { ROLE_LABELS } from '@/features/wallets/schema'
import { WalletFormDialog } from '@/features/wallets/wallet-form-dialog'

/** Carteiras do colecionador (principal e secundária). Mesmo padrão visual do Perfil. */
export function WalletsPage() {
  const user = useCurrentUser()
  if (!user) return null
  return (
    <AccountLayout active="carteiras">
      <WalletsContent userId={user.id} />
    </AccountLayout>
  )
}

type Editing = { kind: 'closed' } | { kind: 'create' } | { kind: 'edit'; wallet: Wallet }

function WalletsContent({ userId }: { userId: string }) {
  const wallets = useQuery(walletsQueryOptions(userId))
  const [editing, setEditing] = useState<Editing>({ kind: 'closed' })
  const items = wallets.data?.items ?? []
  const usedRoles = new Set(items.map((wallet) => wallet.role))
  const freeRole: WalletRole = usedRoles.has('principal') ? 'secundaria' : 'principal'
  const atLimit = usedRoles.has('principal') && usedRoles.has('secundaria')

  return (
    <section className="flex flex-col gap-8" aria-labelledby="carteiras-titulo" aria-busy={wallets.isPending}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 id="carteiras-titulo" className="text-body-16 leading-4 font-bold">
          Carteiras
        </h1>
        {wallets.isSuccess && (
          <Button
            className="h-10 rounded-[3px] text-body-14"
            disabled={atLimit}
            aria-describedby={atLimit ? 'carteiras-limite' : undefined}
            onClick={() => setEditing({ kind: 'create' })}
          >
            Adicionar carteira
          </Button>
        )}
      </div>

      {atLimit && (
        <p id="carteiras-limite" className="-mt-4 text-body-14 text-muted-foreground">
          Você já tem uma carteira principal e uma secundária. Edite uma delas para trocar.
        </p>
      )}

      {wallets.isPending && (
        <div className="flex flex-col gap-4">
          <span className="sr-only">Carregando carteiras…</span>
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-[116px] w-full" />
          ))}
        </div>
      )}

      {wallets.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 bg-surface-card p-6">
          <p className="text-body-14">
            <span className="font-bold text-destructive">Erro: </span>
            {wallets.error.message}
          </p>
          <Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>
        </div>
      )}

      {wallets.isSuccess && items.length === 0 && (
        <div className="flex flex-col items-start gap-2 bg-surface-card p-6">
          <p className="text-body-16 font-bold">Nenhuma carteira cadastrada.</p>
          <p className="text-body-14 text-muted-foreground">Cadastre uma carteira principal para pagar seus pedidos.</p>
        </div>
      )}

      {items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((wallet) => (
            <li key={wallet.id}>
              <WalletCard
                userId={userId}
                wallet={wallet}
                canPromote={wallet.role === 'secundaria'}
                onEdit={() => setEditing({ kind: 'edit', wallet })}
              />
            </li>
          ))}
        </ul>
      )}

      {editing.kind !== 'closed' && (
        <WalletFormDialog
          userId={userId}
          wallet={editing.kind === 'edit' ? editing.wallet : undefined}
          freeRole={freeRole}
          hasOtherWallet={items.length > 1}
          onClose={() => setEditing({ kind: 'closed' })}
        />
      )}
    </section>
  )
}

interface WalletCardProps {
  userId: string
  wallet: Wallet
  canPromote: boolean
  onEdit: () => void
}

function WalletCard({ userId, wallet, canPromote, onEdit }: WalletCardProps) {
  const update = useUpdateWallet(userId)
  const titleId = `carteira-${wallet.id}`

  async function promote() {
    try {
      await update.mutateAsync({ id: wallet.id, role: 'principal' })
      notify(`"${wallet.label}" agora é a carteira principal.`, 'success')
    } catch (error) {
      notify(toApiError(error).message, 'error')
    }
  }

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-4 rounded-[3px] border border-border bg-surface-card p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex flex-wrap items-center gap-2">
          <span
            className={
              wallet.role === 'principal'
                ? 'rounded-full bg-primary px-2 py-0.5 text-caption-12 font-bold text-ink'
                : 'rounded-full border border-primary px-2 py-0.5 text-caption-12 font-medium text-highlight'
            }
          >
            {ROLE_LABELS[wallet.role]}
          </span>
          <span id={titleId} className="text-body-16 font-bold">
            {wallet.label}
          </span>
        </p>
        <p className="text-body-14 text-muted-foreground">
          {WALLET_PROVIDER_LABELS[wallet.provider]} · {wallet.networks.map((network) => NETWORK_LABELS[network]).join(', ')}
        </p>
        <p className="text-body-14 break-all">{wallet.address}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-3">
        {canPromote && (
          <Button variant="outline" className="h-10 rounded-[3px] border-primary text-body-14" disabled={update.isPending} onClick={() => void promote()}>
            {update.isPending ? 'Salvando…' : 'Tornar principal'}
            <span className="sr-only">: {wallet.label}</span>
          </Button>
        )}
        <Button className="h-10 rounded-[3px] text-body-14" onClick={onEdit}>
          Editar
          <span className="sr-only"> {wallet.label}</span>
        </Button>
      </div>
    </article>
  )
}
