import { Link } from '@tanstack/react-router'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import type { CatalogSearch } from '@/features/catalog/search-params'
import { cn } from '@/lib/utils'

/** Páginas visíveis: primeira, última e vizinhas da atual, com reticências. */
function visiblePages(current: number, total: number): (number | 'gap')[] {
  const pages = new Set([1, total, current - 1, current, current + 1].filter((page) => page >= 1 && page <= total))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((page, index) => (index > 0 && page - sorted[index - 1] > 1 ? ['gap' as const, page] : [page]))
}

const BUTTON = 'grid size-[35px] place-items-center rounded-sm text-body-18'

interface PaginationProps {
  search: CatalogSearch
  page: number
  totalPages: number
}

/** Paginação do Figma (35 × 35, raio 4, ativa em `primary`). Cada página é um link: funciona com histórico e refresh. */
export function Pagination({ search, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null

  const linkTo = (target: number) => ({
    to: '/' as const,
    search: { ...search, pagina: target > 1 ? target : undefined },
    hash: 'catalogo',
    // Comparação exata dos search params: só a página atual fica ativa.
    activeOptions: { exact: true },
  })

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex flex-wrap items-center gap-2">
        {page > 1 && (
          <li>
            <Link {...linkTo(page - 1)} className={cn(BUTTON, 'border border-border')} aria-label="Página anterior">
              <ChevronLeftIcon className="size-5" aria-hidden="true" />
            </Link>
          </li>
        )}
        {visiblePages(page, totalPages).map((item, index) =>
          item === 'gap' ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                {...linkTo(item)}
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Página ${item}`}
                className={cn(
                  BUTTON,
                  item === page ? 'bg-primary font-bold text-ink' : 'border border-border text-foreground hover:border-primary',
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages && (
          <li>
            <Link {...linkTo(page + 1)} className={cn(BUTTON, 'border border-border')} aria-label="Próxima página">
              <ChevronRightIcon className="size-5" aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
