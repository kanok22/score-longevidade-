# Vitalis — Score de Longevidade & Idade Biológica

Site interativo com design **glassmorphism escuro** (painéis de vidro fosco, bento grids,
minimalismo, acentos laranja/teal), que estima a **idade biológica** através de um score
multi-variável e gera um **plano terapêutico personalizado** para melhorar o resultado.

## Como usar

Abra `index.html` num navegador — não precisa de servidor nem de build.
Todos os cálculos são feitos localmente; nenhum dado sai do dispositivo.

## Funcionalidades

- **Questionário guiado em 6 passos**: perfil, corpo, movimento, sono & mente, nutrição e
  análises clínicas (opcionais) — mais de 20 variáveis.
- **Idade biológica estimada** apresentada num anel de progresso animado (teal se mais
  jovem, laranja se mais velho), com marcador da idade cronológica.
- **6 sub-scores (0–100)** em vu-meters: Coração, Metabolismo, Movimento, Sono, Nutrição e Mente.
- **Plano terapêutico priorizado** em formato de receituário, com metas concretas por
  intervenção (máx. 7, ordenadas por impacto estimado), imprimível.
- Animações: scroll reveal, relógio de bolso funcional, ponteiro com mola, contadores,
  transições entre passos, interruptores e botões físicos com curso de pressão.
- Respeita `prefers-reduced-motion`.

- **Área de membros** (`conta.html`): login/registo, histórico de avaliações guardadas,
  loja de planos (Dietas, Sono, Movimento) com cupões de desconto (ex.: `VITALIS100` = 100%),
  e pedido de acompanhamento profissional como serviço pago à parte.

## Estrutura

| Ficheiro | Papel |
|---|---|
| `index.html` | Estrutura da página (hero, como funciona, avaliação, resultados, plano) |
| `conta.html` | Login/registo + área privada (resultados, loja de planos, compras) |
| `css/style.css` | Todo o design skeuomórfico e animações |
| `js/score.js` | Motor de cálculo: deltas de idade + sub-scores por domínio |
| `js/plan.js` | Regras que geram o plano terapêutico a partir do resultado |
| `js/app.js` | Interface: formulário multi-etapas, mostrador SVG, meters, receituário |
| `js/config.js` | Configuração da base de dados (Supabase) — vazio = modo demonstração |
| `js/db.js` | Camada de dados: adaptador Supabase + adaptador local de demonstração |
| `js/conta.js` | Lógica da área de membros: auth, loja, cupões, compras, histórico |

## Contas e base de dados

Por omissão a área de membros corre em **modo demonstração**: as contas ficam só no
navegador (palavra-passe guardada como hash SHA-256 com salt, nunca em texto simples).
Serve para experimentar, mas não sincroniza entre dispositivos.

Para contas reais recomenda-se o **[Supabase](https://supabase.com)** (plano Free:
Postgres 500 MB, autenticação incluída, Row Level Security):

1. Crie um projeto no Supabase e, em **SQL Editor**, corra:

```sql
create table public.resultados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  dados jsonb not null
);
alter table public.resultados enable row level security;
create policy "os proprios resultados" on public.resultados
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  criado_em timestamptz not null default now(),
  plano_id text not null,
  titulo text not null,
  categoria text not null,
  preco numeric not null,
  cupao text,
  unique (user_id, plano_id)
);
alter table public.compras enable row level security;
create policy "as proprias compras" on public.compras
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

2. Em **Settings → API**, copie o *Project URL* e a chave *anon public* para `js/config.js`.
3. (Opcional) Em **Authentication → Providers → Email**, desative "Confirm email" para
   permitir entrada imediata após o registo.

A chave *anon* pode estar no código do site — é pública por desenho; a privacidade dos
dados é garantida no servidor pelas políticas RLS acima (cada utilizador só lê e escreve
as suas próprias linhas).

## Aviso

Ferramenta **educativa**, com pesos heurísticos inspirados em fatores de risco descritos na
literatura. Não é um dispositivo médico, não faz diagnósticos e não substitui a avaliação
de um profissional de saúde.
