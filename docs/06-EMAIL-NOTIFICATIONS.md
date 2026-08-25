# Notificações por E-mail

## Requisito (PDF)

> "Quando uma nova empresa for cadastrada, um e-mail deverá ser enviado
> para um grupo de e-mails previamente configurado."

Disparado **somente na criação** (`POST /companies`), nunca em
update/delete.

## Serviço

- **Produção**: [Resend](https://resend.com) — API transacional
  moderna, SDK simples, sem necessidade de configurar SPF/DKIM/DMARC do
  zero (diferente de SMTP direto de VPS, que tem risco real de cair em
  spam sem reputação de IP estabelecida).
- **Testes automatizados**: mockado — nenhum teste bate na API real do
  Resend.

## Abstração — `EmailService`

Interface isolada em `apps/api/src/email/`, para permitir mock limpo em
testes e eventual troca de provedor sem tocar na lógica de negócio:

```ts
interface EmailService {
  sendCompanyCreatedNotification(company: Company): Promise<void>;
}
```

Implementação real (`ResendEmailService`) injetada em produção;
implementação fake/mock injetada nos testes (Jest).

## Destinatários

Lista fixa, configurada via variável de ambiente
`NOTIFICATION_EMAILS` (string separada por vírgula), não uma tela de
configuração — coerente com "grupo de e-mails previamente configurado"
do PDF.

## Falha não bloqueia o cadastro

Ver `04-ARCHITECTURE.md` — envio é best-effort. Erro de envio é
logado, não propagado como falha HTTP do endpoint de criação.

## Conteúdo do e-mail (mínimo)

- Assunto: "Nova empresa cadastrada: {nome}"
- Corpo: nome, CNPJ, nome fantasia, cidade/UF, timestamp de criação.

## Cobertura de testes exigida (do PDF)

> "Os testes também devem incluir a validação do envio de e-mails
> quando uma nova empresa for cadastrada."

Ver `07-TESTING-STRATEGY.md` — testado via mock, verificando que
`sendCompanyCreatedNotification` é chamado com os dados corretos após
um `POST /companies` bem-sucedido.
