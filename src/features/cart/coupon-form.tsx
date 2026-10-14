import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { TextField } from '@/components/form/text-field'
import { Button } from '@/components/ui/button'
import { useApplyCoupon, useRemoveCoupon } from '@/features/cart/use-cart'
import { applyApiErrors } from '@/lib/form-errors'

const couponSchema = z.object({ code: z.string().trim().min(1, 'Digite o código do cupom.').max(30) })
type CouponValues = z.infer<typeof couponSchema>

/** Cupom: inválido ou expirado aparecem no próprio campo (erros vindos da API). */
export function CouponForm({ appliedCode }: { appliedCode: string | null }) {
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

  return (
    <form onSubmit={onSubmit} noValidate className="flex items-start gap-2">
      <TextField
        label="Cupom de desconto"
        placeholder="Ex.: KURIO10"
        autoComplete="off"
        className="flex-1"
        error={form.formState.errors.code?.message ?? form.formState.errors.root?.server?.message}
        {...form.register('code')}
      />
      <Button type="submit" className="mt-[26px] w-[100px]" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Aplicando…' : 'Aplicar'}
      </Button>
    </form>
  )
}
