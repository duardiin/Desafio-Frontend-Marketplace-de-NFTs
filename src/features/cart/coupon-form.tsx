import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { useApplyCoupon, useRemoveCoupon } from '@/features/cart/use-cart'
import { applyApiErrors } from '@/lib/form-errors'

const couponSchema = z.object({ code: z.string().trim().min(1, 'Digite o código do cupom.').max(30) })
type CouponValues = z.infer<typeof couponSchema>

/**
 * Cupom: inválido ou expirado aparecem no próprio campo (erros vindos da API).
 * `pill`: campo e "Aplicar" unidos numa pílula (Figma mobile 16:360).
 */
export function CouponForm({ appliedCode, variant = 'default' }: { appliedCode: string | null; variant?: 'default' | 'pill' }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const form = useForm<CouponValues>({ resolver: zodResolver(couponSchema), defaultValues: { code: '' } })

  const onSubmit = form.handleSubmit(async ({ code }) => {
    try {
      await apply.mutateAsync(code)
      form.reset()
    } catch (error) {
      applyApiErrors(error, form.setError, ['code'])
    }
  })

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-primary bg-surface-dark px-3 py-2 text-body-14">
        <span>
          Cupom <strong className="text-highlight">{appliedCode}</strong> aplicado
        </span>
        <Button variant="ghost" size="sm" onClick={() => remove.mutate()} disabled={remove.isPending}>
          Remover cupom
        </Button>
      </div>
    )
  }

  const error = form.formState.errors.code?.message ?? form.formState.errors.root?.server?.message

  if (variant === 'pill') {
    return (
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-1">
        <div className="flex h-12 items-center rounded-full border border-border pl-4 has-focus-visible:outline-2 has-focus-visible:outline-ring aria-invalid:border-destructive" aria-invalid={error ? true : undefined}>
          <label htmlFor="cupom-mobile" className="sr-only">
            Cupom de desconto
          </label>
          <input
            id="cupom-mobile"
            autoComplete="off"
            placeholder="Digite o código promocional..."
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'cupom-mobile-erro' : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-body-14 outline-none placeholder:text-subtle"
            {...form.register('code')}
          />
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-cta-gradient h-full rounded-full px-5 text-body-15 font-bold text-ink disabled:opacity-60"
          >
            {form.formState.isSubmitting ? 'Aplicando…' : 'Aplicar'}
          </button>
        </div>
        {error && (
          <p id="cupom-mobile-erro" className="px-4 text-caption-12 font-medium text-destructive">
            {error}
          </p>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex items-start gap-2">
      <TextField
        label="Cupom de desconto"
        placeholder="Ex.: KURIO10"
        autoComplete="off"
        className="flex-1"
        error={error}
        {...form.register('code')}
      />
      <Button type="submit" className="mt-[26px] w-[100px]" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Aplicando…' : 'Aplicar'}
      </Button>
    </form>
  )
}
