import AuditLog from '../models/AuditLog';
import logger from '../config/logger';

type AuditEntry = {
  actorId?: string;
  actorRole?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Audit writes must never prevent the underlying business action from completing.
 * Errors are logged for operations visibility and can be monitored in production.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await AuditLog.create(entry);
  } catch (error) {
    logger.error({ err: error, action: entry.action, entity: entry.entity, entityId: entry.entityId }, 'audit_log_write_failed');
  }
}
