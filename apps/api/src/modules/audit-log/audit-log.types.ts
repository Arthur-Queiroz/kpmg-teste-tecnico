/** Shape of an audit trail document — see docs/03-API-SPEC.md. */
export interface AuditLogEntry {
  action: 'created' | 'updated' | 'deleted';
  companyId: string;
  companyName: string;
  cnpj: string;
  /** Event-specific payload (created company, changed fields, ...). */
  details?: Record<string, unknown>;
}

/** An AuditLogEntry as stored/returned, with the database-owned timestamp. */
export interface AuditLogRecord extends AuditLogEntry {
  createdAt: string;
}

/** Response shape of GET /audit-logs. */
export interface AuditLogListResult {
  data: AuditLogRecord[];
  total: number;
  page: number;
  pageSize: number;
}
