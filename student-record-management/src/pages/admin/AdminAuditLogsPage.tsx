import { RefreshCw, ScrollText } from 'lucide-react';
import { useGetAuditLogsQuery } from '../../store';

type AuditLog = {
  _id: string;
  action: string;
  entity: string;
  entityId?: string;
  actorRole?: string;
  actorId?: { name?: string; email?: string } | string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export default function AdminAuditLogsPage() {
  const { data: logsData, isLoading: loading, error: fetchError, refetch } = useGetAuditLogsQuery();

  const logs: AuditLog[] = logsData ?? [];
  const error = fetchError ? 'Failed to load audit logs.' : '';

  const actor = (log: AuditLog) => typeof log.actorId === 'object' ? (log.actorId.name || log.actorId.email || 'Deleted user') : 'System';

  return <div className="page-section">
    <div className="flex-between">
      <div><p className="text-eyebrow">Security & Compliance</p><h1 className="text-title" style={{ marginTop: 4 }}>Audit Logs</h1></div>
      <button className="btn btn-secondary" onClick={() => refetch()} disabled={loading}><RefreshCw size={14} /><span>Refresh</span></button>
    </div>
    {error && <div className="alert-error">{error}</div>}
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {loading ? <p className="text-caption" style={{ padding: 24 }}>Loading audit logs...</p> : logs.length === 0 ? <div className="empty-state" style={{ padding: 48 }}><ScrollText size={30} /><p className="empty-state-title">No audit activity yet</p><p className="empty-state-body">Changes to students, grades, and attendance will appear here.</p></div> : <>
        <div style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Action</th><th>Entity</th><th>Actor</th><th>Details</th><th>When</th></tr></thead><tbody>
          {logs.map(log => <tr key={log._id}><td><span className="badge badge-yellow">{log.action.replace(/\./g, ' ')}</span></td><td>{log.entity}{log.entityId ? ` · ${log.entityId.slice(-6)}` : ''}</td><td>{actor(log)}<div className="text-caption">{log.actorRole || 'system'}</div></td><td className="text-caption">{log.metadata ? Object.entries(log.metadata).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`).join(' · ') : '—'}</td><td className="text-caption">{new Date(log.createdAt).toLocaleString()}</td></tr>)}
        </tbody></table></div>
      </>}
    </div>
  </div>;
}
