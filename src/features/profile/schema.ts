import { z } from 'zod'
import { ENS_SUFFIXES, type EnsSuffix, type Profile } from '@/api/contracts/profile'
import { newPasswordSchema } from '@/features/auth/schemas'

/** Mesmas regras da API (src/mocks/lib/validation.ts); a API continua sendo a autoridade. */
export const profileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Informe seu nome (mínimo de 2 caracteres).')
      .max(60, 'Use no máximo 60 caracteres.'),
    username: z
      .string()
      .trim()
      .regex(/^[a-z0-9_.]{3,20}$/, 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.'),
    email: z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.')),
    ensLabel: z
      .string()
      .trim()
      .min(1, 'Informe seu nome ENS.')
      .regex(/^[a-z0-9-]{3,32}$/, 'Use de 3 a 32 letras minúsculas, números ou hífen.'),
    ensSuffix: z.enum(ENS_SUFFIXES),
    walletNickname: z
      .string()
      .trim()
      .min(2, 'Informe o apelido da carteira (mínimo de 2 caracteres).')
      .max(40, 'Use no máximo 40 caracteres.'),
    // A troca de senha é opcional: só vale quando algum dos três campos é preenchido.
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const { currentPassword, newPassword, confirmPassword } = values
    if (!currentPassword && !newPassword && !confirmPassword) return

    if (!currentPassword) {
      context.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe sua senha atual.' })
    }
    const strength = newPasswordSchema.safeParse(newPassword)
    if (!strength.success) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: strength.error.issues[0]?.message ?? '' })
    } else if (newPassword === currentPassword) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'A nova senha precisa ser diferente da atual.' })
    }
    if (confirmPassword !== newPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não conferem.' })
    }
  })

export type ProfileFormValues = z.infer<typeof profileSchema>

function splitEns(ensName: string): { ensLabel: string; ensSuffix: EnsSuffix } {
  const dot = ensName.lastIndexOf('.')
  const suffix = ensName.slice(dot + 1)
  const known = ENS_SUFFIXES.find((item) => item === suffix)
  return known && dot > 0 ? { ensLabel: ensName.slice(0, dot), ensSuffix: known } : { ensLabel: ensName, ensSuffix: 'eth' }
}

export function profileFormValues(profile: Profile): ProfileFormValues {
  return {
    displayName: profile.displayName,
    username: profile.username,
    email: profile.email,
    ...splitEns(profile.ensName),
    walletNickname: profile.walletNickname,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}
