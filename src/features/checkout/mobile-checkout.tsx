import { Link } from '@tanstack/react-router'
import { ChevronDownIcon, EllipsisVerticalIcon, WalletIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { NETWORK_LABELS } from '@/api/contracts/common'
import type { Quote } from '@/api/contracts/cart'
import type { Wallet, WalletProvider } from '@/api/contracts/wallets'
import { WALLET_PROVIDER_LABELS } from '@/api/contracts/wallets'
import radioEmpty from '@/assets/figma/radio-empty.svg'
import radioSelected from '@/assets/figma/radio-selected.svg'
import { selectWallet, type CheckoutFormValues } from '@/features/checkout/schema'
import { MobileActionBar } from '@/features/layout/mobile-screen'
import { shortAddress } from '@/features/wallets/api'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

const CARD = 'rounded-2xl bg-surface-card'

/** Rádio do Figma (16 px). O selecionado vem num quadro de 39 × 16: recorta sem distorcer. */
function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span aria-hidden="true" className="relative size-4 shrink-0 overflow-hidden">
      {selected ? (
        <img src={radioSelected} alt="" width={39} height={16} className="absolute top-0 left-0 h-4 w-[39px] max-w-none" />
      ) : (
        <img src={radioEmpty} alt="" width={16} height={16} />
      )}
    </span>
  )
}

function useSetter(form: UseFormReturn<CheckoutFormValues>) {
  return (name: 'walletId' | 'network', value: string, options?: { shouldValidate?: boolean }) =>
    form.setValue(name, value as never, options)
}

/**
 * "Carteira conectada" (Figma 16:748): as carteiras cadastradas em cartões
 * selecionáveis (rótulo, endereço e rede), com "⋮" para editar e "Trocar
 * carteira" levando às Carteiras. Na carteira escolhida, a rede vira chips.
 */
