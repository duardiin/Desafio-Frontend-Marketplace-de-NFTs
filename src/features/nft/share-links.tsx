import emailIcon from '@/assets/figma/share-email.svg'
import linkedinIcon from '@/assets/figma/share-linkedin.svg'
import twitterIcon from '@/assets/figma/share-twitter.svg'

/** "Compartilhar este NFT" com os destinos reais de compartilhamento (abrem fora do site). */
export function ShareLinks({ name }: { name: string }) {
  const url = typeof window === 'undefined' ? '' : window.location.href.split('#')[0]
  const text = `${name} na Kurio`
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      icon: linkedinIcon,
      size: [15, 14],
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
      icon: emailIcon,
      size: [18, 18],
    },
    {
      label: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: twitterIcon,
      size: [16, 12],
    },
  ] as const

  return (
    <div className="flex items-center gap-2">
      <p className="text-body-15 font-bold">Compartilhar este NFT:</p>
      <ul className="flex items-center gap-2">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="grid size-7 place-items-center rounded-sm hover:bg-surface-card"
              aria-label={`Compartilhar por ${link.label} (abre em nova aba)`}
            >
              <img src={link.icon} alt="" width={link.size[0]} height={link.size[1]} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
