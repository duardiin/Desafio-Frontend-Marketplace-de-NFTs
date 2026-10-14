# Design tokens (extraídos do Figma)

Fonte: cópia do arquivo **"Marketplace de NFTs GreenMint"** (`Frontend-Challenge (Copy)`, fileKey `ZMLPqGu51wgPX02uuBG6MX`).
Extraído em 14/10 com 2 chamadas ao MCP (`get_metadata` da página e `get_design_context` do frame **Desktop / Início**, node `2:2`).
Captura de referência: [`docs/figma/desktop-inicio.png`](figma/desktop-inicio.png).

> Não chamar o MCP do Figma de novo sem o usuário pedir. Este arquivo é a fonte para P1 em diante.

## Marca e tom
- Nome da marca na UI: **KURIO** (wordmark em texto, Roboto Mono Bold 14 px, tracking 1.4 px). Não há logo em imagem.
- Tema **escuro único** (fundo quase preto amarronzado, acentos cobre/laranja). Não há tema claro no Figma.
- Todo o conteúdo do layout está em **português (pt-BR)**. Preços aparecem como `1.19 ETH` nos cards e `0,02 - 12,30 ETH` no filtro.

## Cores (variáveis do Figma)

| Token Figma | Hex | Uso observado |
|---|---|---|
| `color/ink` | `#140D0A` | Fundo da página; texto sobre botões primários |
| `color/surface-card` | `#241612` | Cards, painel de filtros, fundo do hero, footer, área da imagem do produto |
| `color/surface-dark` | `#38220F` | Input da newsletter, faixa da marca no footer, chip de carteiras |
| `color/primary` | `#D28A4C` | Botões primários, página ativa da paginação, medalhões do footer, divisórias, sublinhado ativo |
| `color/text-accent` | `#E89B55` | Preço, item de nav ativo, aba ativa, filtro selecionado, "Ler mais" |
| `color/foreground` | `#F5F1EB` | Texto principal |
| `color/text-primary` | `#F7F3EC` | Títulos do blog (praticamente igual a foreground; tratar como alias) |
| `color/text-secondary` | `#CFB28C` | Texto de apoio, descrições, itens de filtro não selecionados |
| `color/secondary` | `#B39463` | Preço antigo (riscado/comparação), placeholder de input |
| `color/border` | `#3F2319` | Borda de botões de paginação |
| `color/border-soft` | `#55321F` | Borda do chip de carteiras |
| `color/background-elevated` | `#FBFBFB` | Só aparece como máscara em SVG; não usar como cor de UI |

Outros valores:
- Gradiente do banner "NFT em destaque": `linear-gradient(to bottom, rgba(210,138,76,0.10), rgba(210,138,76,0.03))`.
- Círculos decorativos do banner: `linear-gradient(145deg, rgba(210,138,76,0.30) 46%, rgba(210,138,76,0) 103%)`; um quadrado com borda `#46A358` a 20% de opacidade (decorativo).
- Sombra do input da newsletter: `drop-shadow(0 0 10px rgba(10,6,4,0.45))`.
- Divisória do header: linha de 0.3 px na cor `primary`.

### Mapeamento sugerido para shadcn/ui (variáveis CSS)
| shadcn | Token |
|---|---|
| `--background` | ink `#140D0A` |
| `--foreground` | foreground `#F5F1EB` |
| `--card` / `--popover` | surface-card `#241612` |
| `--card-foreground` / `--popover-foreground` | foreground |
| `--primary` | primary `#D28A4C` |
| `--primary-foreground` | ink `#140D0A` |
| `--secondary` / `--muted` | surface-dark `#38220F` |
| `--secondary-foreground` | foreground |
| `--muted-foreground` | text-secondary `#CFB28C` |
| `--accent` | surface-dark `#38220F` |
| `--accent-foreground` | text-accent `#E89B55` |
| `--border` / `--input` | border `#3F2319` |
| `--ring` | text-accent `#E89B55` (foco visível) |
| `--destructive` | não definido no Figma: escolher vermelho com contraste ≥ 4.5:1 sobre ink e documentar |

