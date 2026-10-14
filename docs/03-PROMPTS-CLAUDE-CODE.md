# 03 · Prompts prontos para o Claude Code

Como usar: abra uma conversa nova (`/clear`) para cada prompt, cole o texto e, nas tarefas grandes, peça o plano primeiro e aprove antes de codar. O Claude Code lê o `CLAUDE.md` sozinho; os prompts abaixo assumem isso.

Termine toda tarefa com: "Rode typecheck, lint e os testes do módulo, marque o item em docs/02-PLANO-2-DIAS.md e sugira a mensagem de commit."

---

## P0 · Scripts e estrutura
```
Leia CLAUDE.md e docs/00-ENUNCIADO.md. Configure o package.json com os scripts dev (mocks ativos), build, preview, typecheck, lint, test:e2e e lighthouse. Crie a estrutura de pastas (src/features, src/api/contracts, src/mocks, tests/e2e, lighthouse) e o .env.example (VITE_ENABLE_MOCKS, VITE_API_URL, VITE_MOCK_SCENARIO). Não implemente telas ainda. Mostre o plano antes de mexer.
```

## P1 · Tema, layout base e skeleton
```
Use docs/design-tokens.md (cores, tipografia, espaçamentos, raios) para configurar o tema do Tailwind e adaptar o shadcn/ui. Crie o layout base (header, footer, navegação mobile), a rota 404 e um componente Skeleton com shimmer que respeite prefers-reduced-motion e preserve dimensões. Configure TanStack Router (file-based ou code-based, a mais simples), TanStack Query e um único cliente Axios. Fontes e imagens devem ser servidas localmente.
```

## P2 · Contratos e MSW
```
Defina em src/api/contracts os tipos tipados dos recursos do enunciado (sessão/conta, NFTs, favoritos, carrinho, cotação, pedidos, perfil, carteiras) e dos erros (validação, sessão inválida, permissão, inexistente, conflito de disponibilidade, falha transitória). ETH sempre como string decimal. Depois implemente em src/mocks: handlers MSW, fixtures (catálogo com variedade suficiente para filtros e paginação, 2 usuários), estado persistido em localStorage, função de reset para um cenário conhecido e cenários configuráveis por env/query string (sucesso, vazio, latência variável, respostas fora de ordem, 4xx/5xx, timeout, sessão expirada, cupom inválido/expirado, preço alterado, edição esgotada, pagamento confirmado/recusado). Nenhuma resposta fictícia fora de src/mocks. Proponha o plano antes.
```

## P3 · Sessão e rotas protegidas
```
Implemente cadastro, login, logout e consulta de sessão integrados ao MSW via Axios + TanStack Query. A sessão deve sobreviver ao refresh e tratar expiração (inclusive durante o checkout, preservando o contexto para retomar). Rotas privadas (checkout, perfil, carteiras, favoritos, pedidos) protegidas no TanStack Router com retorno ao fluxo anterior após o login. Logout e troca de usuário limpam o cache privado do Query. Senhas nunca em claro. Valide formulários com react-hook-form + zod, incluindo erros vindos da API (conflito de cadastro). Escreva os testes E2E de cadastro, login, expiração, logout e troca de usuário.
```

## P4 · Catálogo, detalhe, favoritos
```
Implemente Início (destaques, catálogo, busca, filtros combináveis, ordenação, paginação) com TODO o estado na URL (search params do TanStack Router), sobrevivendo a refresh e histórico; mudar filtro reinicia a paginação. Query keys incluem os parâmetros; respostas obsoletas são descartadas/canceladas; trate loading (skeleton), vazio, erro e atualização em segundo plano. Implemente Detalhes do NFT (galeria, edição, quantidade com limite, acesso direto, NFT inexistente, edição indisponível). Favoritos persistem por usuário, com atualização OTIMISTA e rollback em caso de falha. Escreva os E2E correspondentes (filtros combinados, histórico, detalhe inexistente, favoritos com falha).
```

## P5 · Carrinho e cotação
```
Implemente o carrinho: adicionar, alterar, remover respeitando disponibilidade por NFT/edição; persistir após refresh; preservar os itens do visitante ao autenticar; aplicar/remover cupom com tratamento de inválido e expirado; exibir subtotal, desconto, taxa de rede e total vindos da cotação da API. ETH como string decimal com decimal.js (sem float). Skeleton no resumo. Escreva os E2E de quantidades, remoção, cupom e persistência após refresh/login.
```

