import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { toApiError } from '@/api/api-error'

/**
 * Aplica um erro da API ao formulário: erros por campo vão para os campos
 * conhecidos; o restante vira o erro geral (`root.server`). `aliases` liga um
 * campo da API a outro nome no formulário (ex.: `ensName` → `ensLabel`).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
  aliases: Partial<Record<string, FieldPath<T>>> = {},
) {
  const apiError = toApiError(error)
  let assigned = false

  for (const [field, messages] of Object.entries(apiError.fieldErrors)) {
    const known = aliases[field] ?? fields.find((name) => name === field)
    if (known && messages[0]) {
      setError(known, { type: 'server', message: messages[0] }, { shouldFocus: !assigned })
      assigned = true
    }
  }

  if (!assigned) setError('root.server', { type: 'server', message: apiError.message })
}