## Tipografia
- **Família única: Roboto Mono** (pesos 400 Regular, 500 Medium, 700 Bold). A variável do Figma é `font/family`.
- Deve ser servida **localmente** (exigência do enunciado). Opção sugerida: pacote `@fontsource-variable/roboto-mono` (precisa de OK do usuário, pois está fora da lista de dependências) ou arquivos `.woff2` em `public/fonts/`. Remover a Geist que o shadcn instalou.

| Estilo Figma | Tamanho / altura de linha | Peso | Uso |
|---|---|---|---|
| Display/43 Bold | 43 / 70 | 700 | Título do hero ("SEJA DONO DO FUTURO / DA ARTE DIGITAL") |
| Heading/28 Bold | 28 / normal | 700 | Título de seção ("Diário da Cunhagem") |
| Heading/24 Bold | 24 / 32 | 700 | "NFT EM DESTAQUE" |
| Heading/22 Bold | 22 / 16 | 700 | "OFERTA LIMITADA" |
| Body Large/18 Bold · lh 16 | 18 / 16 | 700 | Preço nos cards, títulos de filtro, números da paginação, títulos do footer |
| Body Large/18 Bold · lh 24 | 18 / 24 | 700 | Título dos cards promocionais |
| Body Large/18 Regular | 18 / 16 | 400 | Páginas não ativas |
| Body Large/17 Bold | 17 / 16 | 700 | Títulos dos medalhões do footer |
| Body Large/16 Bold · lh 20 | 16 / 20 | 700 | Texto de botões ("EXPLORAR", "Aplicar") |
| Body Large/16 Medium | 16 / normal | 500 | "Entrar" no header |
| Body Large/16 Regular | 16 / normal | 400 | Itens de navegação; nome do NFT no card (lh 16) |
| Body/15 Medium | 15 / 16 | 500 | Abas do catálogo |
| Body/15 Regular · lh 40 | 15 / 40 | 400 | Itens de filtro |
| Body/15 Bold · lh 40 | 15 / 40 | 700 | Contagem dos filtros "(33)" |
| Body/15 Regular | 15 / normal | 400 | "Ordenar por:", faixa de preço |
| Body/14 Regular · lh 24 | 14 / 24 | 400 | Descrição do hero, descrição dos promos |
| Body/14 Regular · lh 22 / lh 30 | 14 / 22 ou 30 | 400 | Footer (texto e listas de links) |
| Body/14 Medium · lh 16 | 14 / 16, tracking 1.4 px | 500 | Eyebrow "Bem-vindo à Kurio" |
| Body/14 Medium · lh 20 | 14 / 20 | 500 | Botão "Explorar" dos promos |
| Body/14 Bold | 14 / normal, tracking 1.4 px | 700 | Wordmark KURIO |
| Caption/13 Regular · lh 22 | 13 / 22 | 400 | Texto da newsletter |
| Caption/12 Medium | 12 / 16 | 500 | Data e resumo dos cards do blog |
| Caption/12 Bold | 12 / 14 | 700 | "Ler mais" |
| Tiny/10 Medium | 10 / normal | 500 | Número do badge do carrinho |
| Tiny/9 Bold | 9 / normal, tracking 0.1 px | 700 | Chip "METAMASK • WALLETCONNECT • COINBASE" |

Observação: textos de 9 a 12 px podem prejudicar legibilidade e zoom; manter os tamanhos do Figma, mas garantir contraste e ausência de corte com zoom de 200%.

## Espaçamento e layout (desktop 1440)
- Frame de 1440 px; **container de 1200 px** centralizado (padding lateral de 120 px); padding vertical de 24 px no topo.
- **Gap entre seções da página: 96 px.**
- Escala de espaçamentos usada: 4, 6, 8, 12, 16, 20, 24, 28, 32, 40, 44, 48, 72, 88, 92, 96, 124.
- Mobile: frames de **414 px** de largura (testar em 390).

