# Kurio · Marketplace de NFTs

Desafio frontend: marketplace de NFTs em React + TypeScript seguindo o Figma "GreenMint". APIs, autenticação, carteiras e pagamentos são **simulados com MSW**, na camada de rede. Não há blockchain, extensão de carteira ou gateway reais.

- Repositório: https://github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs
- Deploy: https://desafio-frontend-marketplace-de-nf-alpha.vercel.app
- Arquitetura e decisões: [ARCHITECTURE.md](ARCHITECTURE.md)
- Contratos REST: [docs/contratos-api.md](docs/contratos-api.md)

## Setup

Requisitos: Node 20.19+ (desenvolvido com Node 24) e npm.

```bash
npm ci
npx playwright install chromium   # só para os testes E2E
npm run dev                       # http://localhost:5173, com mocks
```

Um checkout limpo roda sem `.env`: os valores padrão ficam em `src/config/env.ts` e espelham o `.env.example`.

## Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `VITE_ENABLE_MOCKS` | `true` | Ativa o MSW. Fica `true` também no build publicado. |
| `VITE_API_URL` | `/api` | Base das chamadas REST do cliente Axios. |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial dos mocks (ver abaixo). |
| `VITE_HTTP_TIMEOUT_MS` | `10000` | Timeout das chamadas REST. Os testes E2E usam 3000. |

## Credenciais fictícias

| Usuário | E-mail | Senha |
|---|---|---|
| Ana Ribeiro | `ana@kurio.dev` | `Kurio@123` |
| Bruno Carvalho | `bruno@kurio.dev` | `Kurio@123` |

Os dois têm favoritos, carrinho e carteiras diferentes, para demonstrar o isolamento entre contas. O "servidor" simulado guarda só o salt e o hash SHA-256 da senha.

## Cenários e reset dos mocks

O estado da API simulada fica no `localStorage` do navegador e sobrevive ao refresh.

- **Trocar de cenário:** abra qualquer URL com `?cenario=<nome>`, por exemplo `/?cenario=lento`. O cenário vale para a aba até ser trocado. O parâmetro sai da URL depois de aplicado.
- **Reset:** `?reset=1` restaura integralmente os dados iniciais e encerra as sessões. Dá para combinar os dois: `/?cenario=default&reset=1`.
- **Console:** `window.__kurioMock` expõe `getScenario()`, `setScenario(nome)`, `reset()`, `updateNft(id, { priceEth, available })` e `expireSessions()`.

| Cenário | Comportamento |
|---|---|
| `default` | Sucesso, latência fixa de 150 ms |
| `vazio` | Catálogo sem resultados |
| `lento` | Todas as respostas com 2,5 s |
| `latencia-variavel` | Latência entre 200 ms e 2 s (sequência determinística) |
| `fora-de-ordem` | Buscas do catálogo alternam 1,8 s e 0,2 s, e as respostas chegam fora de ordem |
| `offline` | Falha de conexão em todas as chamadas |
| `erro-500` | Catálogo e detalhe respondem 500 |
| `falha-temporaria` | A 1ª chamada de cada recurso responde 503; as seguintes funcionam |
| `timeout` | Catálogo e detalhe nunca respondem (estoura o timeout do cliente) |
| `sessao-expirada` | Sessões novas expiram em 30 s |
| `favorito-falha` | Incluir e remover favoritos respondem 500 |
| `pagamento-recusado` | Pagamentos são recusados pela simulação |
| `pedido-timeout` | O pedido é gravado, mas a 1ª resposta estoura o timeout; reenviar com a mesma chave recupera o pedido |
| `preco-alterado` | O preço de um item sobe ao enviar o pedido (409 `QUOTE_OUTDATED`) |
| `edicao-esgotada` | Um item esgota ao enviar o pedido (409 `EDITION_SOLD_OUT`) |

Os casos de negócio vêm dos dados e funcionam em qualquer cenário:

- **Cupons:** `KURIO10` dá 10% de desconto; `EXPIRADO` está vencido; qualquer outro código é inválido.
- **Edições:** `nft-001` (Emerald Ape #042) tem as quatro edições do Figma, com a 1/1 esgotada. `nft-044` (Onyx Relic #001) tem todas as edições esgotadas. `nft-045` (Amber Pilot #777) tem uma única unidade.
- **Cadastro com e-mail já usado** (`ana@kurio.dev`) responde 409 `EMAIL_TAKEN`.

## Estado do catálogo na URL

Busca, filtros, aba, ordenação e paginação ficam na URL e sobrevivem a refresh e ao histórico. Exemplo:

`/?q=golden&colecao=musica,arte-3d&rede=polygon&precoMin=0.5&precoMax=3&aba=em-alta&ordem=preco-asc&pagina=2`

No detalhe, a edição escolhida também fica na URL: `/nft/nft-001?edicao=1-50`.

## Imagens

As artes do Figma (`design/nfts-original/*.png`, ~2 MB cada) são convertidas em WebP de 256, 512 e 900 px por `node scripts/optimize-images.mjs`, usando o Chromium do Playwright. As versões ficam em `public/nfts/` e são versionadas.

## Comandos

```bash
npm run dev          # desenvolvimento com mocks
npm run build        # typecheck + build de produção
npm run preview      # serve o build
npm run typecheck    # tsc -b (app, config e testes)
npm run lint         # oxlint, falha com warnings
npm run test:e2e     # Playwright (desktop 1440 e mobile 390)
npm run lighthouse   # auditoria (implementada no bloco final)
```

## Como reproduzir os fluxos de sessão

- **Rota protegida:** abra `/perfil` sem sessão. O app vai para o login e, depois de entrar, volta para `/perfil`.
- **Expiração durante o uso:** entre, abra `/perfil` e rode `window.__kurioMock.expireSessions()` no console. Na próxima navegação para uma rota privada (ou no refresh), o app avisa e pede login, voltando à mesma tela.
- **Expiração com a tela aberta:** use `/?cenario=sessao-expirada`. As sessões novas duram 30 s e o app reage sozinho ao vencer.
- **Troca de usuário:** entre como Ana, saia e entre como Bruno. Nenhum dado da Ana aparece. Com duas abas abertas, entrar ou sair numa aba atualiza a outra.

O relatório HTML do Playwright fica em `playwright-report/`, e os traces das falhas em `test-results/`.
