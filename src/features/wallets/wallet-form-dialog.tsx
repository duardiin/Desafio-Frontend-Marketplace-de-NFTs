import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { NETWORK_LABELS, NETWORKS, type Network } from '@/api/contracts/common'
import { WALLET_PROVIDER_LABELS, WALLET_PROVIDERS, type Wallet, type WalletRole } from '@/api/contracts/wallets'
import radioEmpty from '@/assets/figma/radio-empty.svg'
import radioSelected from '@/assets/figma/radio-selected.svg'
import { FormAlert } from '@/components/form/form-alert'
import { InputField, SelectField } from '@/components/form/outlined-fields'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { notify } from '@/features/feedback/notifications'
import { useCreateWallet, useUpdateWallet } from '@/features/wallets/api'
import { ROLE_LABELS, walletFormValues, walletSchema, type WalletFormValues } from '@/features/wallets/schema'
import { applyApiErrors } from '@/lib/form-errors'
import { cn } from '@/lib/utils'

interface WalletFormDialogProps {
  userId: string
  /** Carteira em edição; ausente = cadastro. */
  wallet?: Wallet
  /** Papel livre para um cadastro (a API permite uma principal e uma secundária). */
  freeRole: WalletRole
  hasOtherWallet: boolean
  onClose: () => void
}

const FIELDS = ['label', 'provider', 'networks', 'address', 'role'] as const
const OPTION =
  'flex min-h-[45px] cursor-pointer items-center gap-3 rounded-[3px] border px-3 py-2 text-body-15 has-focus-visible:outline-2 has-focus-visible:outline-ring'

/** Cadastro e edição de carteira. Estado não desenhado: segue os campos do Pagamento. */
export function WalletFormDialog({ userId, wallet, freeRole, hasOtherWallet, onClose }: WalletFormDialogProps) {
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: walletFormValues(wallet, freeRole),
  })
  const create = useCreateWallet(userId)
  const update = useUpdateWallet(userId)
  const { errors, isSubmitting } = form.formState
  const networks = useWatch({ control: form.control, name: 'networks' })
  const role = useWatch({ control: form.control, name: 'role' })
  const networksErrorId = useId()
  const isSolana = networks.includes('solana')

  const onSubmit = form.handleSubmit(async (values) => {
    // O schema garante o provedor; o `if` só estreita o tipo.
    if (!values.provider) return
    const body = { ...values, provider: values.provider }
    try {
      if (wallet) {
        await update.mutateAsync({ id: wallet.id, ...body })
        notify(
          values.role !== wallet.role && hasOtherWallet
            ? `Carteira "${values.label}" salva como ${ROLE_LABELS[values.role].toLowerCase()}. A outra carteira trocou de papel.`
            : `Carteira "${values.label}" atualizada.`,
          'success',
        )
      } else {
        await create.mutateAsync(body)
        notify(`Carteira "${values.label}" cadastrada.`, 'success')
      }
      onClose()
    } catch (error) {
      applyApiErrors(error, form.setError, FIELDS)
    }
  })

  function toggleNetwork(network: Network, checked: boolean) {
    const next = checked ? [...networks, network] : networks.filter((item) => item !== network)
    form.setValue('networks', NETWORKS.filter((item) => next.includes(item)), {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto bg-surface-card p-6 sm:max-w-[520px]">
        <DialogTitle>{wallet ? 'Editar carteira' : 'Adicionar carteira'}</DialogTitle>
        <DialogDescription>
          Você pode ter uma carteira principal e uma secundária. Os campos com * são obrigatórios.
        </DialogDescription>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <FormAlert message={errors.root?.server?.message} />

          <InputField label="Rótulo" required className="gap-2" error={errors.label?.message} {...form.register('label')} />
          <SelectField
            label="Provedor"
            required
            className="gap-2"
            placeholder="Selecione o provedor"
            options={WALLET_PROVIDERS.map((provider) => ({ value: provider, label: WALLET_PROVIDER_LABELS[provider] }))}
            error={errors.provider?.message}
            {...form.register('provider')}
          />

          <fieldset
            className="flex flex-col gap-2"
            aria-invalid={errors.networks ? true : undefined}
            aria-describedby={errors.networks ? networksErrorId : undefined}
          >
            <legend className="mb-2 flex items-center text-body-15">
              Redes
              <span aria-hidden="true" className="text-[22px] leading-[29px] text-coral">
                *
              </span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {NETWORKS.map((network) => {
                const checked = networks.includes(network)
                return (
                  <label key={network} className={cn(OPTION, checked ? 'border-primary' : 'border-border')}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleNetwork(network, event.target.checked)}
                      className="size-4 accent-primary"
                    />
                    {NETWORK_LABELS[network]}
                  </label>
                )
              })}
            </div>
            {errors.networks && (
              <p id={networksErrorId} className="text-caption-12 font-medium text-destructive">
                {errors.networks.message}
              </p>
            )}
          </fieldset>

          <InputField
            label="Endereço"
            required
            className="gap-2"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={isSolana ? 'Endereço Solana (base58)' : 'Endereço 0x da carteira'}
            error={errors.address?.message}
            {...form.register('address')}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-body-15">Papel</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(['principal', 'secundaria'] as const).map((option) => {
                const selected = role === option
                return (
                  <label key={option} className={cn(OPTION, selected ? 'border-primary' : 'border-border')}>
                    <input type="radio" value={option} className="sr-only" {...form.register('role')} />
                    {/* O rádio selecionado do Figma vem num quadro de 39 × 16 (círculo à esquerda). */}
                    <span aria-hidden="true" className="relative size-4 shrink-0 overflow-hidden">
                      {selected ? (
                        <img src={radioSelected} alt="" width={39} height={16} className="absolute top-0 left-0 h-4 w-[39px] max-w-none" />
                      ) : (
                        <img src={radioEmpty} alt="" width={16} height={16} />
                      )}
                    </span>
                    {ROLE_LABELS[option]}
                  </label>
                )
              })}
            </div>
            {wallet && hasOtherWallet && role !== wallet.role && (
              <p className="text-caption-12 text-muted-foreground">
                Ao salvar, a outra carteira passa a ser {ROLE_LABELS[wallet.role].toLowerCase()}.
              </p>
            )}
            {errors.role && <p className="text-caption-12 font-medium text-destructive">{errors.role.message}</p>}
          </fieldset>

          <div className="mt-2 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[3px]" disabled={isSubmitting} onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="rounded-[3px]" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando…' : wallet ? 'Salvar carteira' : 'Adicionar carteira'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