export function MobileWalletPicker({ form, wallets }: { form: UseFormReturn<CheckoutFormValues>; wallets: Wallet[] }) {
  const walletId = useWatch({ control: form.control, name: 'walletId' })
  const network = useWatch({ control: form.control, name: 'network' })
  const setValue = useSetter(form)

  return (
    <section aria-labelledby="carteira-conectada-titulo" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="carteira-conectada-titulo" className="text-body-17 font-bold">
          Carteira conectada
        </h2>
        {/* O rascunho do pagamento fica salvo: ao voltar das carteiras, o formulário é restaurado. */}
        <Link to="/carteiras" className="rounded-sm text-body-15 font-bold text-highlight outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Trocar carteira
        </Link>
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Carteira para o pagamento</legend>
        {wallets.map((wallet) => {
          const selected = wallet.id === walletId
          const shownNetwork = selected ? network : wallet.networks[0]
          return (
            <div key={wallet.id} className={cn(CARD, 'relative', selected && 'ring-1 ring-primary')}>
              <label className="flex cursor-pointer items-start gap-4 rounded-2xl p-4 pr-12 has-focus-visible:outline-2 has-focus-visible:outline-ring">
                <input
                  type="radio"
                  name="carteira-pagamento-mobile"
                  value={wallet.id}
                  checked={selected}
                  className="sr-only"
                  onChange={() => selectWallet(setValue, network, wallet)}
                />
                <span className="mt-1 flex">
                  <RadioMark selected={selected} />
                </span>
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-body-16 font-bold">{wallet.label}</span>
                  <span className="truncate text-body-14 text-muted-foreground">
                    {WALLET_PROVIDER_LABELS[wallet.provider]} · {shortAddress(wallet.address)}
                  </span>
                  <span className="text-body-14 text-muted-foreground">
                    Rede {shownNetwork ? NETWORK_LABELS[shownNetwork] : '—'}
                    {wallet.role === 'principal' && ' · principal'}
                  </span>
                </span>
              </label>
              <Link
                to="/carteiras"
                aria-label={`Editar a carteira ${wallet.label}`}
                className="absolute top-4 right-3 grid size-8 place-items-center rounded-full text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <EllipsisVerticalIcon className="size-5" aria-hidden="true" />
              </Link>

              {selected && wallet.networks.length > 1 && (
                <fieldset className="flex flex-wrap items-center gap-2 px-4 pb-4 pl-12">
                  <legend className="sr-only">Rede de {wallet.label}</legend>
                  {wallet.networks.map((item) => (
                    <label
                      key={item}
                      className={cn(
                        'cursor-pointer rounded-full border px-3 py-1 text-caption-13 has-focus-visible:outline-2 has-focus-visible:outline-ring',
                        item === network ? 'border-primary text-highlight' : 'border-border text-muted-foreground',
                      )}
                    >
                      <input
                        type="radio"
                        name="rede-pagamento-mobile"
                        value={item}
                        checked={item === network}
                        className="sr-only"
                        onChange={() => setValue('network', item, { shouldValidate: true })}
                      />
                      {NETWORK_LABELS[item]}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          )
        })}
      </fieldset>
    </section>
  )
}

const PROVIDER_BADGES: Record<WalletProvider, ReactNode> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: <WalletIcon className="size-5" strokeWidth={1.75} aria-hidden="true" />,
}

/** Ordem do frame. */
const PROVIDER_ORDER: WalletProvider[] = ['walletconnect', 'metamask', 'coinbase']

const PROVIDER_NAMES: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

/**
 * "Carteira e rede" (Figma 16:748): os três provedores. No modelo da API, o
 * provedor é da carteira: a opção marcada é a da carteira escolhida, e escolher
 * outra seleciona a carteira daquele provedor. Sem carteira dele, fica indisponível.
 */
export function MobileProviderPicker({ form, wallets }: { form: UseFormReturn<CheckoutFormValues>; wallets: Wallet[] }) {
  const walletId = useWatch({ control: form.control, name: 'walletId' })
  const network = useWatch({ control: form.control, name: 'network' })
  const setValue = useSetter(form)
  const current = wallets.find((item) => item.id === walletId)

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-4 text-body-17 font-bold">Carteira e rede</legend>
      {PROVIDER_ORDER.map((provider) => {
        const target = wallets.find((item) => item.provider === provider)
        const selected = current?.provider === provider
        return (
          <label
            key={provider}
            className={cn(
              CARD,
              'flex min-h-16 items-center gap-4 px-3.5 py-3 has-focus-visible:outline-2 has-focus-visible:outline-ring',
              target ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
            )}
          >
            <input
              type="radio"
              name="provedor-pagamento-mobile"
              value={provider}
              checked={selected}
              disabled={!target}
              className="sr-only"
              onChange={() => selectWallet(setValue, network, target)}
            />
            <span
              aria-hidden="true"
              className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface-raised text-body-15 font-bold text-primary"
            >
              {PROVIDER_BADGES[provider]}
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-body-15">{PROVIDER_NAMES[provider]}</span>
              {!target && (
                <span className="text-caption-12 text-muted-foreground">
                  Nenhuma carteira {PROVIDER_NAMES[provider]}.{' '}
                  <Link to="/carteiras" className="font-bold text-highlight underline">
                    Cadastre em Carteiras
                  </Link>
                </span>
              )}
            </span>
            <RadioMark selected={selected} />
          </label>
        )
      })}
    </fieldset>
  )
}

/**
 * Seção recolhível para o que o enunciado exige e o frame mobile não mostra
 * (dados do colecionador e itens do pedido). Abre sozinha quando há erro.
 */
export function MobileCollapsible({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string
  summary?: string
  open: boolean
  onToggle: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <details open={open} onToggle={(event) => onToggle(event.currentTarget.open)} className={cn(CARD, 'group')}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <span className="flex flex-col">
          <span className="text-body-15 font-bold">{title}</span>
          {summary && <span className="text-caption-12 text-muted-foreground">{summary}</span>}
        </span>
        <ChevronDownIcon className="size-5 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  )
}

/** Total (da cotação) e "Confirmar compra" fixos embaixo (Figma 16:748). */
export function MobileCheckoutBar({ quote, submitting, onConfirm }: { quote: Quote | undefined; submitting: boolean; onConfirm: () => void }) {
  return (
    <MobileActionBar className="rounded-none bg-ink/95 pt-4 shadow-none backdrop-blur-sm">
      <p className="flex items-baseline justify-end gap-6">
        <span className="text-body-16 font-bold">Total:</span>
        <span className="text-[20px] leading-7 font-bold text-highlight">{quote ? formatEth(quote.totalEth) : '—'}</span>
      </p>
      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="bg-cta-gradient mt-4 h-[60px] w-full rounded-full text-body-16 font-bold text-ink outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
      >
        Confirmar compra
      </button>
    </MobileActionBar>
  )
}