## Raios
| Uso | Raio |
|---|---|
| Paginação | 4 px |
| Botões, inputs, chips | 6 px |
| Cards promo, cards de blog | 8 px |
| Imagem dentro do card de produto | 13 a 15 px |
| Cards promocionais (imagem) | 17 a 18 px |
| Imagem do banner em destaque | 22 px |
| Imagem do hero | 24 px |
| Medalhões do footer | círculo (74 px) |

## Componentes da tela Início (desktop)

### Header (`Header With Divider`, 1200 × 45)
- Linha: wordmark **KURIO** (160 px) | nav com gap de 40 px: **Início**, Mercado, Criadores, Aprenda | ações com gap de 28 px: busca (20 px), carrinho (24 px) com badge, botão **Entrar**.
- Item ativo: texto `text-accent` Bold + sublinhado de 3 px `primary`, 24 px abaixo do texto. Os demais itens usam Regular `foreground`.
- Badge do carrinho: círculo de 16 px `primary` com borda de 2 px `ink`, número Tiny/10 Medium `ink`.
- Botão Entrar: 100 × 35, `primary`, raio 6, ícone de login de 20 px + "Entrar" Medium 16 `ink`, gap 4.
- Divisória de 0.3 px `primary` abaixo (só em Início, Perfil, Carteiras, Login, Cadastro; as telas de Mercado/compra usam header **sem** divisória).
- Ativo por tela: "Início" em Início/Login/Cadastro/Perfil/Carteiras; "Mercado" em Detalhe/Carrinho/Pagamento/Confirmação.

### Hero (1200 × 450, 32 px abaixo do header)
- Fundo `surface-card` em toda a área; conteúdo com padding-left 40 px.
- Coluna de texto de 600 px: eyebrow (Body/14 Medium, tracking 1.4) → título Display/43 (2 linhas, lh 70) → descrição (14/24 `text-secondary`, 557 px) → botão **EXPLORAR** (140 × 40, `primary`, 16 Bold `ink`) → indicador de 3 pontos `primary` (40 × 8), alinhado à direita da coluna.
- Imagem à direita: 450 × 450, raio 24.

### Catálogo (`Products`, gap de 48 px entre sidebar e grid)
**Sidebar (310 px, gap de 24 px):**
- **Filtros** (`surface-card`, padding 20, gap de 40 px entre grupos):
  - Coleções: Arte digital (33), Fotografia (12), Música (65), Arte 3D (39), Colecionáveis (23), Generativa (17), Jogos (19), Assinaturas (13), Utilidade (18). Item selecionado em `text-accent`; os demais em `text-secondary`. Lista com padding-x 12, linhas de 40 px.
  - Faixa de preço: slider de 2 pontas (thumbs de 15 px `primary` com borda `ink`, trilho `primary`), texto "Preço: 0,02 - 12,30 ETH", botão **Aplicar** (padding 8 × 12, raio 6).
  - Rede: Ethereum (119), Polygon (78), Solana (86).
  - A descrição do componente diz "collection checkboxes", então os filtros são **múltipla escolha** (combináveis).
- **Banner "NFT em destaque"** (310 × 470, gradiente cobre): "NFT EM DESTAQUE" (24 Bold `text-accent`), "OFERTA LIMITADA" (22 Bold, centralizado), imagem de 310 × 368 com raio 22.

