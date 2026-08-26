import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Collection } from 'mongodb';

import { MongoService } from '../../mongo/mongo.service';

import type {
  AuditLogEntry,
  AuditLogListResult,
  AuditLogRecord,
} from './audit-log.types';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

/** The stored document: the entry plus the database-owned timestamp. */
interface AuditLogDocument extends AuditLogEntry {
  createdAt: Date;
}

/**
 * Append-only audit trail in MongoDB (see docs/09-DECISIONS.md). Writes are
 * best-effort: callers are expected to .catch() record() failures, so a Mongo
 * outage never breaks the CRUD.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly mongo: MongoService) {}

  async record(entry: AuditLogEntry): Promise<void> {
    const collection = this.collection();
    if (!collection) {
      this.logger.warn(
        `Audit log skipped (MongoDB unavailable): ${entry.action} ${entry.companyId}`,
      );
      return;
    }
    await collection.insertOne({ ...entry, createdAt: new Date() });
  }

  async findAll(query: ListAuditLogsQueryDto): Promise<AuditLogListResult> {
    const collection = this.collection();
    if (!collection) {
      throw new ServiceUnavailableException(
        'Log de auditoria indisponível no momento',
      );
    }

    const { page, pageSize, action } = query;
    const filter = action ? { action } : {};

    const [documents, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    return {
      data: documents.map(toAuditLogRecord),
      total,
      page,
      pageSize,
    };
  }

  private collection(): Collection<AuditLogDocument> | null {
    return (
      this.mongo.database?.collection<AuditLogDocument>('audit_logs') ?? null
    );
  }
}

function toAuditLogRecord(document: AuditLogDocument): AuditLogRecord {
  return {
    action: document.action,
    companyId: document.companyId,
    companyName: document.companyName,
    cnpj: document.cnpj,
    ...(document.details ? { details: document.details } : {}),
    createdAt: document.createdAt.toISOString(),
  };
}
