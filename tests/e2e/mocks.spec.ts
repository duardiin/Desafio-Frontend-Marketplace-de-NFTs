import { expect, test } from '@playwright/test'
import { callApi, login, openApp, useScenario } from './support/mock-api'

interface ListBody {
  items: { id: string; name: string; collection: string; network: string; priceEth: string }[]
  page: number
  totalItems: number
  totalPages: number
  facets: { priceRange: { min: string; max: string } }
}

interface OrderBody {
  id: string
  status: string
  totalEth: string
  transaction: { hash: string } | null
}

const ORDER_BODY = {
  walletId: 'wal-ana-1',
  network: 'ethereum',
  buyer: { fullName: 'Ana Ribeiro', email: 'ana@kurio.dev' },
}

// Contratos e estado da API simulada: não dependem do viewport.
test.skip(({ isMobile }) => isMobile, 'contratos da API simulada não dependem do viewport')

test.describe('catálogo simulado', () => {
  test('lista paginada com os cards do Figma na página 1', async ({ page }) => {
    await openApp(page)
    const { status, body } = await callApi<ListBody>(page, '/nfts')
    expect(status).toBe(200)
    expect(body.items).toHaveLength(9)
    expect(body.items[0].name).toBe('Emerald Ape #042')
    expect(body.totalPages).toBe(Math.ceil(body.totalItems / 9))
    expect(body.facets.priceRange).toEqual({ min: '0.02', max: '12.3' })
  })

  test('filtros combinados, ordenação e paginação refletem os parâmetros', async ({ page }) => {
    await openApp(page)
    const filtered = await callApi<ListBody>(
      page,
      '/nfts?collection=musica&collection=arte-digital&network=polygon',
    )
    expect(filtered.body.items.length).toBeGreaterThan(0)
    for (const item of filtered.body.items) {
      expect(['musica', 'arte-digital']).toContain(item.collection)
      expect(item.network).toBe('polygon')
    }

    const sorted = await callApi<ListBody>(page, '/nfts?sort=preco-asc')
    const prices = sorted.body.items.map((item) => Number(item.priceEth))
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
    expect(sorted.body.items[0].priceEth).toBe('0.02')

    const page2 = await callApi<ListBody>(page, '/nfts?sort=preco-asc&page=2')
    expect(page2.body.page).toBe(2)
    expect(Number(page2.body.items[0].priceEth)).toBeGreaterThanOrEqual(prices.at(-1) ?? 0)
  })

  test('detalhe inexistente responde 404 com código estável', async ({ page }) => {
    await openApp(page)
    const { status, body } = await callApi<{ code: string }>(page, '/nfts/nft-999')
    expect(status).toBe(404)
    expect(body.code).toBe('NFT_NOT_FOUND')
  })
})

test.describe('cenários', () => {
  test('?cenario=vazio devolve catálogo vazio e o parâmetro sai da URL', async ({ page }) => {
    await openApp(page, '/?cenario=vazio')
    await expect(page).toHaveURL(/\/$/)
    const { body } = await callApi<ListBody>(page, '/nfts')
    expect(body.totalItems).toBe(0)
  })

  test('erro-500 afeta o catálogo, mas não a sessão', async ({ page }) => {
    await useScenario(page, 'erro-500')
    await openApp(page)
    const catalog = await callApi<{ code: string }>(page, '/nfts')
    expect(catalog.status).toBe(500)
    expect(catalog.body.code).toBe('INTERNAL_ERROR')
    await expect(login(page, 'ana@kurio.dev')).resolves.toBeTruthy()
  })

  test('falha-temporaria: primeira chamada 503, a seguinte funciona', async ({ page }) => {
    await useScenario(page, 'falha-temporaria')
    // Rota sem consulta ao catálogo: a 1ª chamada fica para o teste.
    await openApp(page, '/rota-inexistente')
    expect((await callApi(page, '/nfts')).status).toBe(503)
    expect((await callApi(page, '/nfts')).status).toBe(200)
  })
})

