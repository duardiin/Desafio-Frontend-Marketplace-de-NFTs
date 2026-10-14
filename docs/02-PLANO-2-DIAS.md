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
- [ ] Tipos dos contratos REST e dos erros (validação, sessão inválida, permissão, inexistente, conflito, transitória)
- [ ] MSW: handlers, fixtures (catálogo variado, **2 usuários**), estado persistido, **reset**, cenários por configuração
- [ ] Cadastro, login, logout, sessão após refresh, expiração, rotas protegidas, retorno ao fluxo anterior
- [ ] Limpeza de cache privado ao logout/troca de usuário
- [ ] E2E: cadastro/login/logout/troca de usuário
- **Pronto quando:** dois usuários logam, sessão sobrevive ao refresh, cache não vaza entre eles.

### Bloco 3 · Descoberta e carrinho (~5h) · prompts P4, P5
- [ ] Catálogo: busca, filtros, ordenação, paginação na URL; mudar filtro reinicia página
- [ ] Respostas obsoletas descartadas; loading, vazio, erro, atualização em segundo plano
- [ ] Detalhe: acesso direto, inexistente, edição indisponível, limite de quantidade
- [ ] Favoritos com atualização otimista e rollback
- [ ] Carrinho: adicionar/alterar/remover, persistir após refresh, preservar itens do visitante ao logar
- [ ] Cupom (válido, inválido, expirado) e cotação (subtotal, desconto, taxa, total) com `decimal.js`
- [ ] E2E: filtros combinados, histórico, detalhe inexistente, favoritos com falha, carrinho e cupom
- **Pronto quando:** do catálogo ao carrinho funciona com a cotação vinda da API simulada.

---

## DIA 2

### Bloco 4 · Compra e tempo real (~6h) · prompts P6, P7
- [ ] Pagamento: validação, carteira e rede, simular conexão/recusa/desconexão
- [ ] Revalidação antes de confirmar (mudança exige nova confirmação)
- [ ] Pedido idempotente (mesma chave = mesmo pedido; conteúdo diferente = conflito)
- [ ] Estados pendente/confirmado/recusado, recuperação após refresh, recibo como snapshot, remover do carrinho só o comprado
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
| 1 Fundação | 14/10 | | Em andamento | Setup, P0, tokens e P1 concluídos (tema, layout, nav mobile, 404, skeleton, Router file-based, Query, Axios + ApiError; 17 E2E passando). Decisões em docs/04-DECISOES-P1.md. Falta conferir o deploy na Vercel. Repo: github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs · Deploy: desafio-frontend-marketplace-de-nf-alpha.vercel.app |
| 2 Contratos, MSW, sessão | | | | |
| 3 Descoberta e carrinho | | | | |
| 4 Compra e tempo real | | | | |
| 5 Conta, qualidade, entrega | | | | |

### Decisões tomadas (copie para ARCHITECTURE.md)
- Ver ARCHITECTURE.md (seção "Decisões"). Resumo: MSW fixado em 2.x; oxlint no lugar de ESLint; shadcn com base Radix; defaults de env no código; .gitattributes com LF.

### Pendências / dívidas técnicas
- Busca, carrinho e "Entrar" do header estão "em breve" até P3/P4/P5 criarem as rotas.
- E2E do skeleton com reduced motion entra no P4.
- Bundle inicial de ~516 KB (otimizar no P9).

### Se eu me perder
1. Leia a seção "Regras do jogo" acima.
2. Rode `git log --oneline` e veja o último commit.
3. Abra o Claude Code, `/clear`, e peça: "Leia CLAUDE.md e docs/02-PLANO-2-DIAS.md, me diga em que bloco estamos e o que falta para fechá-lo."
