# Contratos REST

Os tipos são a fonte da verdade e ficam em [`src/api/contracts/`](../src/api/contracts). Este documento resume os endpoints e as regras.
Base: `VITE_API_URL` (padrão `/api`). Todas as respostas são JSON.

## Convenções

- **ETH** trafega como string decimal (`"1.19"`, `"0.0021"`) e é calculado com decimal.js. **Quantidades** são inteiras.
- **Autenticação:** `Authorization: Bearer <token>`. O token é opaco e tem validade (`expiresAt`).
- **Carrinho de visitante:** header `X-Guest-Id` com um UUID gerado no navegador.
- **Imagens** (`ImageAsset`): `{ src, alt, width, height, variants: [{ width, src }] }`. As variantes são WebP de 256, 512 e 900 px, e `src` aponta para a de 512.
- **Versão:** NFTs, carrinho e pedidos têm `version`, que aumenta a cada mudança. Os eventos em tempo real usam esse campo para descartar dados antigos.
- **Erros** seguem o formato `{ code, message, fieldErrors? }`:

| HTTP | `kind` no cliente | Códigos |
|---|---|---|
| 400 / 422 | `validation` | `VALIDATION_FAILED`, `INVALID_CREDENTIALS`, `WRONG_PASSWORD`, `COUPON_INVALID`, `COUPON_EXPIRED` |
| 401 | `session` | `SESSION_REQUIRED`, `SESSION_EXPIRED` |
| 403 | `permission` | `FORBIDDEN` (recurso de outro usuário) |
| 404 | `not-found` | `NFT_NOT_FOUND`, `CART_ITEM_NOT_FOUND`, `ORDER_NOT_FOUND`, `WALLET_NOT_FOUND` |
| 409 | `conflict` | `EMAIL_TAKEN`, `EDITION_SOLD_OUT`, `QUANTITY_LIMIT`, `QUOTE_OUTDATED`, `IDEMPOTENCY_CONFLICT`, `WALLET_LIMIT`, `WALLET_NETWORK_MISMATCH`, `WALLET_REJECTED`, `WALLET_DISCONNECTED` |
| rede, timeout, 408, 429, 5xx | `transient` | `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR` |

O cliente Axios converte qualquer falha num `ApiError` ([`src/api/api-error.ts`](../src/api/api-error.ts)). O TanStack Query só repete automaticamente erros `transient`.

## Sessão e conta

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| POST | `/auth/register` | `{ displayName, email, password }` | 201 `Session` · 409 `EMAIL_TAKEN` · 422 |
| POST | `/auth/login` | `{ email, password }` | 200 `Session` · 422 `INVALID_CREDENTIALS` |
| GET | `/auth/session` | | 200 `Session` · 401 |
| POST | `/auth/logout` | | 204 |

`Session = { token, expiresAt, user: { id, displayName, email, avatarUrl } }`. A senha mínima tem 8 caracteres, com letras e números.

## NFTs

| Método | Caminho | Resposta |
|---|---|---|
| GET | `/nfts` | 200 `NftListResponse` |
| GET | `/nfts/:id` | 200 `NftDetail` · 404 `NFT_NOT_FOUND` |

Parâmetros de `/nfts` (as listas repetem a chave):

| Parâmetro | Valores |
|---|---|
| `q` | Busca no nome, criador e coleção, sem diferenciar acentos |
| `collection` | `arte-digital`, `fotografia`, `musica`, `arte-3d`, `colecionaveis`, `generativa`, `jogos`, `assinaturas`, `utilidade` |
| `network` | `ethereum`, `polygon`, `solana` |
| `priceMin`, `priceMax` | ETH decimal, inclusivo |
| `tab` | `todos` (padrão), `novos`, `em-alta` |
| `sort` | `recentes` (padrão), `preco-asc`, `preco-desc`, `populares` |
| `page` | ≥ 1. São 9 itens por página. |

