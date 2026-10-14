import { Link, useNavigate } from '@tanstack/react-router'
import { useId } from 'react'
import type { CatalogSort, CatalogTab } from '@/api/contracts/nfts'
import { CATALOG_SORTS } from '@/api/contracts/nfts'
import { withFilter, type CatalogSearch } from '@/features/catalog/search-params'
import { cn } from '@/lib/utils'

const TABS: { value: CatalogTab; label: string }[] = [
  { value: 'todos', label: 'Todos os NFTs' },
  { value: 'novos', label: 'Novos lançamentos' },
  { value: 'em-alta', label: 'Em alta' },
]

const SORT_LABELS: Record<CatalogSort, string> = {
  recentes: 'Listados recentemente',
  'preco-asc': 'Menor preço',
  'preco-desc': 'Maior preço',
  populares: 'Mais populares',
}

/** Abas do catálogo (Figma) e "Ordenar por". As abas são links: cada uma tem URL própria. */
export function CatalogToolbar({ search }: { search: CatalogSearch }) {
  const navigate = useNavigate()
  const sortId = useId()
  const activeTab = search.aba ?? 'todos'

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <nav aria-label="Seções do catálogo" className="-mx-1 overflow-x-auto px-1">
        <ul className="flex gap-4 whitespace-nowrap md:gap-5">
          {TABS.map((tab) => {
            const active = tab.value === activeTab
            return (
              <li key={tab.value}>
                <Link
                  to="/"
                  search={withFilter(search, { aba: tab.value })}
                  resetScroll={false}
                  // Busca exata: só a aba atual recebe aria-current.
                  activeOptions={{ exact: true }}
                  className={cn(
                    // Mobile (Figma 14:5226): 14 px, ativa em Bold com sublinhado de 2 px.
                    'relative inline-block pb-1 text-body-14 leading-4 md:pb-2 md:text-body-15 md:leading-5 md:font-medium',
                    active
                      ? 'font-bold text-highlight after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary md:after:h-[3px]'
                      : 'text-foreground hover:text-highlight',
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-1 text-body-15">
        <label htmlFor={sortId}>Ordenar por:</label>
        <select
          id={sortId}
          value={search.ordem ?? 'recentes'}
          onChange={(event) =>
            void navigate({
              to: '/',
              search: withFilter(search, { ordem: event.target.value as CatalogSort }),
              resetScroll: false,
            })
          }
          className="cursor-pointer rounded-md bg-transparent py-1 pr-1 text-body-15 text-foreground"
        >
          {CATALOG_SORTS.map((sort) => (
            <option key={sort} value={sort} className="bg-surface-card">
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
