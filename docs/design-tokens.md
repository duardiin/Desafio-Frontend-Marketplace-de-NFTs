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