**Grid (largura flexível, ~842 px):**
- Toolbar: abas **Todos os NFTs** (ativa, `text-accent` + sublinhado `primary` de 101 px) | Novos lançamentos | Em alta (gap de 20); à direita "Ordenar por: Listados recentemente ▾".
- 32 px abaixo, as linhas do grid: **3 colunas de 258 px**, gap vertical de 72 px, 3 linhas (9 itens por página).
- **Card de produto:** área de 258 × 300 `surface-card` com a imagem de 250 × 250 (raio 15) centralizada → 12 px → nome (16 Regular `foreground`) → preço (18 Bold `text-accent`). Variante com desconto: preço atual em `text-accent` + preço anterior em `secondary` Regular, gap 12. (Há pequenas inconsistências de posição da imagem entre cards no Figma; padronizar.)
- **Paginação** (88 px abaixo do grid, alinhada à direita): botões de 35 × 35, raio 4, gap 8; página ativa `primary` com texto `ink` Bold 18; demais com borda `border` e texto `foreground` 18; seta "próximo" no fim.

### Cards promocionais (`Promos`, 2 × 586 × 250, raio 8)
- Fundo `surface-card`; imagem à esquerda (~290 × 250, raio 18); à direita, texto alinhado à direita: título 18/24 Bold (2 linhas), descrição 14/24 `text-secondary`, botão **Explorar →** (140 × 40, `primary`, 14 Medium `ink`).
- Contornos circulares decorativos em `primary` (SVG `promo-mask.svg`).
- Textos: "Lançamentos gênesis / de edição limitada" e "Arte digital selecionada / e muito mais".

### Blog "Diário da Cunhagem" (fora do escopo funcional)
- Cabeçalho centralizado (28 Bold + 14 Regular `text-secondary`), 4 cards de 268 px com gap de 24, raio 8, imagem de 195 px, conteúdo com padding 12/16/16 e gap 8.
- O enunciado diz que páginas editoriais **não** fazem parte da entrega: renderizar a seção como conteúdo estático; os links "Ler mais" não podem aparentar sucesso funcional (ex.: desabilitados com indicação "em breve" ou apontando para um aviso).

### Footer (1200 × 610, idêntico em todas as telas)
1. Faixa `surface-card` (250 px, padding 32): 3 medalhões (círculo de 74 px `primary` com letra W/C/D em 24 Bold `ink`) com título 17 Bold e texto 14/22 `text-secondary`, separados por divisórias verticais de 1 px `primary` → bloco de newsletter "Antecipe-se ao próximo lançamento" com input `surface-dark` (placeholder "digite seu e-mail...") e botão **Enviar** (85 × 40) + texto 13/22.
2. Faixa da marca `surface-dark` (88 px): KURIO | "Feito para colecionadores, / criadores e cultura" | contato@email.com | +55 11 4002 8922.
3. Faixa `surface-card` (236 px, gap de 124 px): colunas **Meu perfil**, **Central de ajuda**, **Coleções** (links 14/30) + **Redes sociais** (5 ícones de 30 px com borda `primary` e raio 4.5) e **Carteiras compatíveis** (chip 9 Bold `text-accent`).
4. Linha final centralizada: "© 2026 Kurio. Propriedade digital para todos."

## Assets baixados (links do Figma expiram em 7 dias; já estão no projeto)

**Imagens de NFT** (`public/nfts/`, 1254 × 1254 PNG, ~2 MB cada; dados do catálogo servidos pelos mocks):
| Arquivo | Descrição (para `alt`) |
|---|---|
| `ape-green-jacket.png` | Macaco de óculos redondos e jaqueta verde (também imagem do hero) |
| `gorilla-purple-hoodie.png` | Gorila de chapéu bucket e moletom roxo (banner em destaque) |
| `gorilla-cream-jacket.png` | Gorila escuro de jaqueta creme |
| `ape-headphones.png` | Macaco dourado com fones de ouvido |

> Só existem 4 artes distintas no Figma; o catálogo vai reutilizá-las. **Performance:** converter para WebP/AVIF em tamanhos responsivos (ex.: 256, 512, 900 px) antes do Lighthouse e registrar a substituição em `ARCHITECTURE.md`.

