import { Injectable, Logger } from '@nestjs/common';

import type { CompanyRecord } from '@kpmg/shared';
import { Resend } from 'resend';

import { EmailService } from './email.service';

const EMAIL_FROM = 'Cadastro de Empresas <onboarding@resend.dev>';

/**
 * Resend-backed EmailService. Without RESEND_API_KEY or recipients configured
 * (local dev), the send is skipped with a warning instead of failing.
 */
@Injectable()
export class ResendEmailService extends EmailService {
  private readonly logger = new Logger(ResendEmailService.name);
  private readonly resend: Resend | null;
  private readonly recipients: string[];

  constructor() {
    super();
    const apiKey = process.env.RESEND_API_KEY;
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.recipients = (process.env.NOTIFICATION_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
  }

  async sendCompanyCreatedNotification(company: CompanyRecord): Promise<void> {
    if (!this.resend || this.recipients.length === 0) {
      this.logger.warn(
        `E-mail skipped (missing RESEND_API_KEY or NOTIFICATION_EMAILS): company ${company.id}`,
      );
      return;
    }

    const { error } = await this.resend.emails.send({
      from: EMAIL_FROM,
      to: this.recipients,
      subject: `Nova empresa cadastrada: ${company.name}`,
      text: [
        `Nome: ${company.name}`,
        `CNPJ: ${company.cnpj}`,
        `Nome Fantasia: ${company.tradeName}`,
        `Cidade/UF: ${company.address.city}/${company.address.state}`,
        `Criado em: ${company.createdAt}`,
      ].join('\n'),
    });

    // The Resend SDK resolves with { data, error } instead of throwing on
    // API errors — without this check a rejected send would be invisible.
    if (error) {
      throw new Error(
        `Resend rejected the send: ${error.name} — ${error.message}`,
      );
    }

    this.logger.log(
      `Creation e-mail sent for company ${company.id} (${this.recipients.length} recipient(s))`,
    );
  }
}
