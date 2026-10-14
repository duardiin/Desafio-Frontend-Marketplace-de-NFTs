import { useId, type ComponentProps, type ReactNode } from 'react'
import selectArrow from '@/assets/figma/select-arrow-down.svg'
import { cn } from '@/lib/utils'

/** Campo do Pagamento (Figma): altura 40, borda 1 px `border`, raio 3, fundo transparente. */
const CONTROL =
  'h-10 w-full rounded-[3px] border border-border bg-transparent px-3 text-body-16 text-foreground placeholder:text-subtle focus-visible:border-ring aria-invalid:border-destructive disabled:opacity-60 md:text-body-14'

interface FieldShellProps {
  label: string
  required?: boolean
  error?: string
  hint?: string
  /** Rótulo só para leitores de tela (o Figma tem um campo sem rótulo visível). */
  srOnlyLabel?: boolean
  className?: string
  children: (ids: { id: string; describedBy: string | undefined }) => ReactNode
}

function FieldShell({ label, required, error, hint, srOnlyLabel, className, children }: FieldShellProps) {
  const id = useId()
  const errorId = error ? `${id}-erro` : undefined
  const hintId = hint && !error ? `${id}-dica` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col', className)}>
      <label htmlFor={id} className={cn('flex items-center text-body-15', srOnlyLabel && 'sr-only')}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-[22px] leading-[29px] text-coral">
            *
          </span>
        )}
      </label>
      {children({ id, describedBy })}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-caption-12 text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-caption-12 font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

type InputFieldProps = Omit<ComponentProps<'input'>, 'id'> &
  Omit<FieldShellProps, 'children'>

export function InputField({ label, required, error, hint, srOnlyLabel, className, ...input }: InputFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} srOnlyLabel={srOnlyLabel} className={className}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={CONTROL}
          {...input}
        />
      )}
    </FieldShell>
  )
}

type SelectFieldProps = Omit<ComponentProps<'select'>, 'id'> &
  Omit<FieldShellProps, 'children'> & { placeholder: string; options: { value: string; label: string }[] }

/** Select nativo (teclado e leitores de tela de graça) com a seta do Figma. */
export function SelectField({
  label,
  required,
  error,
  hint,
  className,
  placeholder,
  options,
  ...select
}: SelectFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} className={className}>
      {({ id, describedBy }) => (
        <div className="relative">
          <select
            id={id}
            aria-required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(CONTROL, 'cursor-pointer appearance-none pr-9')}
            {...select}
          >
            <option value="" disabled className="bg-surface-card">
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value} className="bg-surface-card">
                {option.label}
              </option>
            ))}
          </select>
          <img
            src={selectArrow}
            alt=""
            width={18}
            height={18}
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2"
          />
        </div>
      )}
    </FieldShell>
  )
}

type TextAreaFieldProps = Omit<ComponentProps<'textarea'>, 'id'> & Omit<FieldShellProps, 'children'>

export function TextAreaField({ label, required, error, hint, className, ...textarea }: TextAreaFieldProps) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint} className={cn('gap-3', className)}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'h-[152px] resize-none py-2')}
          {...textarea}
        />
      )}
    </FieldShell>
  )
}
