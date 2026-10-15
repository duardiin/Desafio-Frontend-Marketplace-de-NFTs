import minusIcon from '@/assets/figma/icon-minus.svg'
import plusIcon from '@/assets/figma/icon-plus.svg'
import type { EditionOption } from '@/api/contracts/nfts'
import { cn } from '@/lib/utils'

interface EditionPickerProps {
  editions: EditionOption[]
  selectedId: string | undefined
  onSelect: (id: string) => void
  /** `compact`: pílulas de 24 px com texto 13 (Figma mobile). */
  size?: 'default' | 'compact'
}

/** "Edição:" em pílulas (Figma). Edição esgotada fica indisponível e riscada, com texto para leitor de tela. */
export function EditionPicker({ editions, selectedId, onSelect, size = 'default' }: EditionPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={cn('text-body-15 font-bold', size === 'compact' ? 'mb-2' : 'mb-3')}>Edição:</legend>
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
                'rounded-full border px-2 uppercase',
                size === 'compact' ? 'h-6 text-caption-13 leading-6' : 'h-7 text-body-14',
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
  /** Nome do item, para rótulos únicos quando há vários steppers (carrinho). */
  itemName?: string
  disabled?: boolean
  /** `compact`: quadrados de 24 px (Figma mobile do Detalhe e do Carrinho). */
  size?: 'default' | 'compact'
}

const STEP_BUTTON = {
  default:
    'grid size-[33px] place-items-center rounded-full border border-ink bg-primary shadow-[0_6.6px_9.9px_rgba(20,13,10,0.15)] disabled:cursor-not-allowed disabled:opacity-40',
  compact:
    'grid size-6 place-items-center rounded-md bg-primary disabled:cursor-not-allowed disabled:opacity-40 after:absolute after:-inset-2.5 relative',
}

/** Quantidade inteira entre 1 e o máximo da edição (Figma: botões circulares e número 20/28). */
export function QuantityStepper({ value, max, onChange, itemName, disabled = false, size = 'default' }: QuantityStepperProps) {
  const suffix = itemName ? ` de ${itemName}` : ''
  const button = STEP_BUTTON[size]
  const icon = size === 'compact' ? 20 : 26
  return (
    <div className={size === 'compact' ? 'flex items-center gap-2.5' : 'flex items-center gap-3'} role="group" aria-label={`Quantidade${suffix}`}>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label={`Diminuir quantidade${suffix}`}
      >
        <img src={minusIcon} alt="" width={icon} height={icon} />
      </button>
      <output aria-live="polite" aria-label={`Quantidade${suffix}: ${value}`} className="min-w-6 text-center text-[20px] leading-7">
        {value}
      </output>
      <button
        type="button"
        className={button}
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label={`Aumentar quantidade${suffix}`}
      >
        <img src={plusIcon} alt="" width={icon} height={icon} />
      </button>
    </div>
  )
}
