import { useState } from 'react'
import { CatalogSection } from '@/features/catalog/catalog-section'
import type { CatalogSearch } from '@/features/catalog/search-params'
import { BlogSection } from '@/features/home/blog-section'
import { FeaturedBanner } from '@/features/home/featured-banner'
import { Hero } from '@/features/home/hero'
import { MobileExploreBar } from '@/features/home/mobile-explore-bar'
import { Promos } from '@/features/home/promos'

/**
 * Início do Figma: hero, catálogo (com destaque), promoções e blog, com 96 px
 * entre seções. No mobile, a busca e o botão de filtros do Figma ficam no topo.
 */
export function HomePage({ search }: { search: CatalogSearch }) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      {/* Mobile (Figma): 16 px entre busca, hero e catálogo. */}
      <div className="flex flex-col gap-4 md:gap-16 lg:gap-24">
        <div className="flex flex-col gap-4 md:gap-0">
          <MobileExploreBar search={search} onOpenFilters={() => setFiltersOpen(true)} />
          <Hero />
        </div>
        <CatalogSection
          search={search}
          aside={<FeaturedBanner />}
          filtersOpen={filtersOpen}
          onFiltersOpenChange={setFiltersOpen}
        />
      </div>
      <Promos />
      <BlogSection />
    </div>
  )
}
