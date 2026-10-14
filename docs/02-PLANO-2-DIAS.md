# 02 · Plano de 2 dias + registro de progresso

Prazo: `16/10 às 09:14h` (fechamento a partir de 16/10 06:14). Reserve as **últimas 3 horas** só para fechamento e teste de checkout limpo. Se o prazo real for menor, corte pela "ordem de corte" no final.

## Regras do jogo
1. Eliminatórios primeiro (stack efetiva, fluxos funcionais, compra só confirmada pela simulação, isolamento entre usuários, eventos via `socket.io-client`, E2E executável).
2. Cada bloco termina com: `typecheck` + `lint` + testes do bloco passando + commit + deploy verde.
3. Se um bloco estourar o tempo em mais de 30%, simplifique e registre em `ARCHITECTURE.md` em vez de atrasar o resto.
4. Prompts de cada bloco estão em `03-PROMPTS-CLAUDE-CODE.md` (P0 a P9).

---

## DIA 1

### Bloco 1 · Fundação (~3h) · prompts P0, P1
- [x] Setup completo (`01-SETUP-VSCODE.md`) e deploy vazio na Vercel funcionando
- [x] Scripts do `package.json`
- [x] Tokens do Figma em `docs/design-tokens.md` e no tema do Tailwind/shadcn (P1)
- [x] Layout base (header, footer, nav mobile), skeleton com shimmer, rota 404
- [x] Router + Query + Axios configurados (cliente único)
- **Pronto quando:** app sobe local e na Vercel, tema bate com o Figma, typecheck e lint passam.

### Bloco 2 · Contratos, MSW e sessão (~4h) · prompts P2, P3
- [x] Tipos dos contratos REST e dos erros (validação, sessão inválida, permissão, inexistente, conflito, transitória)
- [x] MSW: handlers, fixtures (catálogo variado, **2 usuários**), estado persistido, **reset**, cenários por configuração
- [x] Cadastro, login, logout, sessão após refresh, expiração, rotas protegidas, retorno ao fluxo anterior
- [x] Limpeza de cache privado ao logout/troca de usuário
- [x] E2E: cadastro/login/logout/troca de usuário
- **Pronto quando:** dois usuários logam, sessão sobrevive ao refresh, cache não vaza entre eles.

### Bloco 3 · Descoberta e carrinho (~5h) · prompts P4, P5
- [x] Catálogo: busca, filtros, ordenação, paginação na URL; mudar filtro reinicia página
- [x] Respostas obsoletas descartadas; loading, vazio, erro, atualização em segundo plano
- [x] Detalhe: acesso direto, inexistente, edição indisponível, limite de quantidade
- [x] Favoritos com atualização otimista e rollback
- [x] Carrinho: adicionar/alterar/remover, persistir após refresh, preservar itens do visitante ao logar
- [x] Cupom (válido, inválido, expirado) e cotação (subtotal, desconto, taxa, total) com `decimal.js`
- [x] E2E: filtros combinados, histórico, detalhe inexistente, favoritos com falha, carrinho e cupom
- **Pronto quando:** do catálogo ao carrinho funciona com a cotação vinda da API simulada.

---

## DIA 2

### Bloco 4 · Compra e tempo real (~6h) · prompts P6, P7
- [x] Pagamento: validação, carteira e rede, simular conexão/recusa/desconexão
- [x] Revalidação antes de confirmar (mudança exige nova confirmação)
- [x] Pedido idempotente (mesma chave = mesmo pedido; conteúdo diferente = conflito)
- [x] Estados pendente/confirmado/recusado, recuperação após refresh, recibo como snapshot, remover do carrinho só o comprado
- [ ] Socket.IO: `socket.io-client` + `@mswjs/socket.io-binding`; `nft.updated` e `order.updated` com id, recurso e versão
- [ ] Dedupe de duplicados/antigos, reconciliação com REST após reconexão, liberar listeners, isolar por sessão
- [ ] Cenário: NFT no carrinho muda de preço, UI avisa, resumo atualiza, checkout bloqueia cotação antiga
- [ ] Cenário: queda de conexão com pedido pendente e retomada sem nova compra
- [ ] E2E: compra completa, pagamento recusado, clique repetido, timeout com recuperação, eventos via socket
- **Pronto quando:** compra completa funciona e os dois cenários de tempo real passam em E2E.

