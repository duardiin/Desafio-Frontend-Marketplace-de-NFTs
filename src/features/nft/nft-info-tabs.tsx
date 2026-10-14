import type { NftDetail } from '@/api/contracts/nfts'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Rating } from '@/features/nft/rating'

const DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

/** Abas "Detalhes do NFT" e "Avaliações de colecionadores" (Figma), com Radix Tabs (setas do teclado). */
export function NftInfoTabs({ nft }: { nft: NftDetail }) {
  const shortAddress = `${nft.contractAddress.slice(0, 6)}...${nft.contractAddress.slice(-4)}`

  return (
    <Tabs defaultValue="detalhes" className="gap-6">
      <div className="border-b border-primary/50">
        <TabsList variant="line" className="h-auto flex-wrap justify-start gap-x-8 gap-y-3 p-0">
          <TabsTrigger value="detalhes" className="flex-none px-0 pb-3 text-body-17">
            Detalhes do NFT
          </TabsTrigger>
          <TabsTrigger value="avaliacoes" className="flex-none px-0 pb-3 text-body-17">
            Avaliações de colecionadores ({nft.rating.count})
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="detalhes" className="flex flex-col gap-6 text-body-14 leading-6 text-muted-foreground">
        <div className="flex flex-col gap-6">
          {nft.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="font-bold text-foreground">Rede:</dt>
            <dd>
              Cunhado na {NETWORK_LABELS[nft.network]} com procedência imutável e metadados armazenados no IPFS.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Contrato:</dt>
            <dd>
              <span title={nft.contractAddress}>{shortAddress}</span> • Contrato inteligente {nft.tokenStandard} verificado.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-foreground">Direitos autorais:</dt>
            <dd>
              Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos automaticamente pelos
              mercados compatíveis.
            </dd>
          </div>
        </dl>
      </TabsContent>

      <TabsContent value="avaliacoes" className="flex flex-col gap-4">
        <Rating average={nft.rating.average} count={nft.rating.count} />
        <ul className="flex flex-col gap-3">
          {nft.reviews.map((review) => (
            <li key={review.id} className="rounded-xl bg-surface-card p-4">
              <p className="text-body-14 font-bold">
                {review.author} · <span className="font-normal text-muted-foreground">{review.rating} de 5</span>
              </p>
              <p className="mt-1 text-body-14 leading-6 text-muted-foreground">{review.comment}</p>
              <p className="mt-1 text-caption-12 text-subtle">{DATE.format(new Date(review.createdAt))}</p>
            </li>
          ))}
        </ul>
        <p className="text-caption-12 text-muted-foreground">
          Mostrando as {nft.reviews.length} avaliações mais recentes de {nft.rating.count}.
        </p>
      </TabsContent>
    </Tabs>
  )
}
