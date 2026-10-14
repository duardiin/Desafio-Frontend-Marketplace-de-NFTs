import { Link } from '@tanstack/react-router'
import type { CartItem, Quote } from '@/api/contracts/cart'
import { NftImage } from '@/components/nft-image'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth'

interface CheckoutSummaryProps {
  items: CartItem[]
  quote: Quote | undefined
}

/** "Seus NFTs" (Figma): itens com total por linha e totais. Valores sempre da cotação da API. */
export function CheckoutSummary({ items, quote }: CheckoutSummaryProps) {
  return (
    <section aria-labelledby="seus-nfts-titulo" aria-busy={!quote} className="flex flex-col gap-3">
      <h2 id="seus-nfts-titulo" className="text-body-17 font-bold">
        Seus NFTs
      </h2>
      <div className="flex items-center justify-between border-b border-primary/50 pb-3 text-body-16">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map((item) => {
          const line = quote?.lines.find((entry) => entry.lineId === item.lineId)
          return (
            <li key={item.lineId} className="flex min-h-[70px] items-center gap-2 bg-surface-card py-1 pr-4 pl-1">
              <NftImage image={item.nft.image} sizes="70px" alt="" className="size-[62px] shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-16 font-bold">{item.nft.name}</p>
                <p className="text-body-14 text-subtle">Edição {item.edition.label}</p>
              </div>
              <span className="text-body-14 text-muted-foreground">
                <span className="sr-only">Quantidade: </span>(x {item.quantity})
              </span>
              <span className="min-w-[90px] text-right text-body-18 font-bold text-highlight">
                {line ? formatEth(line.lineTotalEth) : <Skeleton className="ml-auto h-5 w-[80px]" />}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="mt-2 text-center text-body-14">
        Tem um código promocional?{' '}
        <Link to="/carrinho" className="font-bold text-highlight underline-offset-4 hover:underline">
          Aplique aqui
        </Link>
      </p>

      <dl className="flex flex-col gap-3 text-body-15">
        <Row label="Subtotal" value={quote && formatEth(quote.subtotalEth)} large />
        <Row
          label={quote?.coupon ? `Desconto (${quote.coupon.code})` : 'Desconto do lançamento'}
          value={quote && `(-) ${formatEth(quote.discountEth, { unit: false })}`}
        />
        <Row label="Taxa de rede" value={quote && formatEth(quote.networkFeeEth)} large />
      </dl>
      <p className="text-center text-caption-12 text-highlight">Taxa estimada</p>
      <div className="flex items-center justify-between border-t border-primary/50 pt-3 font-bold">
        <span className="text-body-16">Total</span>
        <span className="text-body-18 text-highlight">
          {quote ? formatEth(quote.totalEth) : <Skeleton className="h-5 w-[110px]" />}
        </span>
      </div>
    </section>
  )
}

function Row({ label, value, large = false }: { label: string; value: string | undefined; large?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt>{label}</dt>
      <dd className={large ? 'text-body-18' : undefined}>{value ?? <Skeleton className="h-5 w-[90px]" />}</dd>
    </div>
  )
}