### Bloco 5 · Conta, qualidade e entrega (~5h) · prompts P8, P9
- [ ] Perfil (dados, avatar simples, senha) e carteiras (principal/secundária) com validação e erros da API
- [ ] Passada de responsividade em 390, 768 e 1440 px (perfil, carteiras e confirmação também no mobile)
- [ ] Acessibilidade: teclado, foco em diálogos/drawers, labels e erros associados, `aria-live`
- [ ] Regressão visual (início, detalhe, carrinho, pagamento) em desktop e mobile, baselines versionadas
- [ ] Lighthouse: início e detalhe, mobile e desktop, 3 medições, mediana, LCP/CLS/TBT, justificar o que ficar abaixo
- [ ] README.md e ARCHITECTURE.md completos
- [ ] Teste de **checkout limpo** (clone novo, `npm ci`, rodar tudo) e deploy final conferido
- [ ] Enviar link do repositório + URL pública

---

## Ordem de corte (se o tempo apertar)
Proteja nesta ordem, do mais ao menos importante:
1. Eliminatórios.
2. Fluxos e experiência (20 pts) e fidelidade visual (20 pts).
3. Integração e estado (15 pts).
4. Tempo real, Mocking e Testes (10 pts cada).
5. Acessibilidade, Performance e Documentação (5 pts cada), sem deixar de entregar README e deploy.

Pode simplificar (e registrar): upload de avatar simulado simples, tablet só com checagem visual, Lighthouse com justificativa, estados raros do Figma reaproveitando o padrão existente.

---

## Registro de progresso (atualize ao fim de cada bloco)

| Bloco | Início | Fim | Status | Observações / o que ficou de fora |
|---|---|---|---|---|
| 1 Fundação | 14/10 | 14/10 | Concluído | Setup, P0, tokens e P1 concluídos (tema, layout, nav mobile, 404, skeleton, Router file-based, Query, Axios + ApiError; 17 E2E passando). Decisões em docs/04-DECISOES-P1.md. Deploy conferido (fonte local, 404 em acesso direto, sem overflow em 390). Repo: github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs · Deploy: desafio-frontend-marketplace-de-nf-alpha.vercel.app |
| 2 Contratos, MSW, sessão | 14/10 | 14/10 | Concluído | P2: contratos tipados, MSW com 47 NFTs, 2 usuários, 15 cenários, reset, idempotência e liquidação de pedidos (16 E2E). P3: login/cadastro em modal com rota, sessão por token, expiração em 3 pontos, rotas protegidas com retorno, cache privado por usuário, avisos aria-live (9 E2E × desktop/mobile). Decisões em docs/05 e docs/06. Perfil só leitura até o P8. |
| 3 Descoberta e carrinho | 14/10 | 14/10 | Concluído | P5: carrinho na API (visitante por X-Guest-Id, mescla no login), cotação como única fonte de valores, cupom, avisos de preço/esgotado, badge no header, COMPRAR no detalhe; 96 E2E passando. Decisões em docs/08. P4: Início completa (hero, catálogo com estado na URL, destaque, promos, blog), detalhe do Figma 10:244 (3ª chamada ao MCP) com edições por NFT, favoritos otimistas, imagens WebP; 84 E2E passando. Decisões em docs/07. Falta P5 (carrinho e cotação). |
| 4 Compra e tempo real | 14/10 | | Em andamento | P6 concluído: pagamento do Figma 11:2862 (4ª chamada ao MCP), conexão de carteira simulada (recusa/desconexão), revisão com revalidação, pedido idempotente (clique repetido, timeout), estados e recibo, rascunho após expiração; 116 E2E passando. Decisões em docs/09. Falta P7 (Socket.IO). |
| 5 Conta, qualidade, entrega | | | | |

### Decisões tomadas (copie para ARCHITECTURE.md)
- Ver ARCHITECTURE.md (seção "Decisões"). Resumo: MSW fixado em 2.x; oxlint no lugar de ESLint; shadcn com base Radix; defaults de env no código; .gitattributes com LF.

### Pendências / dívidas técnicas
- "Usar outra carteira?" do pagamento "em breve" até o P8.
- Pedido pendente acompanhado por consulta periódica até o P7.
- E2E do skeleton com reduced motion entra no P4.
- Bundle inicial de ~337 KB + chunk do MSW de ~420 KB antes do render (medir no P9).

### Se eu me perder
1. Leia a seção "Regras do jogo" acima.
2. Rode `git log --oneline` e veja o último commit.
3. Abra o Claude Code, `/clear`, e peça: "Leia CLAUDE.md e docs/02-PLANO-2-DIAS.md, me diga em que bloco estamos e o que falta para fechá-lo."
