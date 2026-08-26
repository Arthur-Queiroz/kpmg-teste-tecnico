import type { CompanyRecord } from '@kpmg/shared';

/**
 * Notification port — see docs/06-EMAIL-NOTIFICATIONS.md. The production
 * implementation uses Resend; tests inject a mock through NestJS DI.
 */
export abstract class EmailService {
  abstract sendCompanyCreatedNotification(
    company: CompanyRecord,
  ): Promise<void>;
}
