# Defesa técnica — perguntas prováveis e respostas

Roteiro de preparação para a conversa com o avaliador. Cada pergunta tem
uma **resposta curta** (o que dizer de primeira, ~30 segundos) e um
**se aprofundar** (o que responder se ele puxar o assunto).

Duas regras para a conversa:

1. **Responda primeiro a decisão, depois a alternativa descartada.**
   "Escolhi X porque Y; considerei Z, mas custava W." Isso mostra que
   houve escolha, não desconhecimento.
2. **Se não souber, diga que não sabe.** A pior resposta possível é
   inventar. A segunda pior é ficar na defensiva. A seção
   [Perguntas desconfortáveis](#perguntas-desconfortáveis) existe
   justamente para você já ter uma resposta honesta pronta.

---

## Bloco 1 — Arquitetura

### "Por que você escolheu essa arquitetura?"

**Resposta curta.** O eixo da decisão foi **uma única fonte de verdade de
validação**. Como o desafio pede validação de CNPJ e de endereço nos dois
lados, monorepo com um pacote compartilhado (`packages/shared`) permite
que o mesmo schema Zod valide no frontend (feedback instantâneo) e
revalide no backend (segurança). Sem isso, a regra de CNPJ existiria
duplicada em dois lugares e divergiria na primeira alteração.

**Se aprofundar.** O resto da arquitetura decorre disso:

- **Zod + `nestjs-zod` em vez de `class-validator`**: o `class-validator`
  vive em decorators dentro do NestJS e não é compartilhável com o
  browser. Com Zod, o mesmo schema gera o tipo TypeScript (`z.infer`), o
  DTO do Nest (`createZodDto`), o resolver do React Hook Form
  (`zodResolver`) **e** o schema do Swagger. Uma definição, quatro usos.
- **Monorepo pnpm**: é o que torna esse compartilhamento uma importação
  normal (`@kpmg/shared`) em vez de um pacote publicado ou um copy-paste.
- Registro completo em [`09-DECISIONS.md`](09-DECISIONS.md); o diagrama
  está no [README](../README.md#arquitetura).

### "Por que dois bancos de dados? Não era mais simples só o Postgres?"

**Resposta curta.** Era mais simples, sim — foi uma escolha deliberada
para usar cada banco no que ele faz melhor. O **Postgres** guarda o
domínio: empresa é dado estruturado, com schema estável, unicidade de
CNPJ e consultas com filtros combinados. O **MongoDB** guarda só a trilha
de auditoria: eventos append-only, de esquema variável — o payload de um
`update` carrega os campos alterados, o de um `create` carrega a empresa
inteira.

**Se aprofundar.** As garantias que mantive para isso não virar
fragilidade:

- a escrita no Mongo é **best-effort**: falha é logada e nunca derruba o
  CRUD;
- o Mongo **nunca é fonte de verdade de negócio** — é uma trilha
  reconstruível e descartável;
- se eu forçasse isso no Postgres, teria ou uma tabela com colunas
  genéricas mal aproveitadas, ou um schema rígido que exige migration a
  cada novo tipo de evento.

**Se ele disser "isso é over-engineering para um CRUD":** concordo que
para um CRUD isolado seria. A trilha de auditoria não estava no
requisito — eu a adicionei, e escolhi implementá-la no banco em que ela
é natural. O critério que apliquei é o mesmo que aplicaria em produção:
o segundo banco só entra se houver isolamento de falha (best-effort) e
se ele não virar dependência crítica. Ambos valem aqui.

### "Por que o endereço é um JSON e não uma tabela separada?"

**Resposta curta.** A relação é estritamente 1:1 e o endereço é sempre
lido junto com a empresa. Uma tabela separada adicionaria JOIN e uma
migration para zero ganho. Colunas achatadas na tabela `companies`
funcionariam, mas dissolveriam o conceito de "Endereço" como unidade —
que é como o próprio enunciado o trata. O JSON mantém a coesão, e a
validação estruturada acontece na borda da API via Zod.

**Se ele questionar consultabilidade:** o filtro por estado consulta
dentro do JSON (`address.path: ['state']` no Prisma) e funciona. Se
surgisse necessidade de consulta pesada por logradouro ou de endereços
múltiplos por empresa, aí a tabela separada passaria a valer a pena — e
seria uma migration, não uma reescrita.

### "Por que o ViaCEP é chamado direto do frontend?"

**Resposta curta.** É uma API pública, sem chave, read-only, usada só
para UX. Passar pelo backend adicionaria uma rede a mais de latência e
um endpoint a manter, sem nenhum ganho de segurança — não há segredo
para proteger. O autofill tem fallback manual: se o ViaCEP cair ou o CEP
não existir, o usuário digita o endereço e o cadastro segue normalmente.

### "Por que VPS própria em vez de Railway, Render ou Supabase?"

**Resposta curta.** É infraestrutura que eu já opero e monitoro. Free
tier de plataforma gerenciada tem cold start e limite de conexão — numa
janela de avaliação em que vocês podem acessar a qualquer hora, isso é
risco real de a aplicação estar "dormindo" na primeira impressão.

**Se aprofundar.** Deployar nas duas plataformas foi proposital: o
frontend na Vercel (plataforma gerenciada, integração nativa com o Git) e
o backend em infra própria (Docker + Caddy + Cloudflare Tunnel). Mostra
que sei operar nos dois modelos, em vez de depender de um ecossistema só.

### "E a segurança? A API está pública."

**Resposta curta.** Por exigência explícita do enunciado: "a aplicação
não deve incluir um sistema de autenticação de usuários; deverá ser
acessível diretamente, sem a necessidade de login". Documentei isso em
[`CONSTRAINTS.md`](CONSTRAINTS.md) e escrevi um **teste automatizado que
prova a ausência de autenticação** — para deixar claro que é
cumprimento de requisito, não esquecimento.

**Se ele perguntar o que você faria se pudesse:** JWT ou sessão no
backend, com o CRUD atrás de autenticação e a trilha de auditoria
passando a registrar *quem* fez cada operação — hoje ela registra o quê
e quando, mas não tem autor, justamente porque não há usuário.

---

## Bloco 2 — E-mail

### "Como funciona a notificação por e-mail?"

**Resposta curta.** No `POST /companies`, a empresa é persistida no
Postgres e a API responde `201` **sem esperar o e-mail**. O envio é
disparado em segundo plano via Resend para a lista de destinatários
configurada. Se o provedor falhar, o erro é logado e o cadastro
permanece — a notificação nunca desfaz a operação principal.

**Se aprofundar.** O código está em
[`company.service.ts`](../apps/api/src/modules/company/company.service.ts):
a chamada é feita sem `await`, com um `.catch()` que loga. Escolhi
**Resend** em vez de SMTP direto da VPS porque um IP sem reputação
estabelecida tem risco real de cair em spam, e o Resend resolve
SPF/DKIM/DMARC com setup mínimo. O `EmailService` é uma interface, então
nos testes injeto um mock — nenhum teste bate na API real.

### "Como eu adiciono um e-mail nesse grupo?" ← pergunta muito provável

**Resposta curta.** É variável de ambiente: `NOTIFICATION_EMAILS`, uma
lista separada por vírgula. Em produção ela vive no manifesto do app na
VPS. Trocar a lista é uma operação de configuração, não exige rebuild da
imagem nem alteração de código.

**O passo a passo, se ele pedir para você mostrar:**

```bash
ssh hostinger
sudo nano /etc/vps-infra/apps/kpmg.yaml     # editar NOTIFICATION_EMAILS
sudo deployctl validate kpmg                # valida o manifesto antes de aplicar
sudo deployctl status kpmg                  # copiar o currentDigest
sudo deployctl release kpmg api sha256:<digest-atual>
```

Conferir que pegou:

```bash
sudo docker exec kpmg-api node -e "console.log(process.env.NOTIFICATION_EMAILS)"
```

**Os dois detalhes que valem ouro nessa resposta** (são exatamente onde a
maioria erra):

1. **`docker restart` não resolve.** O Docker congela as variáveis de
   ambiente no momento em que o container é *criado*. Reiniciar mantém a
   configuração antiga — é preciso **recriar**, que é o que o `release`
   faz.
2. **Releasear o mesmo digest não rebuilda nada.** Ele recria o container
   com o ambiente novo, passa pelo healthcheck e faz o swap. Zero
   downtime, e a imagem continua sendo a mesma que já passou pela suíte
   de testes.

Se for um segredo (`RESEND_API_KEY`, senhas), o arquivo é outro:
`/var/lib/vps-apps/kpmg/secrets.env`. O manifesto referencia por
`fromSecret`, e o `deployctl` resolve pelo **nome da variável**. Se a
chave faltar, o release **aborta** — produção fica intacta em vez de
subir quebrada.

Runbook completo: [`08-DEPLOYMENT.md`](08-DEPLOYMENT.md#runbook-mudar-configuração-em-produção).

### "Esse grupo de e-mails não deveria ser configurável pela interface?"

**Resposta curta.** Considerei e descartei — principalmente por
segurança. A aplicação **não tem autenticação**, por exigência do
enunciado. Uma tela pública de configuração de destinatários permitiria
que qualquer visitante anônimo redirecionasse as notificações de cadastro
para o próprio e-mail. A restrição do enunciado transforma essa tela numa
falha de segurança, não num recurso.

**Se aprofundar** — mais dois motivos, em ordem de peso:

2. **"Previamente configurado"** (a expressão do enunciado) descreve
   configuração feita *fora* do fluxo de uso, não algo editável em
   runtime. Onde o enunciado quis uma tela, ele pediu a tela.
3. O escopo declarado da UI é "foco nas funcionalidades de cadastro e
   listagem de empresas". Uma tela de destinatários fica fora dele.

**Se ele responder "mas com autenticação faria sentido":** faria, sim — e
é exatamente por isso que a resposta começa pela ausência de auth. Com
login e um papel de administrador, a tela vira o caminho certo.

### "E se o e-mail falhar? O usuário fica sem saber?"

**Resposta curta.** O usuário sabe que o **cadastro** deu certo — que é o
que o `201` garante. O toast na interface diz explicitamente que "a
notificação por e-mail é disparada em segundo plano", justamente para não
prometer entrega que a API não confirmou. A falha fica no log da API e no
painel do Resend, que mostra o status por mensagem.

**Se ele perguntar por retry:** hoje não há. O caminho natural seria uma
fila (BullMQ/Redis) com retry exponencial e dead-letter. Para o escopo
deste desafio, isso adicionaria uma dependência de infraestrutura sem
mudar o comportamento observável no caso feliz — preferi ser explícito
sobre a garantia que dou (`201` = persistiu) do que simular uma garantia
que não tenho.

---

## Bloco 3 — Testes

### "Fale sobre a estratégia de testes."

**Resposta curta.** São **50 testes** em três camadas:

| Camada | Qtd. | O que cobre |
|---|---|---|
| `packages/shared` | 17 | Algoritmo de CNPJ (módulo 11, dois DVs) e schemas Zod |
| `apps/api` unitários | 15 | `CompanyService` e `AuditLogService` com mocks |
| `apps/api` e2e | 18 | CRUD completo contra Postgres real |

**Se aprofundar.** Os e2e rodam contra um **Postgres de verdade** isolado
(`kpmg_teste_test`), não contra mock — é o que dá confiança de que as
migrations, os índices e a unicidade de CNPJ realmente funcionam. Os dois
testes que eu destacaria:

- **o disparo do e-mail no cadastro** (exigido explicitamente no
  enunciado): o `EmailService` é substituído por um mock via injeção de
  dependência do NestJS, e o teste verifica que
  `sendCompanyCreatedNotification` foi chamado com os dados corretos
  depois de um `POST /companies` bem-sucedido;
- **a prova de ausência de autenticação**: um teste deliberado que
  documenta a restrição como comportamento verificado.

### "Os testes rodam antes do deploy?"

**Resposta curta.** Sim, e o deploy é **bloqueado** por eles. O job
`release` declara `needs: test` — se qualquer teste falhar, o release
nem começa. Além disso, a `main` é protegida: só entra código via pull
request com o check de testes verde.

**Se aprofundar.** O fluxo inteiro:

```
PR aberto  →  lint + typecheck + 50 testes + build
           ↓ (verde, obrigatório para mergear)
merge main →  build da imagem → push no GHCR por digest
           ↓
release    →  job de migration → healthcheck → swap do container
           ↓
smoke      →  curl em /health, /companies e /audit-logs no domínio real
```

O **smoke test** é o detalhe que eu mencionaria: ele bate no domínio
público depois do deploy, então prova o caminho inteiro — Cloudflare
Tunnel, Caddy, Postgres e Mongo. Um `200` em `/audit-logs` só é possível
com o Mongo conectado; sem ele o endpoint devolve `503`.

E as **migrations rodam como job separado antes do swap**, não no
entrypoint do container. Uma migration que falha aborta o release com
produção intacta — no modelo entrypoint, o container novo subiria
quebrado até o healthcheck derrubá-lo.

---

## Bloco 4 — Logs e operação

### "Como você monitora essa aplicação? Onde vejo os logs?"

**Resposta curta.** Os logs ficam no Docker da VPS, um container por
peça:

```bash
ssh hostinger
sudo docker logs kpmg-api --tail 50     # últimas 50 linhas
sudo docker logs kpmg-api -f            # tempo real
sudo docker logs kpmg-api --since 15m   # últimos 15 minutos
sudo deployctl status kpmg              # o que está no ar + histórico de revisões
```

Fora da VPS: pipeline na aba Actions do GitHub, build do frontend no
dashboard da Vercel, e **entrega de e-mail no painel do Resend** (status
por mensagem — é lá que você confirma se um e-mail específico foi
entregue).

**O que aparece nesses logs:** boot da aplicação com as rotas mapeadas,
erros não tratados capturados pelo `HttpExceptionFilter`, e os avisos
explícitos do domínio — falha de e-mail e falha de gravação da auditoria.

Tabela completa em
[`08-DEPLOYMENT.md`](08-DEPLOYMENT.md#observabilidade-onde-ficam-os-logs).

### "Consigo ver quem chamou qual endpoint?"

**Resposta honesta — não invente aqui.** Não há log de requisições. Nem o
Caddy nem o NestJS registram chamadas individuais; verifiquei que um
`GET /health` real não aparece em nenhum dos dois. O que existe é a
trilha em `GET /audit-logs`, que registra **o que foi alterado** nas
operações de escrita — mas não substitui um access log.

Os logs também **zeram a cada deploy**, porque cada release cria um
container novo. A retenção é a padrão do driver `json-file` com rotação
(máx. 30 MB por container), e nada sai da VPS.

**Como fechar essa resposta:** "Para um teste técnico isso é suficiente e
foi uma escolha consciente. Num sistema com tráfego real, o próximo passo
seria um interceptor de request logging no NestJS e centralização em
Loki ou ELK — aí os logs sobrevivem ao deploy e ficam consultáveis."

---

## Perguntas desconfortáveis

Estas são as que separam candidato preparado de candidato decorado.
Respostas honestas, sem defensiva.

### "O que você faria diferente com mais tempo?"

Três coisas, nessa ordem:

1. **Log de requisições e centralização** — é a lacuna operacional real
   do projeto, e eu a documentei em vez de escondê-la.
2. **Fila com retry para o e-mail** — hoje é best-effort sem
   reprocessamento; uma falha transitória do provedor perde a
   notificação.
3. **Cobertura de testes no CI** com limite mínimo, e testes de
   componente no frontend — hoje o frontend é coberto por lint,
   typecheck e build, não por testes automatizados.

### "Você usou IA para fazer isso?"

**Responda que sim, sem hesitar** — e mostre onde está o seu julgamento:

"Usei, e trato isso como ferramenta de trabalho. O que é meu são as
decisões: por que dois bancos, por que o e-mail é best-effort, por que a
lista de destinatários não é configurável pela interface. Cada uma dessas
está registrada em [`09-DECISIONS.md`](09-DECISIONS.md) com a alternativa
que descartei e o motivo. E fiz auditorias cruzadas: rodei revisão do
código por uma ferramenta diferente da que escreveu, e as correções que
vieram de lá estão no histórico de commits. Posso explicar qualquer linha
do repositório."

*(Se ele pedir para explicar alguma parte na hora, o algoritmo de CNPJ em
`packages/shared/src/validators/cnpj.ts` e o `create()` do
`company.service.ts` são os dois trechos que valem ter frescos na
cabeça.)*

### "Por que Prisma 6 e não a 7?"

O Prisma 7 remove o generator `prisma-client-js` e passa a exigir
`prisma.config.ts` com driver adapters — cliente sem engine Rust. Fixei a
6 para manter a integração CommonJS direta com o NestJS, que é o setup
documentado. Foi uma escolha de estabilidade dentro da janela do desafio,
registrada como decisão, não versão desatualizada por descuido.

### "Esse projeto está pronto para produção?"

Cuidado com o "sim" fácil. A resposta boa é calibrada:

"Está no ar e é operável: tem CI com testes bloqueando o deploy, deploy
por imagem imutável com digest, migrations que abortam o release se
falharem, healthcheck, swap sem downtime, rollback por comando e smoke
test pós-deploy. O que falta para eu chamar de produção com tráfego real
é observabilidade — access log e centralização — e autenticação, que aqui
foi omitida por requisito. Sei nomear o que falta, que é o que importa."

### "Se o cadastro parar de funcionar agora, o que você faz?"

Ordem de diagnóstico, do mais barato para o mais caro:

1. `curl https://kpmg.devarthur.com.br/health` — separa "app fora" de
   "borda fora".
2. `sudo docker logs kpmg-api --tail 50` — o erro real.
3. `sudo deployctl status kpmg` — o digest no ar é o do último commit?
   (Já aconteceu de dois runs saírem da fila fora de ordem e o commit
   mais antigo sobrescrever o mais novo; os dois reportaram sucesso, e só
   a comparação de digests revelou.)
4. `sudo deployctl rollback kpmg api` — se foi o release que quebrou.

---

## Colinha para a conversa

**Links:**

| O quê | Onde |
|---|---|
| Frontend | https://kpmg-test-frontend.vercel.app |
| Backend | https://kpmg.devarthur.com.br |
| Swagger | https://kpmg.devarthur.com.br/docs |
| Health | https://kpmg.devarthur.com.br/health |
| Trilha de auditoria | https://kpmg.devarthur.com.br/audit-logs |

**Números para ter na ponta da língua:** 50 testes (17 + 15 + 18).
3 pacotes no monorepo. 2 bancos. 2 plataformas de deploy.

**Se ele pedir para ver algo ao vivo**, a sequência mais forte é:
cadastrar uma empresa no frontend → mostrar o e-mail chegando → abrir
`/audit-logs` e mostrar o evento `created` registrado. São as três
camadas funcionando de ponta a ponta em menos de um minuto.

**Documentos para citar por nome:** [`09-DECISIONS.md`](09-DECISIONS.md)
(decisões com alternativas descartadas),
[`08-DEPLOYMENT.md`](08-DEPLOYMENT.md) (runbook e observabilidade),
[`CONSTRAINTS.md`](CONSTRAINTS.md) (a restrição de autenticação).
