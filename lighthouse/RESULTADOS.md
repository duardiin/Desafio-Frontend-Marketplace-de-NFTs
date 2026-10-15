# Resultados do Lighthouse

Gerado por `npm run lighthouse` em 2026-10-15T12:55:16.197Z. Mediana de 3 medições por página e perfil; ⚠️ = abaixo da meta.

| Página | Perfil | Performance (≥ 90) | Accessibility (≥ 95) | Best Practices (≥ 95) | SEO (≥ 90) | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| Início | mobile | 78 ⚠️ | 100 | 100 | 100 | 4296 ms | 0.001 | 39 ms |
| Início | desktop | 98 | 100 | 100 | 100 | 1014 ms | 0.019 | 0 ms |
| Detalhe do NFT | mobile | 77 ⚠️ | 100 | 100 | 100 | 4309 ms | 0.003 | 105 ms |
| Detalhe do NFT | desktop | 98 | 100 | 100 | 100 | 961 ms | 0.002 | 0 ms |

## Ambiente e condições

| Item | Valor |
|---|---|
| Lighthouse | 13.5.0 |
| Navegador | Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/156.0.0.0 Safari/537.36 |
| Node.js | v24.21.0 |
| Sistema | Windows_NT 10.0.19045 (x64) |
| CPU | AMD Ryzen 7 5700                                · 16 núcleos |
| Memória | 32 GB |
| Servidor | `vite preview` (build otimizado), http://localhost:4180 |
| Mocks | Ativos, cenário padrão (MSW + Socket.IO simulado) |
| Perfil mobile | Preset padrão do Lighthouse: Moto G Power, 4G lento simulado, CPU 4× |
| Perfil desktop | Preset de desktop do Lighthouse: 1350 × 940, rede rápida simulada, sem limite de CPU |
| Medições | 3 por página e perfil, cada uma num Chrome novo e sem cache (primeira visita) |

Relatórios HTML e JSON de cada medição em `lighthouse/reports/`. Configuração versionada em `lighthouse/config.mjs`.

**Causas do que ficou abaixo das metas e o que foi testado:** [ANALISE.md](ANALISE.md).
