# Review do dia · 14/10/2026

Fechamento do primeiro dia. Prazo de entrega: **16/10 às 09:14**.

- Deploy: https://desafio-frontend-marketplace-de-nf-alpha.vercel.app
- Repositório: https://github.com/duardiin/Desafio-Frontend-Marketplace-de-NFTs
- Último commit do dia: `11a4140` (pagamento mobile)

## 1. Resumo

O plano de 2 dias (`docs/02-PLANO-2-DIAS.md`) foi executado inteiro num dia: os **5 blocos e os prompts P0 a P9**. A segunda metade do dia foi de refinamento: fidelidade mobile ao Figma, correções achadas em celular real e auditoria contra o enunciado.

| Indicador | Valor |
|---|---|
| Commits no dia | 75 |
| Testes E2E (Playwright, desktop 1440 + mobile 390) | **161 passando**, sem falhas |
| Testes de regressão visual | **16 baselines** passando |
| Typecheck / lint (`--deny-warnings`) | limpos |
| Acessibilidade (axe, WCAG 2.2 AA) | 0 violações nas telas auditadas |
| Overflow horizontal | 0 em 14 telas × 390/768/1440 |
| Critérios eliminatórios | **todos atendidos** (`docs/12-AUDITORIA-FINAL.md`) |
| Checkout limpo (clone do GitHub + `npm ci`) | passou (typecheck, lint, build, E2E, visual) |

## 2. Linha do tempo

| Horário | Bloco | Entrega |
|---|---|---|
| 11h50–12h35 | 1 · Fundação (P0–P1) | Setup, tokens do Figma no tema, layout, 404, skeleton, Router, Query, Axios |
| 13h00–13h15 | 2 · Contratos, MSW, sessão (P2–P3) | Contratos tipados, API simulada com 17 cenários, login/cadastro, rotas protegidas, isolamento por usuário |
| 13h45–14h00 | 3 · Descoberta e carrinho (P4–P5) | Início com catálogo na URL, detalhe com edições, favoritos otimistas, carrinho com cotação e cupom |
| 14h30 | 4a · Compra (P6) | Pagamento, conexão de carteira simulada, revisão, pedido idempotente, recibo |
| 17h20 | 4b · Tempo real (P7) | Socket.IO real no cliente + servidor simulado no MSW, eventos versionados, reconciliação |
| 17h45–18h40 | 5a · Conta e qualidade (P8) | Perfil (Figma), carteiras, Início mobile (Figma), passadas de responsividade e acessibilidade |
| 19h35 | 5b · Entrega (P9) | Regressão visual, Lighthouse, README e ARCHITECTURE finais, auditoria, checkout limpo |
| 20h10–20h50 | Ajustes pós-teste | Reconciliação na 1ª conexão, login no "balão" do Figma, tab bar em celular real |
| 23h10–23h35 | Mobile pelos prints | Footer com destinos, Detalhe, Carrinho e Pagamento mobile pelos frames do Figma |

## 3. O que está entregue

### Telas (todas do enunciado)
- **Início:** hero, catálogo com busca, filtros, abas, ordenação e paginação na URL, destaque, promoções e blog. **Mobile do Figma:** busca no topo, grade desencontrada, selo RARO e tab bar.
- **Detalhe:** galeria, edições, quantidade, favoritos, compra, abas, relacionados. **Mobile do Figma.**
- **Carrinho:** quantidades, remoção, cupom, valores da cotação, mescla do visitante ao entrar. **Mobile do Figma.**
- **Pagamento:** dados do colecionador, carteira, rede, conexão simulada, revisão com revalidação e envio idempotente. **Mobile do Figma.**
- **Confirmação e recibo:** modal só com pedido confirmado; recibo em snapshot; transação simulada.
- **Login e cadastro:** "balão" do Figma aberto sobre a tela atual, com abas, além das rotas próprias.
- **Perfil** (Figma) e **Carteiras** (principal e secundária, com troca de papel).

### Arquitetura
- **Stack obrigatória** em uso efetivo. Os mocks vivem só no MSW (REST e Socket.IO).
- **Tempo real:**
  - `nft.updated` e `order.updated` com id, recurso e versão; duplicatas ignoradas;
  - a regra "nunca voltar a uma versão antiga" vale para eventos **e** para respostas REST;
  - reconciliação a cada conexão do socket.
- **Sessão:** cache privado por usuário, purgado no logout e na troca de conta; socket por sessão.