test.describe('sessão e conta simuladas', () => {
  test('login, consulta da sessão, credencial errada e logout', async ({ page }) => {
    await openApp(page)
    const wrong = await callApi<{ code: string }>(page, '/auth/login', {
      method: 'POST',
      body: { email: 'ana@kurio.dev', password: 'errada123' },
    })
    expect(wrong.status).toBe(422)
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS')

    const token = await login(page, 'ana@kurio.dev')
    const session = await callApi<{ user: Record<string, unknown> }>(page, '/auth/session', { token })
    expect(session.status).toBe(200)
    expect(session.body.user.email).toBe('ana@kurio.dev')
    expect(session.body.user).not.toHaveProperty('passwordHash')

    expect((await callApi(page, '/auth/logout', { method: 'POST', token })).status).toBe(204)
    expect((await callApi(page, '/auth/session', { token })).status).toBe(401)
  })

  test('sessão expirada responde SESSION_EXPIRED', async ({ page }) => {
    await openApp(page)
    const token = await login(page, 'ana@kurio.dev')
    await page.evaluate(() => window.__kurioMock?.expireSessions())
    const result = await callApi<{ code: string }>(page, '/me/favorites', { token })
    expect(result.status).toBe(401)
    expect(result.body.code).toBe('SESSION_EXPIRED')
  })

  test('cadastro com e-mail existente gera conflito e a senha nunca é guardada em claro', async ({ page }) => {
    await openApp(page)
    const conflict = await callApi<{ code: string; fieldErrors: Record<string, string[]> }>(
      page,
      '/auth/register',
      { method: 'POST', body: { displayName: 'Outra Ana', email: 'ana@kurio.dev', password: 'Segredo123' } },
    )
    expect(conflict.status).toBe(409)
    expect(conflict.body.code).toBe('EMAIL_TAKEN')
    expect(conflict.body.fieldErrors.email).toBeTruthy()

    const created = await callApi(page, '/auth/register', {
      method: 'POST',
      body: { displayName: 'Carla Souza', email: 'carla@kurio.dev', password: 'SenhaClara987' },
    })
    expect(created.status).toBe(201)
    const stored = await page.evaluate(() => localStorage.getItem('kurio:mock-db') ?? '')
    expect(stored).toContain('carla@kurio.dev')
    expect(stored).not.toContain('SenhaClara987')
  })

  test('dados privados são isolados por usuário', async ({ page }) => {
    await openApp(page)
    const ana = await login(page, 'ana@kurio.dev')
    const bruno = await login(page, 'bruno@kurio.dev')
    const anaFavs = await callApi<{ items: { id: string }[] }>(page, '/me/favorites', { token: ana })
    const brunoFavs = await callApi<{ items: { id: string }[] }>(page, '/me/favorites', { token: bruno })
    expect(anaFavs.body.items.map((item) => item.id)).toEqual(['nft-001', 'nft-004'])
    expect(brunoFavs.body.items.map((item) => item.id)).toEqual(['nft-007'])

    const brunoCart = await callApi<{ items: unknown[] }>(page, '/cart', { token: bruno })
    expect(brunoCart.body.items).toHaveLength(0)

    const forbidden = await callApi<{ code: string }>(page, '/me/wallets/wal-ana-1', {
      method: 'PATCH',
      token: bruno,
      body: { label: 'Invasão' },
    })
    expect(forbidden.status).toBe(403)
    expect(forbidden.body.code).toBe('FORBIDDEN')
  })
})

test.describe('persistência e reset', () => {
  test('alteração sobrevive ao refresh e ?reset=1 restaura o cenário inicial', async ({ page }) => {
    await openApp(page)
    const token = await login(page, 'bruno@kurio.dev')
    await callApi(page, '/me/favorites/nft-020', { method: 'PUT', token })

    await page.reload()
    await page.getByRole('banner').waitFor()
    const afterReload = await callApi<{ items: { id: string }[] }>(page, '/me/favorites', { token })
    expect(afterReload.body.items.map((item) => item.id)).toContain('nft-020')

    await openApp(page, '/?reset=1')
    const fresh = await login(page, 'bruno@kurio.dev')
    const afterReset = await callApi<{ items: { id: string }[] }>(page, '/me/favorites', { token: fresh })
    expect(afterReset.body.items.map((item) => item.id)).toEqual(['nft-007'])
    // O reset também descarta as sessões antigas.
    expect((await callApi(page, '/me/favorites', { token })).status).toBe(401)
  })
})

test.describe('carrinho, cupom e cotação', () => {
  test('cupom válido, expirado e inválido com valores decimais exatos', async ({ page }) => {
    await openApp(page)
    const token = await login(page, 'ana@kurio.dev')

    const expired = await callApi<{ code: string }>(page, '/cart/coupon', {
      method: 'PUT',
      token,
      body: { code: 'expirado' },
    })
    expect(expired.body.code).toBe('COUPON_EXPIRED')
    const invalid = await callApi<{ code: string }>(page, '/cart/coupon', {
      method: 'PUT',
      token,
      body: { code: 'XYZ' },
    })
    expect(invalid.body.code).toBe('COUPON_INVALID')

    const applied = await callApi(page, '/cart/coupon', { method: 'PUT', token, body: { code: 'kurio10' } })
    expect(applied.status).toBe(200)
    const quote = await callApi<Record<string, string>>(page, '/cart/quote', { token })
    // nft-002 = 1.69 ETH; 10% = 0.169; taxa de 0.0021 por linha.
    expect(quote.body.subtotalEth).toBe('1.69')
    expect(quote.body.discountEth).toBe('0.169')
    expect(quote.body.networkFeeEth).toBe('0.0021')
    expect(quote.body.totalEth).toBe('1.5231')
  })

  test('visitante adiciona itens e o carrinho é mesclado ao autenticar', async ({ page }) => {
    await openApp(page)
    const guestId = '3f0c8f5e-0d7b-4c51-9a0e-2b7c1d9e4a11'
    const headers = { 'X-Guest-Id': guestId }

    const soldOut = await callApi<{ code: string }>(page, '/cart/items', {
      method: 'POST',
      headers,
      body: { nftId: 'nft-044', editionId: '1-1', quantity: 1 },
    })
    expect(soldOut.body.code).toBe('EDITION_SOLD_OUT')
    const added = await callApi(page, '/cart/items', {
      method: 'POST',
      headers,
      body: { nftId: 'nft-007', editionId: '1-10', quantity: 2 },
    })
    expect(added.status).toBe(200)

    const token = await login(page, 'ana@kurio.dev')
    const merged = await callApi<{ items: { lineId: string; quantity: number }[] }>(page, '/cart/merge', {
      method: 'POST',
      token,
      body: { guestId },
    })
    expect(merged.body.items.map((item) => [item.lineId, item.quantity])).toEqual([
      ['nft-002__1-1', 1],
      ['nft-007__1-10', 2],
    ])
    const guestCart = await callApi<{ items: unknown[] }>(page, '/cart', { headers })
    expect(guestCart.body.items).toHaveLength(0)
  })
})

