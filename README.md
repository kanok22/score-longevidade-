# Vitalis — Score de Longevidade & Idade Biológica

Site interativo, com design **skeuomórfico** (latão, couro, papel e madeira), que estima a
**idade biológica** através de um score multi-variável e gera um **plano terapêutico
personalizado** para melhorar o resultado.

## Como usar

Abra `index.html` num navegador — não precisa de servidor nem de build.
Todos os cálculos são feitos localmente; nenhum dado sai do dispositivo.

## Funcionalidades

- **Questionário guiado em 6 passos**: perfil, corpo, movimento, sono & mente, nutrição e
  análises clínicas (opcionais) — mais de 20 variáveis.
- **Idade biológica estimada** apresentada num mostrador analógico de latão com ponteiro
  animado, comparada com a idade cronológica.
- **6 sub-scores (0–100)** em vu-meters: Coração, Metabolismo, Movimento, Sono, Nutrição e Mente.
- **Plano terapêutico priorizado** em formato de receituário, com metas concretas por
  intervenção (máx. 7, ordenadas por impacto estimado), imprimível.
- Animações: scroll reveal, relógio de bolso funcional, ponteiro com mola, contadores,
  transições entre passos, interruptores e botões físicos com curso de pressão.
- Respeita `prefers-reduced-motion`.

## Estrutura

| Ficheiro | Papel |
|---|---|
| `index.html` | Estrutura da página (hero, como funciona, avaliação, resultados, plano) |
| `css/style.css` | Todo o design skeuomórfico e animações |
| `js/score.js` | Motor de cálculo: deltas de idade + sub-scores por domínio |
| `js/plan.js` | Regras que geram o plano terapêutico a partir do resultado |
| `js/app.js` | Interface: formulário multi-etapas, mostrador SVG, meters, receituário |

## Aviso

Ferramenta **educativa**, com pesos heurísticos inspirados em fatores de risco descritos na
literatura. Não é um dispositivo médico, não faz diagnósticos e não substitui a avaliação
de um profissional de saúde.
