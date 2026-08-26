import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MongoClient, type Db } from 'mongodb';

/**
 * MongoDB connection for the audit trail (docs/09-DECISIONS.md — polyglot
 * persistence). The database stores only append-only event documents and is
 * never the source of truth for business data.
 */
@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name);
  private client: MongoClient | null = null;

  async onModuleInit(): Promise<void> {
    const url = process.env.MONGO_URL;
    if (!url) {
      this.logger.warn('MONGO_URL not set — audit logging disabled');
      return;
    }
    this.client = new MongoClient(url);
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.close();
  }

  /** Null when MONGO_URL is not configured — callers must degrade gracefully. */
  get database(): Db | null {
    return this.client?.db() ?? null;
  }
}
