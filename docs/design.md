# Design System — Referência Visual (inspirado em KPMG)

## Contexto

Interpretação visual da identidade KPMG para este teste técnico,
baseada em: (1) análise do site público kpmg.com.br, (2) tokens
estruturais (tipografia, spacing, radius, shadow) validados como padrão
de mercado para admin/CRUD. Não é o design system oficial e
proprietário da marca. Serve como direção para o Claude Design e
implementação em React + Tailwind.

## Paleta de Cores

| Token | Hex | Uso |
|---|---|---|
| `--color-primary` | `#00338D` | Header, hero, botões primários, links |
| `--color-primary-dark` | `#00205B` | Hover de botões primários |
| `--color-accent` | `#00A3E0` | Barra lateral de cards, foco de input |
| `--color-bg` | `#FFFFFF` | Fundo padrão |
| `--color-bg-subtle` | `#F5F7FA` | Fundo de seções alternadas, tabela zebrada |
| `--color-border` | `#D0D7E2` | Bordas de input, divisores |
| `--color-text` | `#1A1A1A` | Texto principal |
| `--color-text-muted` | `#4A5568` | Texto secundário, labels, helper text |
| `--color-success` | `#2E9E5B` | Toast/feedback de sucesso |
| `--color-error` | `#D64545` | Toast/feedback de erro, validação de campo |
| `--color-info` | `#2E7DD1` | Toast informativo |
| `--color-warning` | `#D19A2E` | Toast de aviso |

## Tipografia

Fallback (fonte proprietária KPMG indisponível) — decidir entre Public
Sans / Inter / IBM Plex Sans na implementação, testando qual "veste"
melhor as telas reais.

| Nível | Tamanho / Peso | Line-height | Uso |
|---|---|---|---|
| H1 | 40px / Bold | 48px | Título do hero/topo da listagem |
| H2 | 28px / SemiBold | 36px | Títulos de página |
| H3 | 20px / SemiBold | 28px | Títulos de seção/card |
| Body | 16px / Regular | 24px | Texto padrão, valores de tabela |
| Small | 14px / Regular | 20px | Labels, helper text |
| Caption | 12px / Regular | 16px | Timestamps, texto auxiliar mínimo |

## Spacing & Layout

Escala 8pt: `4, 8, 16, 24, 32, 40, 48, 64, 80, 96px`.
Container máximo: `1200px`, centralizado, padding lateral responsivo.

## Radius & Shadows

| Token | Valor | Uso |
|---|---|---|
| `--radius-input` | 8px | Inputs, selects, textarea |
| `--radius-card` | 12px | Cards, modal |
| `--radius-pill` | 999px | Botões |

| Elevação | Shadow | Uso |
|---|---|---|
| 0 | none | Elementos flat |
| 1 | `0 1px 2px rgba(16,24,40,0.05)` | Card em repouso |
| 2 | `0 4px 6px rgba(16,24,40,0.08)` | Card em hover |
| 3 | `0 8px 16px rgba(16,24,40,0.10)` | Dropdown, popover |
| 4 | `0 16px 32px rgba(16,24,40,0.12)` | Modal |

## Componentes

**Botão**
- Primary: fundo `--color-primary`, texto branco, `--radius-pill`,
  hover `--color-primary-dark`.
- Secondary: outline `--color-primary`, fundo transparente.
- Ghost: sem borda, texto `--color-primary`, fundo transparente até hover.

**Text Input / Select / Textarea**
- Label acima, `--radius-input`, borda `--color-border`.
- Estado focus: borda `--color-accent`.
- Estado erro: borda `--color-error` + mensagem de erro abaixo.

**Toast/Alert** — Success, Info, Warning, Error, com ícone + mensagem
curta. Usado para: confirmação de cadastro, erro de validação, status
do envio de e-mail.

**Modal** — confirmação de exclusão de empresa
("Tem certeza que deseja excluir [Nome]?" com Cancelar/Excluir).

**Card com acento lateral** — borda esquerda de 4px em
`--color-accent`, usado nas linhas/cards de empresa na listagem
(assinatura visual do site oficial).

**Tabela (listagem de empresas)** — colunas reais do escopo:
`Nome | CNPJ | Nome Fantasia | Cidade | Criado em | Ações`.

**Empty State** — ícone + "Nenhuma empresa cadastrada" +
"Comece cadastrando sua primeira empresa." + CTA "Cadastrar Empresa".

**Paginação** — `< 1 2 3 ... N >` + seletor de itens por página.

## Estrutura de navegação (ajustada ao escopo real)

**Sem sidebar multi-página.** Aplicação com uma única entidade
(Company), sem autenticação/usuários/relatórios. Navegação:

- Header simples, fundo `--color-primary`: logo/wordmark à esquerda,
  sem menu de usuário (não há login).
- Tela única de Listagem (`/`) com CTA "Cadastrar Nova Empresa".
- Tela de Cadastro/Edição (`/companies/new`, `/companies/:id/edit`).

## Aplicação nas telas

- **Listagem**: hero azul com título "Empresas" + CTA pill branco,
  busca opcional, cards com acento lateral, paginação.
- **Cadastro/Edição**: formulário em fundo branco, dois blocos visuais
  separados — "Dados da Empresa" e "Endereço" (reforça a modelagem em
  dois objetos no Zod).
- **Feedback de e-mail**: toast de sucesso confirmando notificação
  enviada após cadastro concluído.