**Ícones e decorações** (`src/assets/figma/`):
`icon-search.svg`, `icon-cart.svg`, `cart-badge.svg`, `icon-login.svg`, `icon-arrow-down.svg`, `icon-arrow-right.svg`, `icon-chevron-right.svg`, `nav-active-underline.svg`, `tab-active-underline.svg`, `header-divider.svg`, `hero-dots.svg`, `slider-thumb.svg`, `slider-track.svg`, `slider-track-active.svg`, `promo-mask.svg`, `social-facebook.svg`, `social-instagram.svg`, `social-twitter.svg`, `social-linkedin.svg`, `social-youtube.svg`.
Linhas/sublinhados/badge podem virar CSS puro (bordas) se ficar mais simples; os ícones (busca, carrinho, login, setas, redes sociais) devem usar os SVGs do Figma.

## Telas no Figma (node IDs para consultas futuras)

| Tela | Desktop (1440) | Mobile (414) |
|---|---|---|
| Início | `2:2` | `14:5226` |
| Detalhes do NFT | `10:244` | `15:5536` |
| Carrinho de NFTs | `11:1278` | `16:360` |
| Pagamento | `11:2862` | `16:748` |
| Confirmação de pedido (modal sobre o checkout) | `11:4385` | não há (adaptar) |
| Login (modal 500 × 600 sobre a home) | `9:115` | `16:1022` |
| Cadastro (modal 500 × 656 sobre a home) | `9:1022` | `16:1228` |
| Perfil do colecionador | `9:1238` | não há (adaptar) |
| Carteiras | `9:1670` | não há (adaptar) |

Observações de estrutura:
- Login, Cadastro e Confirmação são **modais com scrim** sobre outra tela (o footer fica abaixo do scrim). Mesmo assim, devem ter rota própria (acesso direto).
- Detalhe e Carrinho têm uma seção **"Related Products"** acima do footer.
- Ainda não detalhados (sem chamada gasta): todas as telas exceto Início desktop. Se necessário, priorizar `get_design_context` de Detalhe desktop (`10:244`) e Pagamento desktop (`11:2862`).

## Detalhes do NFT · desktop (node `10:244`, extraído em 14/10, 3ª chamada ao MCP)

