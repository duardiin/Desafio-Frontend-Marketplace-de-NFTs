import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'
import type { CartItem, Quote } from '@/api/contracts/cart'
import { NftImage } from '@/components/nft-image'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/use-cart'
import { QuantityStepper } from '@/features/nft/purchase-options'
import { formatEth, sameEth } from '@/lib/eth'

interface CartLineProps {
  item: CartItem
  /** Linha correspondente da cotação (total da linha calculado pela API). */
  quoteLine: Quote['lines'][number] | undefined
  blocker: Quote['blockers'][number] | undefined
}

/** Linha do carrinho: arte, nome, edição, preço, quantidade (limitada pela edição), total e remover. */
export function CartLine({ item, quoteLine, blocker }: CartLineProps) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const busy = update.isPending || remove.isPending
  const priceChanged = !sameEth(item.priceWhenAddedEth, item.nft.priceEth)

  return (
    <li className="flex gap-4 border-b border-border py-5 first:pt-0" aria-busy={busy}>
      <Link to="/nft/$id" params={{ id: item.nft.id }} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <NftImage image={item.nft.image} sizes="120px" alt="" className="size-20 rounded-xl object-cover sm:size-[120px]" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-body-16 font-bold">
              <Link to="/nft/$id" params={{ id: item.nft.id }} search={{ edicao: item.edition.id }} className="hover:text-highlight">
                {item.nft.name}
              </Link>
            </h3>
            <p className="text-body-14 text-muted-foreground">
              Edição {item.edition.label} · {formatEth(item.nft.priceEth)} cada
            </p>
          </div>
          <p className="text-body-18 font-bold text-highlight">
            <span className="sr-only">Total da linha: </span>
            {quoteLine ? formatEth(quoteLine.lineTotalEth) : '—'}
          </p>
        </div>

        {priceChanged && (
          <p className="rounded-md border border-border-soft bg-surface-dark px-3 py-2 text-caption-12">
            <span className="font-bold text-highlight">Preço atualizado: </span>
            era {formatEth(item.priceWhenAddedEth)} quando você adicionou, agora é {formatEth(item.nft.priceEth)}.
          </p>
        )}
        {blocker && (
          <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-caption-12">
            <span className="font-bold text-destructive">Indisponível: </span>
            {blocker.reason === 'EDITION_SOLD_OUT'
              ? 'esta edição esgotou. Remova o item para continuar.'
              : `restam apenas ${item.maxQuantity} unidade(s) que você pode levar. Ajuste a quantidade.`}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          <QuantityStepper
            value={item.quantity}
            max={Math.max(item.maxQuantity, 1)}
            itemName={item.nft.name}
            disabled={busy}
            onChange={(quantity) => update.mutate({ lineId: item.lineId, quantity })}
          />
          <button
            type="button"
            onClick={() => remove.mutate({ lineId: item.lineId, name: item.nft.name })}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-body-14 text-muted-foreground hover:text-destructive disabled:opacity-50"
          >
            <Trash2Icon className="size-4" aria-hidden="true" />
            Remover<span className="sr-only"> {item.nft.name} do carrinho</span>
          </button>
        </div>
      </div>
    </li>
  )
}
