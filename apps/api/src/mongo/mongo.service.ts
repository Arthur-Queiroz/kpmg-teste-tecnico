import * as os from 'node:os';

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
    try {
      // The audit trail is best-effort by design: if MongoDB is unreachable
      // the API still boots, with logging disabled (docs/09-DECISIONS.md).
      //
      // `runtimeAdapters.os` is injected on purpose: without it the driver
      // loads `os` through a dynamic `import()`, which Jest (CJS, no
      // --experimental-vm-modules) cannot resolve inside its VM context. The
      // promise rejects, the client metadata comes out empty, and the server
      // refuses the handshake with "Missing required sub-document 'driver'".
      // Injecting the adapter keeps the handshake identical in tests and in
      // production.
      this.client = new MongoClient(url, {
        serverSelectionTimeoutMS: 5000,
        runtimeAdapters: { os },
      });
      await this.client.connect();
    } catch (error) {
      this.logger.error(
        'MongoDB unreachable — audit logging disabled',
        error instanceof Error ? error.stack : String(error),
      );
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.close();
  }

  /** Null when MONGO_URL is not configured — callers must degrade gracefully. */
  get database(): Db | null {
    return this.client?.db() ?? null;
  }
}
