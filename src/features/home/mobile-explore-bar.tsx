import { useNavigate } from '@tanstack/react-router'
import { useId, useState, type FormEvent } from 'react'
import filterIcon from '@/assets/figma/m-filter.svg'
import searchIcon from '@/assets/figma/m-search.svg'
import { activeFilterCount, withFilter, type CatalogSearch } from '@/features/catalog/search-params'

interface MobileExploreBarProps {
  search: CatalogSearch
  onOpenFilters: () => void
}

/**
 * Topo do Início mobile (Figma 14:5226): campo "Explorar coleções" e botão de
 * filtros em degradê. A busca vira `?q=` (mantendo os filtros) e o botão abre
 * o drawer "Filtros" do catálogo.
 */
export function MobileExploreBar({ search, onOpenFilters }: MobileExploreBarProps) {
  const navigate = useNavigate()
  const inputId = useId()
  // A busca da URL é a fonte; o campo só guarda o que está sendo digitado.
  const [term, setTerm] = useState(search.q ?? '')
  const [lastQ, setLastQ] = useState(search.q)
  if (search.q !== lastQ) {
    setLastQ(search.q)
    setTerm(search.q ?? '')
  }
  const filterCount = activeFilterCount(search)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = term.trim() || undefined
    void navigate({ to: '/', search: withFilter(search, { q }), hash: 'catalogo' })
  }

  return (
    <div className="container-page flex gap-2 pt-10 md:hidden">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3 has-focus-visible:outline-2 has-focus-visible:outline-ring"
      >
        <label htmlFor={inputId} className="sr-only">
          Buscar NFTs
        </label>
        <img src={searchIcon} alt="" width={22} height={22} className="shrink-0" />
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          maxLength={80}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          className="h-full min-w-0 flex-1 bg-transparent text-body-14 leading-4 font-bold text-foreground outline-none placeholder:text-subtle"
        />
      </form>
      <button
        type="button"
        onClick={onOpenFilters}
        className="relative grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(137deg,rgb(210_138_76/0.45)_24.6%,#d28a4c_100%)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <img src={filterIcon} alt="" width={16} height={16} />
        <span className="sr-only">Filtros</span>
        {filterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border-2 border-ink bg-foreground text-tiny-10 font-bold text-ink">
            {filterCount}
            <span className="sr-only"> ativos</span>
          </span>
        )}
      </button>
    </div>
  )
}
