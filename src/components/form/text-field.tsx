import { useId, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface TextFieldProps extends ComponentProps<typeof Input> {
  label: string
  error?: string
  hint?: string
}

/** Campo com label, dica e erro associados (aria-describedby / aria-invalid). */
export function TextField({ label, error, hint, id, className, ...inputProps }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...inputProps} />
      {hint && !error && (
        <p id={hintId} className="text-caption-12 text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption-12 font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