Edições: cada NFT tem `editions: EditionOption[]`, com `{ id: "1-1" | "1-10" | "1-50" | "aberta", label, supply, available }`. Em edição aberta, `supply` e `available` são `null` (sem limite de tiragem; vale só o `maxPerOrder` do NFT). Na listagem, `soldOut` é `true` quando todas as edições estão esgotadas, e `rare` é `true` quando o NFT tem o atributo "Raro" ou "Lendário" (selo do card mobile).

O detalhe traz também `description`, `story` (parágrafos), `creator`, `series`, `tokenId`, `attributes`, `royaltyPercent`, `gallery`, `maxPerOrder`, `rating { average, count }`, `reviews` (as 3 mais recentes), `contractAddress`, `tokenStandard`, `listedAt` e `favoritesCount`.

A resposta traz `{ items, page, pageSize, totalItems, totalPages, facets }`:
- `facets.collections` e `facets.networks` dão a contagem por opção, considerando os demais filtros.
- `facets.priceRange` dá os limites do catálogo inteiro.

## Favoritos (exige sessão)

| Método | Caminho | Resposta |
|---|---|---|
| GET | `/me/favorites` | 200 `{ items: NftSummary[] }` |
| PUT / DELETE | `/me/favorites/:nftId` | 200 `{ nftId, favorited }`. É idempotente. |

## Carrinho e cotação (sessão ou `X-Guest-Id`)

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| GET | `/cart` | | 200 `Cart` |
| POST | `/cart/items` | `{ nftId, editionId, quantity }` (soma à quantidade atual) | 200 `Cart` · 409 `EDITION_SOLD_OUT` / `QUANTITY_LIMIT` · 422 (edição inválida) |
| PATCH | `/cart/items/:lineId` | `{ quantity }` | 200 `Cart` · 409 · 404 |
| DELETE | `/cart/items/:lineId` | | 200 `Cart` |
| PUT | `/cart/coupon` | `{ code }` | 200 `Cart` · 422 `COUPON_INVALID` / `COUPON_EXPIRED` |
| DELETE | `/cart/coupon` | | 200 `Cart` |
| POST | `/cart/merge` | `{ guestId }` (exige sessão) | 200 `Cart`. Soma ao carrinho do usuário, respeitando os limites. |
| GET | `/cart/quote` | | 200 `Quote` |

Cada linha do carrinho é NFT + edição (`lineId = <nftId>__<editionId>`). `CartItem` traz `edition` e `maxQuantity` (o menor valor entre edições disponíveis e limite por pedido) e `priceWhenAddedEth`. Se este for diferente de `nft.priceEth`, o preço mudou desde que o item foi adicionado.

**Cotação:** `{ id, lines, subtotalEth, discountEth, networkFeeEth, totalEth, coupon, blockers }`.
- É sempre calculada com os preços atuais.
- A taxa de rede simulada é de 0,0021 ETH por linha.
- O `id` deriva do conteúdo: mudou preço, quantidade, cupom ou taxa, o `id` muda.
- `blockers` lista os itens esgotados ou acima do limite.

## Conexão de carteira (exige sessão)

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| POST | `/checkout/wallet-connection` | `{ walletId, network }` | 201 `{ id, walletId, network, address, expiresAt }` · 403 · 404 · 409 `WALLET_NETWORK_MISMATCH` / `WALLET_REJECTED` |
| DELETE | `/checkout/wallet-connection/:id` | | 204 |

A conexão simula a extensão/app da carteira (sem blockchain) e vale 10 minutos. Cada usuário tem uma conexão ativa por vez.

## Pedidos (exige sessão)

| Método | Caminho | Resposta |
|---|---|---|
| POST | `/orders` + header `Idempotency-Key` | 201 `Order` (novo) · 200 (mesma chave) · 409 · 422 |
| GET | `/orders/:id` | 200 `Order` · 403 · 404 |
| GET | `/orders?status=pending` | 200 `{ items: Order[] }` |

Corpo: `{ quoteId, walletId, network, connectionId, buyer: { fullName, email, username, profileName, referralCode?, ensName?, secondaryWallet?, note? } }`.

