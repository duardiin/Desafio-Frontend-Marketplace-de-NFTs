import type { ReactNode } from 'react'

interface StatusPageProps {
  eyebrow: string
  title: string
  description: string
  actions: ReactNode
}

/** Estrutura comum de páginas de status (404, erro). Segue o padrão visual do hero. */
export function StatusPage({ eyebrow, title, description, actions }: StatusPageProps) {
  return (
    <section className="container-page mt-8">
      <div className="flex min-h-[360px] flex-col items-start justify-center gap-4 bg-surface-card px-6 py-12 md:px-10">
        <p className="text-body-14 font-medium tracking-brand text-highlight">{eyebrow}</p>
        <h1 className="text-heading-28 font-bold uppercase md:text-display">{title}</h1>
        <p className="max-w-[557px] text-body-14 leading-6 text-muted-foreground">{description}</p>
        <div className="mt-2 flex flex-wrap gap-3">{actions}</div>
      </div>
    </section>
  )
}
