# Análise do Lighthouse

Resultados medidos em [`RESULTADOS.md`](RESULTADOS.md). Relatórios por medição em `reports/`.

## Resumo

- **Desktop:** Início e Detalhe cumprem as metas nas quatro categorias. Performance fica em ~98, e Accessibility, Best Practices e SEO em 100.
- **Mobile:** Accessibility, Best Practices e SEO estão em 100. **Performance fica abaixo da meta de 90** (~78 no Início e ~77 no Detalhe, mediana de 3, medida de 15/10 com as telas mobile finais).
- **CLS e TBT** estão bons nos dois perfis (CLS ≤ 0,02; TBT ≤ ~180 ms). O que falta no mobile é **FCP e LCP**, ambos em ~3,2 a 4,5 s.

## Por que o mobile fica abaixo de 90

O perfil mobile do Lighthouse simula **4G lento** (~1,6 Mbps, RTT de 150 ms) e **CPU 4× mais lenta**. Nessas condições, o tempo até o primeiro conteúdo é dominado pelo **volume de JavaScript baixado antes do primeiro render**: ~**426 KB** (gzip) de JS e CSS na primeira visita ao Início.

| Parte | Tamanho (gzip) | Observação |
|---|---|---|
| Camada de mocks (MSW, servidor Socket.IO simulado, dados) | **~180 KB (43%)** | `start` 15 KB + `browser` 31 KB + chunk `realtime` 130 KB. Só existe porque a API é simulada. |
| ↳ dentro dela: Public Suffix List (`tldts`) | ~100 KB | Dependência do tratamento de cookies do MSW no navegador. |
| Aplicação (React 19, TanStack Router e Query, Radix/shadcn, Axios, decimal.js e o código das telas) | ~225 KB | Já dividida por rota (`autoCodeSplitting`); zod e Socket.IO carregam sob demanda. |
| CSS | ~15 KB | Bloqueia o render (~600 ms simulados no 4G lento). |

**Causa principal: os mocks precisam subir antes da primeira requisição.**
- O enunciado exige auditar com o cenário padrão dos mocks e sem simplificações exclusivas para a pontuação. Por isso a auditoria baixa e registra o service worker do MSW, como na entrega.
- Numa implantação real, sem MSW, sairiam do caminho crítico ~180 KB e uma etapa de registro de service worker.

**Detalhe, um pouco abaixo do Início:** o LCP é a imagem do NFT, que vem da API. Ela depende da camada de mocks *e* da resposta do detalhe antes de começar a baixar. No Início, o LCP é o fundo do hero, que é estático.

## O que foi feito e o que foi testado

| Mudança | Efeito (mediana, mobile) | Mantida? |
|---|---|---|
| `public/robots.txt` (o preview respondia com o HTML do app) | SEO 92 → **100** nas 4 combinações | Sim |
| Validação das variáveis de ambiente sem zod (tira ~25 KB do carregamento inicial) | Performance +2 (77 → 79 no Início; 74 → 76 no Detalhe) | Sim |
| Login (balão e tela cheia) carregado só ao abrir. Ao entrar na raiz do app, os formulários tinham levado react-hook-form e zod ao carregamento inicial (419 → 467 KB) | Recuperou a queda: Início 75 → 78, Detalhe 74 → 77 (426 KB) | Sim |
| Imagens WebP em 256/512/900 com `srcset`/`sizes` e `fetchpriority="high"` na imagem principal (P4) | Imagens deixam de pesar no LCP | Sim |
| Hero mobile monta só a versão visível (`useMediaQuery`), sem baixar a imagem grande do desktop | Evita ~60 KB de imagem no celular | Sim |
| **Experimento:** desenhar a tela antes de o MSW subir (as requisições esperam o MSW) | Início 77 → 82; Detalhe sem ganho | **Não.** Criou corridas: um loader de rota cancelado (`CancelledError` na tela) e três testes intermitentes. Correção vem antes de 5 pontos. |

**Possibilidades não aplicadas** (registradas para uma próxima etapa):
- **Pré-renderizar o HTML estático da Início** (SSG): FCP antes do JS. Exige mudar o modelo de renderização.
- **Remover a Public Suffix List do bundle do MSW** com um alias para um stub: ganho de ~100 KB, mas é uma alteração de dependência da camada de mocks feita só para a auditoria. O enunciado veda simplificações desse tipo.
- **CSS crítico inline:** ganho estimado de algumas centenas de ms no 4G lento.

## Fora da pontuação

- **bfcache:** a página não entra no back/forward cache porque mantém uma conexão WebSocket aberta (tempo real via Socket.IO, exigido pelo enunciado). O Lighthouse lista isso, mas não pontua.
- **Variação entre medições:** a mediana de 3 reduz o ruído, mas o Performance mobile oscila ±3 pontos entre execuções na mesma máquina.
