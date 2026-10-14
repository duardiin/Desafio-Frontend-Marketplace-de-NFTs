import facebookIcon from '@/assets/figma/social-facebook.svg'
import instagramIcon from '@/assets/figma/social-instagram.svg'
import linkedinIcon from '@/assets/figma/social-linkedin.svg'
import twitterIcon from '@/assets/figma/social-twitter.svg'
import youtubeIcon from '@/assets/figma/social-youtube.svg'
import { ComingSoon } from '@/features/layout/coming-soon'
import { NewsletterForm } from '@/features/layout/newsletter-form'

const HIGHLIGHTS = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

// Links editoriais e de conta: ganham destino quando as telas existirem
// (perfil no bloco de conta, coleções como filtro do catálogo).
const LINK_COLUMNS = [
  {
    title: 'Meu perfil',
    links: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
] as const

const SOCIAL_LINKS = [
  { label: 'Facebook', icon: facebookIcon },
  { label: 'Instagram', icon: instagramIcon },
  { label: 'Twitter', icon: twitterIcon },
  { label: 'LinkedIn', icon: linkedinIcon },
  { label: 'YouTube', icon: youtubeIcon },
] as const

export function SiteFooter() {
  return (
    <footer className="container-page mt-24 pb-8">
      <section
        aria-label="Destaques"
        className="grid gap-8 bg-surface-card p-6 md:grid-cols-3 md:p-8 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.25fr)] lg:gap-0"
      >
        {HIGHLIGHTS.map((item) => (
          <div
            key={item.letter}
            className="flex flex-col gap-3 lg:border-r lg:border-primary lg:px-6 lg:first:pl-0"
          >
            <span
              aria-hidden="true"
              className="grid size-[74px] place-items-center rounded-full bg-primary text-heading-24 font-bold text-ink"
            >
              {item.letter}
            </span>
            <h2 className="text-body-17 font-bold">{item.title}</h2>
            <p className="text-body-14 text-muted-foreground">{item.text}</p>
          </div>
        ))}
        <div className="md:col-span-3 lg:col-span-1 lg:pl-6">
          <NewsletterForm />
        </div>
      </section>

      <div className="flex min-h-[88px] flex-wrap items-center justify-between gap-x-8 gap-y-3 bg-surface-dark px-6 py-5 text-body-14 md:px-8">
        <span className="font-bold tracking-brand">KURIO</span>
        <p className="text-muted-foreground">
          Feito para colecionadores,
          <br /> criadores e cultura
        </p>
        <span>contato@email.com</span>
        <span>+55 11 4002 8922</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-8 bg-surface-card p-6 md:grid-cols-4 md:p-8 lg:flex lg:justify-between">
        {LINK_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="mb-2 text-body-18 font-bold">{column.title}</h2>
            <ul className="text-body-14 leading-[30px] text-muted-foreground">
              {column.links.map((label) => (
                <li key={label}>
                  <ComingSoon>{label}</ComingSoon>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 flex flex-col gap-6 md:col-span-1">
          <div>
            <h2 className="mb-3 text-body-18 font-bold">Redes sociais</h2>
            <ul className="flex flex-wrap gap-2">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.label}>
                  <ComingSoon className="block">
                    <img src={social.icon} alt={social.label} width={30} height={30} />
                  </ComingSoon>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="mb-3 text-body-18 font-bold">Carteiras compatíveis</h2>
            <p className="inline-block rounded-md border border-border-soft bg-surface-dark px-2 py-1 text-tiny-9 font-bold tracking-[0.1px] text-highlight">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-body-14 text-muted-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
