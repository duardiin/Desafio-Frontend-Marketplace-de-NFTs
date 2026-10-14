import { z } from 'zod'

/** Mesmas regras da API (src/mocks/lib/validation.ts); a API continua sendo a autoridade. */
const email = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.'))

export const newPasswordSchema = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'A senha precisa ter letras e números.')
  .regex(/\d/, 'A senha precisa ter letras e números.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Informe sua senha.'),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, 'Informe seu nome (mínimo de 2 caracteres).')
      .max(60, 'Use no máximo 60 caracteres.'),
    email,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
export type RegisterFormValues = z.infer<typeof registerSchema>