test.describe('pedidos', () => {
  test('mesma chave recupera o pedido, outro corpo conflita, confirmação remove do carrinho', async ({ page }) => {
    await openApp(page)
    const token = await login(page, 'ana@kurio.dev')
    const quote = await callApi<{ id: string; totalEth: string }>(page, '/cart/quote', { token })
    const body = { ...ORDER_BODY, quoteId: quote.body.id }
    const headers = { 'Idempotency-Key': 'e2e-key-1' }

    const first = await callApi<OrderBody>(page, '/orders', { method: 'POST', token, headers, body })
    expect(first.status).toBe(201)
    expect(first.body.status).toBe('pending')
    expect(first.body.totalEth).toBe(quote.body.totalEth)

    const repeat = await callApi<OrderBody>(page, '/orders', { method: 'POST', token, headers, body })
    expect(repeat.status).toBe(200)
    expect(repeat.body.id).toBe(first.body.id)

    const conflict = await callApi<{ code: string }>(page, '/orders', {
      method: 'POST',
      token,
      headers,
      body: { ...body, network: 'polygon' },
    })
    expect(conflict.status).toBe(409)
    expect(conflict.body.code).toBe('IDEMPOTENCY_CONFLICT')

    await expect
      .poll(async () => (await callApi<OrderBody>(page, `/orders/${first.body.id}`, { token })).body.status, {
        timeout: 6000,
      })
      .toBe('confirmed')
    const confirmed = await callApi<OrderBody>(page, `/orders/${first.body.id}`, { token })
    expect(confirmed.body.transaction?.hash).toMatch(/^0x[0-9a-f]{64}$/)

    const cart = await callApi<{ items: unknown[] }>(page, '/cart', { token })
    expect(cart.body.items).toHaveLength(0)

    const bruno = await login(page, 'bruno@kurio.dev')
    expect((await callApi(page, `/orders/${first.body.id}`, { token: bruno })).status).toBe(403)
  })

  test('cotação desatualizada após mudança de preço bloqueia o pedido', async ({ page }) => {
    await openApp(page)
    const token = await login(page, 'ana@kurio.dev')
    const quote = await callApi<{ id: string }>(page, '/cart/quote', { token })
    await page.evaluate(() => window.__kurioMock?.updateNft('nft-002', { priceEth: '1.79' }))

    const result = await callApi<{ code: string }>(page, '/orders', {
      method: 'POST',
      token,
      headers: { 'Idempotency-Key': 'e2e-key-2' },
      body: { ...ORDER_BODY, quoteId: quote.body.id },
    })
    expect(result.status).toBe(409)
    expect(result.body.code).toBe('QUOTE_OUTDATED')
  })

  test('pagamento-recusado termina como recusado e preserva o carrinho', async ({ page }) => {
    await useScenario(page, 'pagamento-recusado')
    await openApp(page)
    const token = await login(page, 'ana@kurio.dev')
    const quote = await callApi<{ id: string }>(page, '/cart/quote', { token })
    const created = await callApi<OrderBody>(page, '/orders', {
      method: 'POST',
      token,
      headers: { 'Idempotency-Key': 'e2e-key-3' },
      body: { ...ORDER_BODY, quoteId: quote.body.id },
    })
    expect(created.status).toBe(201)

    await expect
      .poll(async () => (await callApi<OrderBody>(page, `/orders/${created.body.id}`, { token })).body.status, {
        timeout: 6000,
      })
      .toBe('declined')
    const cart = await callApi<{ items: unknown[] }>(page, '/cart', { token })
    expect(cart.body.items).toHaveLength(1)
  })
})
