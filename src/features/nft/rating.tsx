import starEmpty from '@/assets/figma/icon-star-empty.svg'
import starFilled from '@/assets/figma/icon-star-filled.svg'

/** Estrelas do Figma (15 px) com a média arredondada; o texto alternativo traz a média exata. */
export function Rating({ average, count }: { average: number; count: number }) {
  const filled = Math.round(average)
  return (
    <div className="flex items-center gap-1">
      <span role="img" aria-label={`Avaliação média ${average.toLocaleString('pt-BR')} de 5`} className="flex gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <img key={index} src={index < filled ? starFilled : starEmpty} alt="" width={15} height={15} className="p-px" />
        ))}
      </span>
      <span className="text-body-15">{count} avaliações de colecionadores</span>
    </div>
  )
}
