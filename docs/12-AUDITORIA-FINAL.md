# Auditoria final contra o enunciado

Feita em 14/10, com o código do commit `6cfe397` e as mudanças de documentação do P9. Cada item do `docs/00-ENUNCIADO.md` foi conferido no código e nos testes. Legenda: ✅ implementado · 🟡 parcial (com motivo) · ❌ faltando.

## Critérios eliminatórios

| Critério | Status | Evidência |
|---|---|---|
| Uso efetivo da stack obrigatória | ✅ | React, TS, TanStack Router (rotas, search params, `_auth`), TanStack Query (todas as consultas e mutations), Axios (cliente único), Socket.IO (`socket.io-client`), Tailwind, shadcn/ui (Radix), MSW (REST e Socket.IO), Playwright (E2E e visual) e Lighthouse (`npm run lighthouse`). |
| Fluxos principais não apenas visuais | ✅ | Compra, conta, carrinho e favoritos integrados à API simulada, com E2E de ponta a ponta. |
| Compra confirmada só com resposta da simulação | ✅ | A confirmação só aparece com `status: confirmed` vindo da API ou do evento (`checkout.spec`, `realtime.spec`). |
| Sem exposição de dados entre usuários | ✅ | Cache privado por `userId`, purga no logout e na troca de conta, socket por sessão e filtro duplo de `order.updated` (`auth.spec`, `realtime.spec`). |
| Eventos não simulados direto na UI | ✅ | Os testes mudam só o "servidor" (`__kurioMock`); o evento chega pelo `socket.io-client`. |
| Testes E2E executáveis | ✅ | `npm run test:e2e`: 152 testes (desktop e mobile), executados duas vezes seguidas sem falha. |

## 1–3. Escopo, stack, telas e fluxos

| Item | Status | Observação |
|---|---|---|
| Início: destaques, catálogo, busca, filtros, ordenação e navegação | ✅ | |
| Detalhe: galeria, informações, edição, quantidade, favoritos e compra | ✅ | |
| Carrinho: quantidades, remoção, cupom e resumo | ✅ | |
| Pagamento: dados, carteira e rede, revisão e envio | ✅ | |
| Confirmação: resultado, transação, itens, taxas e total | ✅ | Modal na página do pedido, com recibo em snapshot. |
| Login e Cadastro: validação, retorno ao fluxo e conflito | ✅ | |
| Perfil: dados, avatar e senha | ✅ | Figma `9:1238`. |
| Carteiras: principal e secundária | ✅ | Sem frame extraído; segue o padrão do Perfil e do Pagamento. |
| Frames desktop | 🟡 | Extraídos: Início, Detalhe, Pagamento e Perfil. Carrinho, Confirmação e Carteiras foram adaptados do padrão dessas telas, por causa do limite de chamadas do Figma (6 por mês). |
| Frames mobile | 🟡 | Início mobile extraído e implementado. Detalhe, Carrinho, Pagamento, Login e Cadastro mobile foram adaptados (layout responsivo das telas desktop, com tab bar), pelo mesmo limite. |
| Perfil, carteiras e confirmação em mobile | ✅ | Verificados na varredura de 390 px e nos E2E mobile. |
| Fora do escopo sem aparentar sucesso | ✅ | "Em breve" com `aria-disabled` e sem foco; newsletter avisa que não está disponível. |
| Catálogo: estado na URL, filtros combináveis, paginação reiniciada, vazio, falha e fora de ordem | ✅ | |
| Detalhe: acesso direto, inexistente, edição indisponível e limite de quantidade | ✅ | |
| Favoritos persistentes | ✅ | |
| Carrinho: disponibilidade por edição, refresh, mescla ao entrar, cupom, valores da API e mudanças ao vivo | ✅ | |
| Pagamento: validação, revisão, carteiras, rede, conexão, recusa e desconexão | ✅ | |
| Revalidação com nova confirmação | ✅ | |
| Sem pedidos duplicados (clique repetido e timeout) | ✅ | |
| Pendente, confirmado e recusado, com recuperação após refresh ou reconexão | ✅ | |
| Itens preservados em falha; só os comprados saem do carrinho | ✅ | |
| Recibo em snapshot; transação e explorador simulados | ✅ | |
| Sessão recuperável, expiração na navegação e no checkout, limpeza no logout | ✅ | |
| Validação de cadastro, perfil, senha e carteiras com erros da API; persistência | ✅ | |
| Senhas não armazenadas em claro | ✅ | Salt + SHA-256 no servidor simulado. |

## 4–5. Integração, estado e contratos

