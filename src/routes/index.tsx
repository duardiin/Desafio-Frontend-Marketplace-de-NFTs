import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  staticData: { navSection: 'inicio', headerDivider: true },
  component: HomePage,
})

// Hero, catálogo e destaques entram no bloco de descoberta (P4).
function HomePage() {
  return (
    <>
      <h1 className="sr-only">Kurio: marketplace de NFTs</h1>
      <section id="catalogo" aria-label="Catálogo" />
    </>
  )
}