Estrutura (container 1200, gap de 96 entre blocos, header com "Mercado" ativo e **sem** divisória):
- **Breadcrumb** "Início / Mercado" (15 Bold, lh 16), 12 px acima do produto.
- **Produto** (gap 32): coluna de imagens (573 × 448) + detalhes (flex 1, conteúdo distribuído com `justify-between` na altura das imagens).
  - Miniaturas: coluna de 4 × 100 px (gap 16, raio 8); a selecionada tem borda 1 px `primary`.
  - Imagem principal: caixa 444 × 444 `surface-card`, raio 6, padding 16; imagem 404 × 404, raio 24. Botão de zoom 30 px (círculo `#2F1D15` com borda `border`, lupa) no canto superior direito (asset `detail-zoom.svg`).
  - Nome: Heading 28 Bold. Preço: 22 Bold `text-accent`. À direita do preço: 5 estrelas de 15 px (4 cheias, 1 vazia; `icon-star-*.svg`) + "19 avaliações de colecionadores" (15 Regular).
  - Divisória de 0,3 px `primary` (573 px).
  - "Sobre este NFT:" (15 Bold) + texto 14/24 `text-secondary`.
  - "Edição:" (15 Bold) + chips em pílula (altura 28, borda fina): `1/1`, `1/10`, `1/50` (selecionado: borda e texto `text-accent`, Medium), `ABERTA`. Demais em `text-secondary` Regular 14.
  - Linha de ação: quantidade (botões circulares `primary` com borda `ink` e sombra `0 6.6 9.9 rgba(20,13,10,.15)`, ícones `icon-minus.svg`/`icon-plus.svg` de 26,4 px; número 20 Regular lh 28, gap 12) à esquerda; à direita **COMPRAR** (130 × 40, `primary`, 14 Bold `ink`) e **Favoritar** (130 × 40, borda `primary`, coração 20 px `icon-heart.svg` + 14 Medium `text-accent`), gap 8.
  - Metadados 15 Regular `secondary` (#B39463), gap 12: "ID do token: #0042", "Coleção: Kurio Apes", "Atributos: Óculos, Esmeralda, Raro".
  - "Compartilhar este NFT:" (15 Bold) + LinkedIn, e-mail, Twitter (~15 px; `share-*.svg`), gap 8.
- **Descrição** com abas: "Detalhes do NFT" (17 Bold `text-accent`, sublinhado 3 px `primary`, largura 161) | "Avaliações de colecionadores (19)" (17 Regular), gap 32, divisória 0,3 px abaixo. Conteúdo 14/24 `text-secondary` em parágrafos, e seções com título 14 Bold lh 24: **Rede**, **Contrato**, **Direitos autorais**. (No Figma os textos de "Contrato" e "Direitos autorais" estão trocados; o código pareia título e conteúdo corretamente.)
- **"Mais desta coleção"** (17 Bold `text-accent` + divisória 0,3 px): 5 cards de ~219 px (área 255 de altura `surface-card`, imagem ~212 com raio 13; nome 15 Regular; preço 16 Bold `text-accent`), `justify-between`, e indicador de 3 pontos (`carousel-dots.svg`, 52 × 12) centralizado, 32 px abaixo.
- Tokens novos vistos nesta tela: `color/surface-raised` `#2F1D15` (fundo do botão de zoom); estilo `Title/20 Regular` (20/28, número da quantidade).

Diferenças de conteúdo do footer nesta extração (o mesmo componente): "Conheça artistas, estúdios e comunidades que moldam a cultura digital **na** rede", "novidades **de listas** de acesso", "**Política** do mercado" e newsletter com o botão **Enviar** colado ao input (raio só à direita, 18 Bold).

## Pagamento · desktop (node `11:2862`, extraído em 14/10, 4ª chamada ao MCP)

Header com "Mercado" ativo e sem divisória. Trilha "Início / Mercado / Pagamento" (15 Bold). Duas colunas com gap de 32: formulário (flex 1) e resumo (405 px).

**Formulário "Perfil do colecionador"** (17 Bold), duas colunas de campos com gap de 24 (12 entre campos):
- Rótulo 15 Regular `foreground` + asterisco obrigatório **22 Regular na cor `text-coral` `#F0805F`** (token novo).
- Campo: altura 40, **borda 1 px `border` (#3F2319), raio 3, fundo transparente**; placeholder 14 Regular `secondary` (#B39463). Selects com seta `select-arrow-down.svg` (18 px) à direita.
- Coluna 1: Nome de exibição*, Rede* (select "Selecione uma rede"), Endereço da carteira* ("Endereço 0x da carteira"), Tipo de carteira* (select "Selecione uma carteira"), E-mail*.
- Coluna 2: Nome de usuário*, Nome do perfil*, campo sem rótulo "ENS ou carteira secundária (opcional)", Código de indicação*, Nome ENS* (select de 78 px com ".eth").
- Abaixo: opção "Usar outra carteira?" (círculo de 15 px) e "Observação do colecionador (opcional)" (textarea 350 × 152).

**Resumo "Seus NFTs"** (17 Bold): cabeçalho "NFTs | Subtotal" (16 Bold/Medium) + divisória 0,3 px; linhas `surface-card` de 70 px com arte 70 px (raio 8), nome 16 Bold, "ID do token: #0042" 14 `secondary`, "(x 2)" 14 `text-secondary` e total da linha 18 Bold `text-accent`. Depois: "Tem um código promocional? Aplique aqui" (14, centralizado), Subtotal (15 / valor 18), "Desconto do lançamento" "(-) 00.00", Taxa de rede + nota "Taxa estimada" (12 `text-accent`, centralizada), divisória, **Total** (16 Bold / 18 Bold `text-accent`).

**"Carteira e rede"** (17 Bold, centralizado): opções em caixas de 45 px (borda `border`, raio 3; selecionada com borda `primary`), círculo de rádio de 16 px: chip "METAMASK • WALLETCONNECT • COINBASE", "MetaMask", "Coinbase Wallet" (selecionada: rádio preenchido `radio-selected.svg`; vazio: `radio-empty.svg`). Botão **Confirmar compra**: 45 px, `primary`, **raio 8**, 15 Bold `ink`.

Observação: o componente "Checkout Page" é compartilhado com a Confirmação (`11:4385`), que é um modal sobre esta tela.

## Perfil do colecionador · desktop (node `9:1238`, extraído em 14/10, 5ª chamada ao MCP)

Header com **"Início" ativo e com divisória** (o mesmo das Carteiras). Corpo com duas colunas e gap de 28: barra lateral de 310 px + formulário (flex 1). Gap de 32 entre header e corpo.

**Barra lateral "Meu perfil"** (`surface-card`, padding vertical 8):
- Título "Meu perfil" (18 Bold, lh 16, padding 10).
- Itens de 45 px (15 Regular, lh 45, `text-accent`), padding horizontal 16, ícone de 16 a 20 px + gap 12. O ativo tem **borda esquerda de 6 px `primary`** (gap 16).
- Itens: Dados do perfil (`icon-user.svg`), Carteiras (`icon-location.svg`), Atividade (`icon-shopping.svg`), Lista de interesse (`icon-heart-outline.svg`), Ofertas (`icon-activity.svg`), Arquivos baixados (`icon-download.svg`), Suporte (`icon-danger-triangle.svg`).
- Divisória de 0,3 px e **Sair** (15 Bold, `icon-logout-accent.svg` de 20 px, altura 40, gap 8).

**Formulário "Perfil do colecionador"** (16 Bold, lh 16), gap de 32 entre blocos e 24 entre linhas de campos. Duas colunas de 417 px com `justify-between`:
- Linha 1: Nome de exibição\*, Nome de usuário\*.
- Linha 2: E-mail\*, Nome ENS\* (select de 78 px ".eth" com `ens-arrow-down.svg` de 20 px + campo de 329 px, gap 10).
- Linha 3: Apelido da carteira\*, Avatar.
- Campos com o mesmo padrão do Pagamento: rótulo 15 Regular + asterisco 22 `text-coral`, altura 40, borda 1 px `border`, raio 3. Gap de 10 entre rótulo e campo.
- **Avatar:** círculo de 50 px (`surface-raised`, borda `border`, ícone `icon-image.svg` de 24 px), gap 24, botão **Alterar** (98 × 40, `primary`, raio 3, 14 Bold `ink`) e **Remover** (14 Regular, `foreground`, gap 20).
- **"Alterar senha"** (16 Medium, lh 16): Senha atual, Nova senha, Confirmar nova senha. Uma coluna de 417 px, gap de 12 entre rótulo e campo. O campo tem o ícone de visibilidade `icon-hide.svg` (20 px, `secondary`) à direita, com padding 16.
- Botão **Salvar** (131 × 40, `primary`, raio 3, 14 Bold `ink`) ao fim do formulário, um só para os dados e a senha.

Diferenças em relação ao contrato do P2: o design tem **Nome ENS** e **Apelido da carteira** (obrigatórios) e **não tem bio**.

## Início · mobile (node `14:5226`, extraído em 14/10, 6ª e última chamada ao MCP do mês)

Frame de 414 px com padding 40 (topo) × 24 e gap 16. Visual de app: **sem header nem footer** no frame, com **tab bar fixa** embaixo. Ícones em `src/assets/figma/m-*.svg`.

- **Barra de busca** (45 px): campo `surface-card` (raio 10, padding 12, lupa `m-search.svg` 22 px + "Explorar coleções" 14 Bold `secondary`) e, 8 px à direita, **botão de filtros** 45 × 45 (raio 14, gradiente 137° `rgba(210,138,76,.45)` → `#D28A4C`, ícone `m-filter.svg` em `ink`).
- **Hero compacto** (190 px, raio 12, padding 16; fundo `m-hero-mask.svg`, círculos decorativos): à esquerda, "Bem-vindo à Kurio" (12 Medium), "SEJA DONO DA / CULTURA DIGITAL" (18 Bold, lh 29, largura 190), "Descubra NFTs selecionados de criadores do mundo todo." (12/18 `text-secondary`) e "EXPLORAR" (12 Bold `text-accent` + seta `m-arrow-right.svg` 16 px, gap 8). À direita, arte de 138 px (raio 16) com uma segunda arte de 58 px sobreposta no canto inferior esquerdo (ml 14, mt 88). Pontos `m-hero-dots.svg` (33 × 7) centralizados embaixo.
- **Abas** (gap 4 / 16): "Todos os NFTs" (14 Bold `text-accent`, sublinhado 2 px `primary` via `m-tab-underline.svg`), "Novos lançamentos" e "Em alta" (14 Regular).
- **Grade em duas colunas desencontradas** (`justify-between`; coluna direita com `pt-32`; gap vertical 24). Card de 175 px:
  - caixa de 200 px, raio 20, gradiente 139,5° `#241612` → `#2F1D15`, arte de 168 px (raio 16);
  - favorito em círculo de 28 px no canto superior direito (`m-fav-outline.svg`: fundo `surface-raised`, borda `border`, coração `primary`; os dois corações do frame são iguais, então o favoritado usa o coração preenchido);
  - selo "RARO" opcional (68 × 32, `primary`, 13 Medium `ink`) colado à esquerda, 16 px do topo;
  - nome 15 Regular e preço 16 Bold `text-accent`, com padding-left 8 e gap 8 da caixa.
- **Tab bar** (126 px, fixa embaixo): fundo curvo `m-tabbar-bg.svg` (`surface-card`) com recorte no centro para o **botão central** de 65 px (`m-tabbar-center.svg`, ícone de leitura `m-scan-*.svg`). Ícones de 20 px: Início (`m-tab-home.svg`, ativo em `text-accent`), Favoritos (`m-tab-heart.svg`), Carrinho (`m-tab-cart.svg`) e Perfil (`m-tab-user.svg`), inativos em `text-secondary`.

## Login · desktop (node `9:115`, a partir de print do frame, 14/10)

Sem chamada ao MCP (limite atingido): medidas tiradas de um print 1:1 do frame.
- **Balão** de 500 × 600, `surface-card`, sem raio e sem escurecer o fundo. Fica sobre a Início, centralizado na horizontal e ~192 px abaixo do topo. Faixa `primary` de 10 px na base. "X" de 14 px `primary` no canto superior direito.
- **Abas** centralizadas (centro em y ≈ 59): "Entrar" (20, `text-accent`) | divisória vertical de 1 × 20 `primary` | "Criar conta" (20 Medium, `foreground`).
- **Frase** "Entre para gerenciar sua carteira, coleção e perfil de criador." (13, `foreground`, centralizada, ~400 px, 2 linhas de 16).
- **Campos** de 340 × 40 (x = 80), borda `border`, raio 3, só placeholder ("contato@email.com"). A senha tem o olho `icon-hide.svg`, e o campo em foco fica com borda `primary`. Gap de 12.
- **"Esqueceu a senha?"** (14, `text-accent`) alinhado à direita; botão **Entrar** de 340 × 45, `primary`, 16 Bold `ink`.
- **Divisória** de borda a borda com "Ou continue com" (13) ao centro. Botões **Continuar com Google** e **Continuar com Facebook** (340 × 40, borda `border`, ícone de 20 px, 13 Medium `text-secondary`, gap 12). Ícones: `login-google.svg` e `login-facebook.svg`.
