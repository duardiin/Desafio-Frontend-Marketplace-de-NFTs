import type { CartOwner, CartRecord, UserRecord, WalletRecord } from '@/mocks/db/schema'

/**
 * Usuários fictícios. Senha de ambos: Kurio@123 (documentada no README).
 * Só o salt e o hash SHA-256(salt:senha) ficam guardados.
 */
export function createUserFixtures(): UserRecord[] {
  return [
    {
      id: 'usr-ana',
      displayName: 'Ana Ribeiro',
      username: 'anaribeiro',
      email: 'ana@kurio.dev',
      ensName: 'anaribeiro.eth',
      walletNickname: 'Cofre da Ana',
      bio: 'Colecionadora de arte digital e música on-chain.',
      avatarUrl: null,
      passwordSalt: 'ana-7f3c9e2a',
      passwordHash: '7840ba323bbbb34637db5106263744e2a55f78de550cae6fe252e74d392cd44b',
    },
    {
      id: 'usr-bruno',
      displayName: 'Bruno Carvalho',
      username: 'brunocarvalho',
      email: 'bruno@kurio.dev',
      ensName: 'brunocarvalho.eth',
      walletNickname: 'Galeria do Bruno',
      bio: 'Fotografia, generativa e jogos.',
      avatarUrl: null,
      passwordSalt: 'bruno-1b8d4f60',
      passwordHash: '6ac9d3c78b3f9143e1bbeb93680a5b273ddb5da74cc84d31d2418d4cbf2fa1e7',
    },
  ]
}

export function createWalletFixtures(): WalletRecord[] {
  return [
    {
      id: 'wal-ana-1',
      userId: 'usr-ana',
      label: 'Carteira principal',
      provider: 'metamask',
      address: '0x8f3a21c94b7e05d6a1f2c3b4e5d6a7b8c9d0e1f2',
      networks: ['ethereum', 'polygon'],
      role: 'principal',
    },
    {
      id: 'wal-ana-2',
      userId: 'usr-ana',
      label: 'Carteira Solana',
      provider: 'coinbase',
      address: '7Hd3kQx9Lm2Np4Rs6Tv8Wy1Za3Bc5De7Fg9Hj2Km4Pq',
      networks: ['solana'],
      role: 'secundaria',
    },
    {
      id: 'wal-bruno-1',
      userId: 'usr-bruno',
      label: 'Carteira do Bruno',
      provider: 'walletconnect',
      address: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
      networks: ['ethereum'],
      role: 'principal',
    },
  ]
}

/** Dados privados distintos por usuário, para testar isolamento entre sessões. */
export function createFavoriteFixtures(): Record<string, string[]> {
  return {
    'usr-ana': ['nft-001', 'nft-004'],
    'usr-bruno': ['nft-007'],
  }
}

export function createCartFixtures(): Record<CartOwner, CartRecord> {
  return {
    'user:usr-ana': {
      lines: [{ nftId: 'nft-002', editionId: '1-1', quantity: 1, priceWhenAddedEth: '1.69' }],
      couponCode: null,
      version: 1,
    },
  }
}
