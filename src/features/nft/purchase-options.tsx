import minusIcon from '@/assets/figma/icon-minus.svg'
import plusIcon from '@/assets/figma/icon-plus.svg'
import type { EditionOption } from '@/api/contracts/nfts'
import { cn } from '@/lib/utils'

interface EditionPickerProps {
  editions: EditionOption[]
  selectedId: string | undefined
  onSelect: (id: string) => void
}

/** "Edição:" em pílulas (Figma). Edição esgotada fica indisponível e riscada, com texto para leitor de tela. */
export function EditionPicker({ editions, selectedId, onSelect }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-body-15 font-bold">Edição:</legend>
      <div role="radiogroup" aria-label="Edição" className="flex flex-wrap gap-1.5">
        {editions.map((edition) => {
          const soldOut = edition.available === 0
          const selected = edition.id === selectedId
          return (
            <button
              key={edition.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={soldOut}
              onClick={() => onSelect(edition.id)}
              className={cn(
                'h-7 rounded-full border px-2 text-body-14 uppercase',
                selected ? 'border-highlight font-medium text-highlight' : 'border-border-soft text-muted-foreground',
                soldOut ? 'cursor-not-allowed line-through opacity-60' : 'hover:border-primary',
              )}
            >
              {edition.label}
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
}

const STEP_BUTTON =
  'grid size-[33px] place-items-center rounded-full border border-ink bg-primary shadow-[0_6.6px_9.9px_rgba(20,13,10,0.15)] disabled:cursor-not-allowed disabled:opacity-40'

/** Quantidade inteira entre 1 e o máximo da edição (Figma: botões circulares e número 20/28). */
export function QuantityStepper({ value, max, onChange }: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label="Quantidade">
      <button
        type="button"
        className={STEP_BUTTON}
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Diminuir quantidade"
      >
        <img src={minusIcon} alt="" width={26} height={26} />
      </button>
      <output aria-live="polite" aria-label={`Quantidade: ${value}`} className="min-w-6 text-center text-[20px] leading-7">
        {value}
      </output>
      <button
        type="button"
        className={STEP_BUTTON}
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
      >
        <img src={plusIcon} alt="" width={26} height={26} />
      </button>
    </div>
  )
}
