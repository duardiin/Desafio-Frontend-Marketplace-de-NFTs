import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'

/**
 * Newsletter do footer. Não há endpoint de newsletter no escopo, então o envio
 * informa isso em vez de simular sucesso.
 */
export function NewsletterForm() {
  const inputId = useId()
  const [feedback, setFeedback] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('A newsletter ainda não está disponível nesta versão.')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-body-17 font-bold">
        <label htmlFor={inputId}>Antecipe-se ao próximo lançamento</label>
      </h2>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="digite seu e-mail..."
          className="h-10 min-w-0 flex-1 rounded-md bg-surface-dark px-3 text-body-14 shadow-[0_0_10px_rgba(10,6,4,0.45)] placeholder:text-subtle"
        />
        <Button type="submit" className="w-[85px]">
          Enviar
        </Button>
      </div>
      <p className="text-caption-13 text-muted-foreground">
        Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
      </p>
      <p role="status" className="min-h-[22px] text-caption-13 text-highlight">
        {feedback}
      </p>
    </form>
  )
}