### Documentação
- **Entrada:** README com setup, cenários e o passo a passo de cada fluxo e falha; ARCHITECTURE com a visão geral por tema.
- **Contratos e decisões:** contratos em `docs/contratos-api.md`; decisões por etapa nos `docs/04` a `docs/11`; auditoria no `docs/12`.
- **Figma e auditoria:** medidas dos frames em `docs/design-tokens.md`; Lighthouse em `lighthouse/RESULTADOS.md` e `lighthouse/ANALISE.md`.

## 4. Problemas reais encontrados e corrigidos

| Problema | Como apareceu | Correção |
|---|---|---|
| A faixa da conta alargava a página para ~1080 px no mobile | Medição de `innerWidth` | `relative` na faixa (os textos sr-only escapavam) |
| As abas do detalhe se sobrepunham ao texto em 390 px | Revisão das capturas | Abas numa linha, roláveis |
| Aviso falso "esgotou" depois da própria compra | Varredura de responsividade | Aviso só depois de recarregar o carrinho |
| Teste que passava também com o bug (`toHaveCount(0)` esperava o aviso sumir) | Validação do teste contra o código antigo | Checagem instantânea; todo teste de regressão novo é confirmado contra o código antigo |
| Mudança de preço antes da 1ª conexão do socket não aparecia | Teste manual em produção | Reconciliação também na primeira conexão |
| Resposta REST antiga sobrescrevia evento novo | Teste de tempo real intermitente | Regra de versão nas respostas REST (`structuralSharing`) |
| "Entrar" trocava a página pela Início | Print do frame de login | Balão aberto sobre a tela atual |
| Tab bar desalinhada e cortada em celulares de ~360 px | Teste em dois celulares reais | Grade que sempre cabe; teste de 320 a 414 px |
| 3 problemas de acessibilidade no detalhe mobile | axe nos E2E | Corrigidos antes do commit |

## 5. Decisões que vale conhecer

- **Figma:** as 6 chamadas do mês ao MCP foram usadas (Início desktop e mobile, Detalhe, Pagamento, Perfil e metadados). Login, Detalhe, Carrinho e Pagamento mobile vieram de **prints** enviados por você.
- **Sem frame visto:** Carrinho, Confirmação e Carteiras no desktop, e a aba **Criar conta**. Seguem o padrão das telas extraídas.
- **Experimento revertido:** desenhar a tela antes de o MSW subir rendia +5 no Lighthouse, mas criou corridas. Correção vem antes de pontuação.
- **Fora do escopo** (enunciado): "Esqueceu a senha?", login social, Criadores, Aprenda, Atividade, Ofertas e Suporte ficam com o visual e marcados "em breve", sem aparentar funcionar.
- **Botão central da tab bar:** só visual, até decidirmos a função.
- **Regressão visual** fica em `npm run test:visual`, fora do `test:e2e`, porque as baselines são do Windows.

## 6. Pendências e riscos

| # | Item | Situação |
|---|---|---|
| 1 | **Lighthouse mobile:** Performance 79 (Início) e 76 (Detalhe), contra a meta de 90 | Documentado com causas (~180 KB da camada de mocks). Alto risco de mexer agora. As demais categorias estão em 100. |
| 2 | Lighthouse **não foi refeito** depois das telas mobile novas | Rodar de novo para os relatórios corresponderem ao código final |
| 3 | Aba **Criar conta** montada sem ver o frame | Conferir com um print |
| 4 | Frames desktop não vistos: Carrinho, Confirmação e Carteiras | Conferir com prints, se houver tempo |
| 5 | Função do **botão central** da tab bar | Decidir (ou manter só visual) |
| 6 | `docs/12-AUDITORIA-FINAL.md` com números de antes das telas mobile | Atualizar no fechamento |
| 7 | Bundle inicial de ~379 KB (120 KB gzip) | Só documentar |

## 7. Plano para amanhã (15/10)

1. **Roteiro do avaliador** no link de produção, em desktop e no celular, anotando o que parecer estranho (checklist de 10 minutos combinado ontem).
2. **Prints que faltam** (Criar conta e, se possível, Carrinho, Confirmação e Carteiras desktop), com ajustes de fidelidade.
3. **Rodar o Lighthouse de novo** com o código final, atualizar `RESULTADOS.md`, a análise e a auditoria (`docs/12`).
4. **Checkout limpo** e conferência final do deploy.
5. **Envio** do repositório e da URL antes de 16/10 às 09:14. O ideal é fechar até a noite de 15/10, deixando a manhã de 16/10 como margem.