## P6 · Pagamento, pedido idempotente, recibo
```
Implemente Pagamento (validação dos campos, seleção de carteira e rede, simulação de conexão/recusa/desconexão, revisão antes do envio). Antes de confirmar, revalide preço, disponibilidade, cupom e taxas; qualquer mudança exige nova confirmação do usuário. Crie o pedido com chave de idempotência (mesma chave = mesmo pedido; conteúdo diferente = conflito 409); bloqueie clique repetido e reenvio após timeout. Estados pendente/confirmado/recusado com recuperação após refresh. A confirmação só aparece para pedido confirmado pela simulação; recibo é snapshot imutável; após confirmar, remova do carrinho só o que foi comprado; em falha, preserve os itens. Escreva os E2E de compra completa, pagamento recusado, clique repetido e timeout com recuperação. Proponha o plano antes de codar.
```

## P7 · Tempo real (Socket.IO)
```
Implemente tempo real com socket.io-client na aplicação e @mswjs/socket.io-binding nos mocks (documente o transporte e as limitações). Eventos nft.updated (atualiza preço/disponibilidade em catálogo, detalhe e carrinho) e order.updated (estado do pedido), ambos com id estável, recurso e versão. Ignore duplicados e eventos antigos sem regredir estado; reconcilie com REST após reconexão; isole eventos por sessão/usuário; libere listeners ao desmontar. Implemente os cenários: (1) NFT no carrinho muda de preço, UI avisa (aria-live), resumo atualiza e o checkout bloqueia cotação desatualizada; (2) queda de conexão com pedido pendente e retomada sem nova compra. É PROIBIDO simular eventos chamando setters ou o cache direto. Escreva os E2E passando pelo cliente Socket.IO, inclusive eventos duplicados/antigos. Proponha o plano antes.
```

## P8 · Perfil, carteiras, responsividade e acessibilidade
```
Implemente Perfil (dados, avatar simples, alteração de senha) e Carteiras (principal e secundária) com validação e erros da API; alterações persistem após refresh. Depois faça uma passada de responsividade em 390, 768 e 1440 px (perfil, carteiras e confirmação também no mobile, sem overflow horizontal) e de acessibilidade: teclado, foco visível, foco em diálogos/drawers, labels e erros associados, alt em imagens, aria-live para mutations e eventos. Liste o que encontrar antes de corrigir.
```

## P9 · Testes visuais, Lighthouse e documentação
```
1) Configure Playwright (Chromium, viewports desktop e mobile), relatório HTML e traces em falhas, regressão visual de início, detalhe, carrinho e pagamento com baselines versionadas e dados estáveis (relógio, latência e eventos controlados). 2) Configure Lighthouse para início e detalhe, mobile e desktop, 3 medições cada, mediana por categoria, registrando LCP, CLS e TBT e salvando HTML/JSON em lighthouse/ com versões das ferramentas; liste causas do que ficar abaixo das metas. 3) Escreva README.md (setup, variáveis, credenciais fictícias, cenários e reset, comandos, como reproduzir falhas) e ARCHITECTURE.md (contratos REST e eventos, sessão, carrinho, cache/retries, reconciliação REST x Socket.IO, limitações, decisões de UX, desvios do Figma), usando docs/02-PLANO-2-DIAS.md (Decisões tomadas) como base.
```

## Prompts de apoio

**Onde estamos?**
```
Leia CLAUDE.md e docs/02-PLANO-2-DIAS.md. Diga em que bloco estamos, o que falta para fechá-lo e qual o próximo passo menor.
```

**Auditoria contra o enunciado (rode no fim do dia 1 e antes de entregar)**
```
Leia docs/00-ENUNCIADO.md e audite o código: liste, item a item, o que está implementado, parcial e faltando, destacando os critérios ELIMINATÓRIOS. Não corrija nada ainda.
```

**Erro de teste**
```
Este teste falhou: <cole só o trecho do erro>. Diagnostique a causa raiz antes de alterar código e proponha a correção mínima.
```

**Fechamento**
```
Simule um checkout limpo: clone em pasta temporária, npm ci, typecheck, lint, build, preview e test:e2e. Reporte qualquer falha e corrija.
```
