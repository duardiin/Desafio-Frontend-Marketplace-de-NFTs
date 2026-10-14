import type { Network } from '@/api/contracts/common'
import { NETWORKS } from '@/api/contracts/common'
import type { WalletProvider } from '@/api/contracts/wallets'
import { WALLET_PROVIDERS } from '@/api/contracts/wallets'

/**
 * Validações do "servidor" simulado. Cada função devolve `{ campo: [mensagens] }`
 * vazio quando o valor é válido, para compor o `fieldErrors` da resposta 422.
 */
type FieldErrors = Record<string, string[]>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function error(field: string, message: string): FieldErrors {
  return { [field]: [message] }
}

export function validateDisplayName(value: unknown, field = 'displayName'): FieldErrors {
  const text = typeof value === 'string' ? value.trim() : ''
  if (text.length < 2) return error(field, 'Informe seu nome (mínimo de 2 caracteres).')
  if (text.length > 60) return error(field, 'Use no máximo 60 caracteres.')
  return {}
}

export function validateEmail(value: unknown, field = 'email'): FieldErrors {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return error(field, 'Informe seu e-mail.')
  if (!EMAIL_PATTERN.test(text)) return error(field, 'Informe um e-mail válido.')
  return {}
}

export function validateNewPassword(value: unknown, field = 'newPassword'): FieldErrors {
  const text = typeof value === 'string' ? value : ''
  if (text.length < 8) return error(field, 'A senha precisa ter pelo menos 8 caracteres.')
  if (!/[A-Za-z]/.test(text) || !/\d/.test(text)) {
    return error(field, 'A senha precisa ter letras e números.')
  }
  return {}
}

export function validateUsername(value: unknown, field = 'username'): FieldErrors {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!/^[a-z0-9_.]{3,20}$/.test(text)) {
    return error(field, 'Use de 3 a 20 caracteres: letras minúsculas, números, ponto ou _.')
  }
  return {}
}

export function validateBio(value: unknown, field = 'bio'): FieldErrors {
  const text = typeof value === 'string' ? value : ''
  return text.length > 280 ? error(field, 'Use no máximo 280 caracteres.') : {}
}

/** Código de indicação: opcional; se informado, 4 a 12 letras/números. */
export function validateOptionalCode(value: unknown, field = 'referralCode'): FieldErrors {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return {}
  return /^[A-Za-z0-9]{4,12}$/.test(text) ? {} : error(field, 'Use de 4 a 12 letras ou números.')
}

/** Nome ENS: opcional; se informado, só letras minúsculas, números e hífen (sem o ".eth"). */
export function validateOptionalEns(value: unknown, field = 'ensName'): FieldErrors {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) return {}
  return /^[a-z0-9-]{3,32}$/.test(text) ? {} : error(field, 'Use de 3 a 32 letras minúsculas, números ou hífen.')
}

export function isWalletProvider(value: unknown): value is WalletProvider {
  return typeof value === 'string' && (WALLET_PROVIDERS as readonly string[]).includes(value)
}

export function isNetwork(value: unknown): value is Network {
  return typeof value === 'string' && (NETWORKS as readonly string[]).includes(value)
}

export function validateWalletNetworks(value: unknown, field = 'networks'): FieldErrors {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isNetwork)) {
    return error(field, 'Selecione pelo menos uma rede.')
  }
  if (value.includes('solana') && value.length > 1) {
    return error(field, 'Solana não pode ser combinada com redes EVM na mesma carteira.')
  }
  return {}
}

export function validateWalletAddress(address: unknown, networks: unknown, field = 'address'): FieldErrors {
  const text = typeof address === 'string' ? address.trim() : ''
  if (!text) return error(field, 'Informe o endereço da carteira.')
  const isSolana = Array.isArray(networks) && networks.includes('solana')
  if (isSolana && !SOLANA_ADDRESS.test(text)) {
    return error(field, 'Endereço Solana inválido (base58, 32 a 44 caracteres).')
  }
  if (!isSolana && !EVM_ADDRESS.test(text)) {
    return error(field, 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.')
  }
  return {}
}
