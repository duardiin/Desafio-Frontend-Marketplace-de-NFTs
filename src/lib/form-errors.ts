import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { toApiError } from '@/api/api-error'

/**
 * Aplica um erro da API ao formulário: erros por campo vão para os campos
 * conhecidos; o restante vira o erro geral (`root.server`).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
) {
  const apiError = toApiError(error)
  let assigned = false

  for (const [field, messages] of Object.entries(apiError.fieldErrors)) {
    const known = fields.find((name) => name === field)
    if (known && messages[0]) {
      setError(known, { type: 'server', message: messages[0] }, { shouldFocus: !assigned })
      assigned = true
    }
  }

  if (!assigned) setError('root.server', { type: 'server', message: apiError.message })
}
