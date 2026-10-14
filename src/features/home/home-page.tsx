import { CatalogSection } from '@/features/catalog/catalog-section'
import type { CatalogSearch } from '@/features/catalog/search-params'
import { BlogSection } from '@/features/home/blog-section'
import { FeaturedBanner } from '@/features/home/featured-banner'
import { Hero } from '@/features/home/hero'
import { Promos } from '@/features/home/promos'

/** Início do Figma: hero, catálogo (com destaque), promoções e blog, com 96 px entre seções. */
export function HomePage({ search }: { search: CatalogSearch }) {
  return (
    <div className="flex flex-col gap-16 lg:gap-24">
      <Hero />
      <CatalogSection search={search} aside={<FeaturedBanner />} />
      <Promos />
      <BlogSection />
    </div>
  )
}
