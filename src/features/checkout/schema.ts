import { z } from 'zod'
import { NETWORKS } from '@/api/contracts/common'

/**
 * Campos do formulário de Pagamento (Figma 11:2862). As regras repetem as da
 * API; a API continua sendo a autoridade (erros dela voltam para os campos).
 * Código de indicação e Nome ENS são opcionais (desvio registrado: exigir um
 * código de indicação impediria qualquer compra).
 */
export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome de exibição.').max(60, 'Use no máximo 60 caracteres.'),
  username: z
    .string()
    .trim()
    .regex(/^[a-z0-9_.]{3,20}$/, 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil.').max(60, 'Use no máximo 60 caracteres.'),
  email: z.string().trim().min(1, 'Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.')),
  walletId: z.string().min(1, 'Selecione uma carteira.'),
  network: z.enum(NETWORKS, { error: 'Selecione uma rede.' }),
  secondaryWallet: z.string().trim().max(64, 'Use no máximo 64 caracteres.'),
  referralCode: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[A-Za-z0-9]{4,12}$/.test(value), 'Use de 4 a 12 letras ou números.'),
  ensName: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[a-z0-9-]{3,32}$/.test(value), 'Use de 3 a 32 letras minúsculas, números ou hífen.'),
  note: z.string().max(280, 'Use no máximo 280 caracteres.'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>

/** Campos do formulário que podem receber erro da API (`buyer.*` no contrato). */
export const API_FIELD_MAP: Record<string, keyof CheckoutFormValues> = {
  'buyer.fullName': 'fullName',
  'buyer.email': 'email',
  'buyer.username': 'username',
  'buyer.profileName': 'profileName',
  'buyer.referralCode': 'referralCode',
  'buyer.ensName': 'ensName',
  'buyer.note': 'note',
  network: 'network',
}

/** Escolhe a carteira e ajusta a rede para uma que ela suporte. */
export function selectWallet(
  setValue: (name: 'walletId' | 'network', value: string, options?: { shouldValidate?: boolean }) => void,
  currentNetwork: string,
  wallet: { id: string; networks: readonly string[] } | undefined,
) {
  if (!wallet) return
  setValue('walletId', wallet.id, { shouldValidate: true })
  if (!wallet.networks.includes(currentNetwork)) setValue('network', wallet.networks[0], { shouldValidate: true })
}