| Item | Status |
|---|---|
| Contratos tipados entre transporte, estado e interface | ✅ |
| Estados de carregamento, vazio, erro, sucesso e atualização em segundo plano | ✅ |
| Invalidação coerente após mutations e eventos | ✅ |
| Cancelamento ou descarte de respostas obsoletas | ✅ |
| Isolamento por usuário e por parâmetros | ✅ |
| Recuperação de falhas sem duplicar operações | ✅ |
| Rotas inexistentes e acesso direto a todas as telas | ✅ |
| Atualização otimista com rollback (favoritos) | ✅ |
| Política de cache, retries e sincronização documentada | ✅ (ARCHITECTURE, "Visão geral") |
| Recursos REST mínimos e erros de validação, sessão, permissão, inexistente, conflito e transitória | ✅ (`docs/contratos-api.md`) |
| Idempotência: mesma tentativa recupera, chave com corpo diferente dá conflito | ✅ |

## 6–7. Mocking e tempo real

| Item | Status |
|---|---|
| Mocks só na camada de rede; nada fictício em componentes, hooks ou Axios | ✅ |
| Estado consistente entre os recursos; persistência e reset integral | ✅ |
| Cenários de rede e falha configuráveis e reproduzíveis | ✅ (17 cenários) |
| Fixtures com variedade (47 NFTs) e dois usuários | ✅ |
| Cenários determinísticos exigidos (sucesso/vazio, latência/fora de ordem, conexão/4xx/5xx, sessão expirada/não autorizado, conflito, cupom, preço/esgotado, timeout com idempotência, confirmado/recusado) | ✅ |
| Eventos via MSW compatível com Socket.IO; transporte e limitações documentados | ✅ (`docs/10-DECISOES-P7.md`) |
| Mocks ativados por configuração e presentes no build publicado | ✅ |
| Mudanças refletidas no REST e nos eventos | ✅ |
| `nft.updated` e `order.updated` com id, recurso e versão; duplicatas e eventos antigos tolerados | ✅ |
| Reconciliação a cada conexão (inclusive a primeira) e após reconexão; isolamento entre sessões; listeners liberados | ✅ |
| Cenário do carrinho com preço alterado durante o checkout | ✅ |
| Queda com pedido pendente e retomada sem nova compra | ✅ |

## 8. Interface, responsividade e acessibilidade

| Item | Status | Observação |
|---|---|---|
| Fidelidade ao Figma e shadcn adaptado ao tema | 🟡 | Fiel nas telas extraídas; as demais seguem o mesmo padrão (ver "Frames" acima). Desvios em ARCHITECTURE. |
| 390, 768 e 1440 px sem overflow | ✅ | `responsive.spec.ts` (14 telas × 3 larguras). |
| Skeletons com shimmer (catálogo, detalhe e resumo do carrinho), sem deslocar o layout e com movimento reduzido | ✅ | `catalog.spec` confere o `prefers-reduced-motion`. |
| Teclado, foco visível e foco em diálogos e drawers | ✅ | |
| Semântica, labels e erros associados | ✅ | axe sem violações. |
| Alternativas textuais para imagens | ✅ | |
| Contraste e estados não dependentes só de cor | ✅ | |
| Feedback acessível de mutations e tempo real | ✅ | Região `aria-live`. |
| Perda de conteúdo com zoom | 🟡 | Coberto indiretamente: 390 px equivale a ~370% de zoom num monitor de 1440. Não há teste específico de zoom do navegador. |
| Assets locais e substituições documentadas | ✅ | WebP gerado das artes do Figma; fonte local. |

## 9. Testes

| Item | Status |
|---|---|
| Todos os fluxos listados no enunciado (busca até skeletons/recuperação) | ✅ |
| Chromium desktop e mobile | ✅ |
| Regressão visual de início, detalhe, carrinho e pagamento, com baselines versionadas e dados estáveis | ✅ (`npm run test:visual`; baselines do Windows) |
| Estado isolado por teste; relógio, latência e eventos controlados | ✅ |
| Relatório HTML e traces das falhas | ✅ |
| REST pelos handlers MSW; tempo real pelo `socket.io-client` | ✅ |

## 10. Performance e Lighthouse

| Item | Status | Observação |
|---|---|---|
| Início e detalhe, mobile e desktop, build otimizado, cenário padrão | ✅ | |
| 3 medições e mediana; configuração versionada; HTML/JSON; versões e ambiente | ✅ | |
| LCP, CLS e TBT registrados | ✅ | |
| Metas | 🟡 | Desktop 98/100/100/100. Mobile: Accessibility, Best Practices e SEO em 100; **Performance 79 (Início) e 76 (Detalhe)**, abaixo de 90. Causas e experimentos em `lighthouse/ANALISE.md`. |

## 12. Entrega

| Item | Status |
|---|---|
| Código, lockfile, assets, mocks, fixtures, testes e configuração da auditoria | ✅ |
| Deploy na Vercel, correspondente ao código, com mocks e tempo real; acesso direto e refresh | ✅ |
| README completo (setup, variáveis, credenciais, cenários, comandos e reprodução de falhas) | ✅ |
| ARCHITECTURE com contratos, sessão, carrinho, cache, reconciliação, limitações, UX e desvios | ✅ |
| Comandos de dev, build, preview, typecheck, lint, testes e Lighthouse | ✅ |
| Execução a partir de checkout limpo | ✅ (ver o relatório do checkout limpo no registro de progresso) |
