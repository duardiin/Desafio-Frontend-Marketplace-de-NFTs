import { useNavigate } from '@tanstack/react-router'
import { useId, useState, type FormEvent } from 'react'
import searchIcon from '@/assets/figma/icon-search.svg'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

/**
 * Busca do header. O Figma só mostra a lupa; o campo abre num diálogo e a
 * busca vira `?q=` no catálogo (sobrevive a refresh e ao histórico).
 */
export function SearchDialog() {
  const navigate = useNavigate()
  const inputId = useId()
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = term.trim()
    setOpen(false)
    void navigate({ to: '/', search: q ? { q } : {}, hash: 'catalogo' })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setTerm('')
      }}
    >
      <DialogTrigger asChild>
        <button type="button" className="grid size-6 place-items-center rounded-sm" aria-label="Buscar NFTs">
          <img src={searchIcon} alt="" width={20} height={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="top-24 translate-y-0 bg-surface-card p-6 sm:max-w-[560px]">
        <DialogTitle>Buscar NFTs</DialogTitle>
        <DialogDescription>Procure por nome, criador ou coleção.</DialogDescription>
        <form role="search" onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <Input
            id={inputId}
            type="search"
            autoFocus
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Ex.: Golden, Nova Sato, Música"
            maxLength={80}
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