Regras da criação:
1. **Idempotência:** a mesma chave com o mesmo corpo devolve o mesmo pedido. A mesma chave com outro corpo dá 409 `IDEMPOTENCY_CONFLICT`.
2. **Revalidação:** o servidor recalcula a cotação. Item esgotado ou acima do limite dá 409 `EDITION_SOLD_OUT` / `QUANTITY_LIMIT`. Um `quoteId` diferente da cotação atual dá 409 `QUOTE_OUTDATED`.
3. **Carteira:** precisa pertencer ao usuário (senão 403), operar na rede escolhida (senão 409 `WALLET_NETWORK_MISMATCH`) e estar conectada, com uma `connectionId` válida da mesma carteira e rede (senão 409 `WALLET_DISCONNECTED`).
4. **Estados:** o pedido nasce `pending` e a simulação resolve em ~2,5 s.
   - `confirmed`: baixa as edições, remove do carrinho só as quantidades compradas e gera `transaction.hash`.
   - `declined`: preserva o carrinho e preenche `failureReason`.
   - Os dois estados são terminais.
   - Um pedido pendente é resolvido também quando é consultado, então sobrevive a refresh.
5. **Recibo:** as `lines` e os totais são um snapshot. Mudanças posteriores no catálogo não os alteram.

## Perfil e carteiras (exige sessão)

| Método | Caminho | Corpo | Resposta |
|---|---|---|---|
| GET | `/me/profile` | | 200 `Profile` |
| PATCH | `/me/profile` | `{ displayName?, username?, email?, ensName?, walletNickname?, bio? }` | 200 `Profile` · 409 `EMAIL_TAKEN` · 422 (inclui nome de usuário em uso) |
| PUT | `/me/avatar` | `{ dataUrl }` (PNG/JPEG/WebP, até 300 KB) | 200 `Profile` · 422 |
| DELETE | `/me/avatar` | | 200 `Profile` (sem avatar) |
| POST | `/me/password` | `{ currentPassword, newPassword }` | 204 · 422 `WRONG_PASSWORD` |
| GET | `/me/wallets` | | 200 `{ items: Wallet[] }` |
| POST | `/me/wallets` | `{ label, provider, address, networks, role }` | 201 `Wallet` · 409 `WALLET_LIMIT` · 422 |
| PATCH | `/me/wallets/:id` | campos parciais | 200 `{ items }` · 403 · 404 · 422 |

Carteiras:
- **Limite:** no máximo uma `principal` e uma `secundaria`. Trocar o papel de uma carteira troca o da outra.
- **Endereço:** EVM usa `0x` + 40 hex; Solana usa base58 de 32 a 44 caracteres.
- **Redes:** Solana não se combina com redes EVM.

## Eventos em tempo real (Socket.IO)

Tipos em [`src/api/contracts/events.ts`](../src/api/contracts/events.ts). Endereço: `VITE_REALTIME_URL` (padrão `wss://realtime.kurio.local`), caminho `/socket.io`, transporte `websocket`. Com mocks, o servidor é simulado pelo MSW.

| Direção | Evento | Payload |
|---|---|---|
| cliente → servidor | `session:join` | `{ token: string | null }` (associa a conexão ao usuário; `null` = visitante) |
| servidor → cliente | `session:joined` | `{ userId: string | null }` |
| servidor → cliente | `nft.updated` | Envelope com `data: { id, name, priceEth, previousPriceEth, editions, soldOut, version }`. Vai para todos. |
| servidor → cliente | `order.updated` | Envelope com `userId` e `data: Order`. Vai só para as conexões do dono. |

Envelope: `{ id, type, resource: { type, id }, version, occurredAt, data }`. O `id` é estável (`<recurso>:<id>:v<versão>`), então duplicatas têm o mesmo id. O cliente ignora ids já vistos e eventos com versão menor ou igual à do dado em cache. Depois de reconectar, recarrega pelo REST os recursos ativos.
