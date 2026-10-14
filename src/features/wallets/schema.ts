import { z } from 'zod'
import { NETWORKS } from '@/api/contracts/common'
import { WALLET_PROVIDERS, type Wallet, type WalletRole } from '@/api/contracts/wallets'

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/** Mesmas regras da API (src/mocks/lib/validation.ts); a API continua sendo a autoridade. */
export const walletSchema = z
  .object({
    label: z.string().trim().min(2, 'Informe o rótulo (mínimo de 2 caracteres).').max(60, 'Use no máximo 60 caracteres.'),
    // "" = nenhum provedor escolhido (placeholder do select).
    provider: z.union([z.enum(WALLET_PROVIDERS), z.literal('')]),
    networks: z.array(z.enum(NETWORKS)),
    address: z.string().trim(),
    role: z.enum(['principal', 'secundaria']),
  })
  .superRefine((values, context) => {
    if (!values.provider) {
      context.addIssue({ code: 'custom', path: ['provider'], message: 'Selecione o provedor da carteira.' })
    }
    if (values.networks.length === 0) {
      context.addIssue({ code: 'custom', path: ['networks'], message: 'Selecione pelo menos uma rede.' })
    } else if (values.networks.includes('solana') && values.networks.length > 1) {
      context.addIssue({
        code: 'custom',
        path: ['networks'],
        message: 'Solana não pode ser combinada com redes EVM na mesma carteira.',
      })
    }
    const isSolana = values.networks.includes('solana')
    if (!values.address) {
      context.addIssue({ code: 'custom', path: ['address'], message: 'Informe o endereço da carteira.' })
    } else if (isSolana && !SOLANA_ADDRESS.test(values.address)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Endereço Solana inválido (base58, 32 a 44 caracteres).',
      })
    } else if (!isSolana && !EVM_ADDRESS.test(values.address)) {
      context.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.',
      })
    }
  })

export type WalletFormValues = z.infer<typeof walletSchema>

export function walletFormValues(wallet: Wallet | undefined, freeRole: WalletRole): WalletFormValues {
  if (!wallet) return { label: '', provider: '', networks: [], address: '', role: freeRole }
  return {
    label: wallet.label,
    provider: wallet.provider,
    networks: [...wallet.networks],
    address: wallet.address,
    role: wallet.role,
  }
}

export const ROLE_LABELS: Record<WalletRole, string> = {
  principal: 'Principal',
  secundaria: 'Secundária',
}
