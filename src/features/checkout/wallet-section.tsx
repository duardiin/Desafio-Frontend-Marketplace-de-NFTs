import { useWatch, type UseFormReturn } from 'react-hook-form'
import radioEmpty from '@/assets/figma/radio-empty.svg'
import radioSelected from '@/assets/figma/radio-selected.svg'
import { NETWORK_LABELS } from '@/api/contracts/common'
import type { Wallet } from '@/api/contracts/wallets'
import { WALLET_PROVIDER_LABELS } from '@/api/contracts/wallets'
import { Button } from '@/components/ui/button'
import { selectWallet, type CheckoutFormValues } from '@/features/checkout/schema'
import type { useWalletConnection } from '@/features/checkout/use-checkout'
import { shortAddress } from '@/features/wallets/api'
import { cn } from '@/lib/utils'

interface WalletSectionProps {
  form: UseFormReturn<CheckoutFormValues>
  wallets: Wallet[]
  connection: ReturnType<typeof useWalletConnection>
  onConfirm: () => void
  submitting: boolean
}

/** "Carteira e rede" (Figma): opções em caixas de 45 px, conexão simulada e "Confirmar compra". */
export function WalletSection({ form, wallets, connection, onConfirm, submitting }: WalletSectionProps) {
  const walletId = useWatch({ control: form.control, name: 'walletId' })
  const network = useWatch({ control: form.control, name: 'network' })

  return (
    <section aria-labelledby="carteira-titulo" className="flex flex-col gap-5">
      <h2 id="carteira-titulo" className="text-center text-body-17 font-bold">
        Carteira e rede
      </h2>
      <p className="flex h-[26px] items-center justify-center self-center rounded-md border border-border-soft bg-surface-dark px-2 text-tiny-9 font-bold tracking-[0.1px] text-highlight">
        METAMASK • WALLETCONNECT • COINBASE
      </p>

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Carteira para o pagamento</legend>
        {wallets.map((wallet) => {
          const selected = wallet.id === walletId
          return (
            <label
              key={wallet.id}
              className={cn(
                'flex min-h-[45px] cursor-pointer items-center gap-3 rounded-[3px] border px-3 py-2 text-body-15 has-focus-visible:outline-2 has-focus-visible:outline-ring',
                selected ? 'border-primary' : 'border-border',
              )}
            >
              <input
                type="radio"
                name="carteira-pagamento"
                value={wallet.id}
                checked={selected}
                className="sr-only"
                onChange={() =>
                  selectWallet((name, value, options) => form.setValue(name, value as never, options), network, wallet)
                }
              />
              {/* O rádio selecionado do Figma vem num quadro de 39 × 16 (círculo à esquerda): recorta sem distorcer. */}
              <span aria-hidden="true" className="relative size-4 shrink-0 overflow-hidden">
                {selected ? (
                  <img src={radioSelected} alt="" width={39} height={16} className="absolute top-0 left-0 h-4 w-[39px] max-w-none" />
                ) : (
                  <img src={radioEmpty} alt="" width={16} height={16} />
                )}
              </span>
              <span className="flex min-w-0 flex-col">
                <span>
                  {WALLET_PROVIDER_LABELS[wallet.provider]} · {wallet.label}
                </span>
                <span className="text-caption-12 text-muted-foreground">
                  {shortAddress(wallet.address)} · {wallet.networks.map((item) => NETWORK_LABELS[item]).join(', ')}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>

      <WalletConnectionControl walletId={walletId} network={network} connection={connection} />

      <Button
        className="h-[45px] w-full rounded-xl text-body-15 font-bold"
        onClick={onConfirm}
        disabled={submitting}
      >
        Confirmar compra
      </Button>
    </section>
  )
}

interface WalletConnectionControlProps {
  walletId: string
  network: CheckoutFormValues['network']
  connection: ReturnType<typeof useWalletConnection>
  /** `pill`: botão em pílula (Pagamento mobile). */
  variant?: 'default' | 'pill'
}

/** Conexão simulada da carteira escolhida: "Conectar carteira", "Conectada" e erros (recusa, desconexão). */
export function WalletConnectionControl({ walletId, network, connection, variant = 'default' }: WalletConnectionControlProps) {
  const connected = connection.status === 'connected' && connection.connection
  const pill = variant === 'pill'
  return (
      <div className="flex flex-col gap-2" aria-live="polite">
        {connected ? (
          <div className={cn('flex items-center justify-between gap-3 border border-primary bg-surface-dark px-3 py-2 text-body-14', pill ? 'rounded-2xl' : 'rounded-[3px]')}>
            <span>
              <span className="font-bold text-highlight">Conectada</span> · {NETWORK_LABELS[connected.network]} ·{' '}
              {shortAddress(connected.address)}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void connection.disconnect()}>
              Desconectar
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className={cn('w-full border-primary', pill && 'h-12 rounded-full')}
            disabled={!walletId || !network || connection.status === 'connecting'}
            onClick={() => void connection.connect(walletId, network)}
          >
            {connection.status === 'connecting' ? 'Aguardando a carteira…' : 'Conectar carteira'}
          </Button>
        )}
        {connection.message && (
          <p role="alert" className="text-body-14">
            <span className="font-bold text-destructive">Carteira: </span>
            {connection.message}
          </p>
        )}
      </div>
  )
}
