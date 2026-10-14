import { useNavigate } from '@tanstack/react-router'
import Decimal from 'decimal.js'
import { CheckIcon } from 'lucide-react'
import { useState } from 'react'
import type { FacetCount, NftListFacets } from '@/api/contracts/nfts'
import { COLLECTION_LABELS } from '@/api/contracts/nfts'
import { NETWORK_LABELS } from '@/api/contracts/common'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  selectedCollections,
  selectedNetworks,
  toggleInList,
  withFilter,
  type CatalogSearch,
} from '@/features/catalog/search-params'
import { formatEth } from '@/lib/eth'
import { cn } from '@/lib/utils'

interface FiltersPanelProps {
  search: CatalogSearch
  facets: NftListFacets | undefined
  className?: string
}

/** Painel de filtros do Figma (310 px, `surface-card`): coleções, faixa de preço e rede. Combináveis. */
export function FiltersPanel({ search, facets, className }: FiltersPanelProps) {
  const navigate = useNavigate()
  const apply = (patch: Partial<CatalogSearch>) =>
    void navigate({ to: '/', search: withFilter(search, patch), resetScroll: false })

  const collections = selectedCollections(search)
  const networks = selectedNetworks(search)

  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card p-5', className)}>
      <FilterGroup
        title="Coleções"
        options={facets?.collections ?? []}
        labels={COLLECTION_LABELS}
        selected={collections}
        onToggle={(value) => apply({ colecao: toggleInList(search.colecao, value) })}
      />
      {facets && (
        <PriceRange
          // Recria o estado local quando a URL muda (voltar/avançar).
          key={`${search.precoMin ?? ''}-${search.precoMax ?? ''}`}
          bounds={facets.priceRange}
          min={search.precoMin}
          max={search.precoMax}
          onApply={(precoMin, precoMax) => apply({ precoMin, precoMax })}
        />
      )}
      <FilterGroup
        title="Rede"
        options={facets?.networks ?? []}
        labels={NETWORK_LABELS}
        selected={networks}
        onToggle={(value) => apply({ rede: toggleInList(search.rede, value) })}
      />
    </div>
  )
}

interface FilterGroupProps<T extends string> {
  title: string
  options: FacetCount<T>[]
  labels: Record<T, string>
  selected: T[]
  onToggle: (value: T) => void
}

/** Lista de checkboxes (múltipla escolha). Selecionado: cor, peso e ícone, não só cor. */
function FilterGroup<T extends string>({ title, options, labels, selected, onToggle }: FilterGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-body-18 font-bold">{title}</legend>
      <ul className="flex flex-col">
        {options.map((option) => {
          const checked = selected.includes(option.value)
          return (
            <li key={option.value}>
              <label
                className={cn(
                  'flex h-10 cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-body-15 has-focus-visible:outline-2 has-focus-visible:outline-ring',
                  checked ? 'font-bold text-highlight' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => onToggle(option.value)}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-4 place-items-center rounded-xs border',
                      checked ? 'border-highlight bg-highlight text-ink' : 'border-border-soft',
                    )}
                  >
                    {checked && <CheckIcon className="size-3" strokeWidth={3} />}
                  </span>
                  {labels[option.value]}
                </span>
                <span className="font-bold">({option.count})</span>
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

interface PriceRangeProps {
  bounds: NftListFacets['priceRange']
  min: string | undefined
  max: string | undefined
  onApply: (min: string | undefined, max: string | undefined) => void
}

/** Faixa de preço com duas pontas e "Aplicar" (Figma). O slider só posiciona; os valores seguem decimais. */
function PriceRange({ bounds, min, max, onApply }: PriceRangeProps) {
  const lower = new Decimal(bounds.min)
  const upper = new Decimal(bounds.max)
  const [range, setRange] = useState<[number, number]>([
    new Decimal(min ?? lower).toNumber(),
    new Decimal(max ?? upper).toNumber(),
  ])
  const [from, to] = range.map((value) => new Decimal(value).toDecimalPlaces(2).toFixed(2))

  function handleApply() {
    // Faixa inteira = sem filtro (URL limpa).
    onApply(new Decimal(from).lte(lower) ? undefined : from, new Decimal(to).gte(upper) ? undefined : to)
  }

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-2 text-body-18 font-bold">Faixa de preço</legend>
      <Slider
        min={lower.toNumber()}
        max={upper.toNumber()}
        step={0.01}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(value) => setRange([value[0], value[1]])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        className="px-1"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-body-15" aria-live="polite">
          Preço: {formatEth(from, { unit: false })} - {formatEth(to)}
        </p>
        <Button size="sm" className="h-9 px-3 text-body-14" onClick={handleApply}>
          Aplicar
        </Button>
      </div>
    </fieldset>
  )
}
