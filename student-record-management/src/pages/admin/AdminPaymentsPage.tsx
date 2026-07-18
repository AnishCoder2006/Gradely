import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit3, IndianRupee,
  AlertTriangle, Loader2, X, CreditCard,
} from 'lucide-react';
import { feeService, paymentService, Fee, Payment, FeeType } from '../../services/paymentService';

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  tuition: 'Tuition', exam: 'Exam', library: 'Library',
  hostel: 'Hostel', miscellaneous: 'Miscellaneous',
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Paid',    cls: 'badge-green' },
  created: { label: 'Pending', cls: 'badge-yellow' },
  failed:  { label: 'Failed',  cls: 'badge-red' },
};

const fmtINR  = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const EMPTY_FORM = { title: '', feeType: 'tuition' as FeeType, amount: '', dueDate: '', description: '', isActive: true };

export default function AdminFeesPage() {
  const [fees, setFees]         = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [tab, setTab]           = useState<'fees' | 'payments'>('fees');

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Fee | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([
        feeService.getAll(),
        paymentService.getAllPayments({ limit: 50 }).then(r => r.data),
      ]);
      setFees(f);
      setPayments(p);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };
  const openEdit   = (fee: Fee) => {
    setEditing(fee);
    setForm({
      title: fee.title, feeType: fee.feeType,
      amount: String(fee.amount),
      dueDate: fee.dueDate.slice(0, 10),
      description: fee.description,
      isActive: fee.isActive,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.amount || !form.dueDate || !form.description) {
      setError('All fields are required.'); return;
    }
    setSaving(true); setError('');
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (editing) await feeService.update(editing._id, payload);
      else         await feeService.create(payload);
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this fee notice?')) return;
    try { await feeService.delete(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  return (
    <div className="page-section">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <p className="text-eyebrow">Admin</p>
          <h1 className="text-display" style={{ fontSize: 24 }}>Fee Management</h1>
        </div>
        <button className="btn btn-primary" id="btn-add-fee" onClick={openCreate}>
          <Plus size={14} /> Add Fee Notice
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-base)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border-strong)' }}>
        {(['fees', 'payments'] as const).map(t => (
          <button
            key={t}
            id={`tab-${t}`}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 13, fontWeight: 600,
              background: tab === t ? 'var(--bg-card)' : 'transparent',
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t ? 'var(--shadow-card)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {t === 'fees' ? 'Fee Notices' : 'Payment Records'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />)}
        </div>
      ) : tab === 'fees' ? (
        /* ── Fee Notices Tab ── */
        fees.length === 0 ? (
          <div className="empty-state">
            <IndianRupee size={28} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 10 }} />
            <p className="empty-state-title">No fee notices yet</p>
            <p className="empty-state-body">Click "Add Fee Notice" to create one for students.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {['Title', 'Type', 'Amount', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => (
                  <tr key={fee._id} className="table-row">
                    <td className="table-cell">
                      <p style={{ margin: 0, fontWeight: 600 }}>{fee.title}</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{fee.description}</p>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-gray">{FEE_TYPE_LABELS[fee.feeType]}</span>
                    </td>
                    <td className="table-cell" style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700 }}>
                      {fmtINR(fee.amount)}
                    </td>
                    <td className="table-cell" style={{ color: 'var(--text-secondary)' }}>
                      {fmtDate(fee.dueDate)}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${fee.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {fee.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(fee)}>
                          <Edit3 size={12} /> Edit
                        </button>
                        <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => handleDelete(fee._id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ── Payments Tab ── */
        payments.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={28} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 10 }} />
            <p className="empty-state-title">No payments yet</p>
            <p className="empty-state-body">Student payments will appear here once made.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {['Student', 'Fee', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} className="table-header">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const cfg = STATUS_BADGE[p.status] ?? STATUS_BADGE.created;
                  const student = typeof p.studentId === 'object' ? p.studentId : null;
                  const fee     = typeof p.feeId     === 'object' ? p.feeId     : null;
                  return (
                    <tr key={p._id} className="table-row">
                      <td className="table-cell">
                        <p style={{ margin: 0, fontWeight: 600 }}>{student?.name ?? '—'}</p>
                        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{student?.email ?? '—'}</p>
                      </td>
                      <td className="table-cell">{fee?.title ?? '—'}</td>
                      <td className="table-cell" style={{ fontFamily: 'Geist Mono, monospace', fontWeight: 700 }}>
                        {fmtINR(p.amount / 100)}
                      </td>
                      <td className="table-cell"><span className={`badge ${cfg.cls}`}>{cfg.label}</span></td>
                      <td className="table-cell" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {fmtDate(p.paidAt ?? p.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── Create/Edit Modal ── */}
      {showForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
          <div className="modal-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p className="modal-title">{editing ? 'Edit Fee Notice' : 'New Fee Notice'}</p>
              <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>

            {[
              { id: 'fee-title', label: 'Title', type: 'text', key: 'title', placeholder: 'e.g. Semester 2 Tuition Fee' },
              { id: 'fee-amount', label: 'Amount (₹)', type: 'number', key: 'amount', placeholder: '45000' },
              { id: 'fee-due', label: 'Due Date', type: 'date', key: 'dueDate', placeholder: '' },
              { id: 'fee-desc', label: 'Description', type: 'text', key: 'description', placeholder: 'Brief note for students' },
            ].map(({ id, label, type, key, placeholder }) => (
              <div key={key} style={{ marginBottom: 14 }}>
                <label className="input-label" htmlFor={id}>{label}</label>
                <input
                  id={id} type={type} className="input" placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}

            <div style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="fee-type">Fee Type</label>
              <select
                id="fee-type" className="input"
                value={form.feeType}
                onChange={e => setForm(f => ({ ...f, feeType: e.target.value as FeeType }))}
              >
                {Object.entries(FEE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {editing && (
              <div style={{ marginBottom: 20 }}>
                <label className="input-label" htmlFor="fee-active">Status</label>
                <select
                  id="fee-active" className="input"
                  value={String(form.isActive)}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            )}

            {error && (
              <div className="alert-error" style={{ marginBottom: 14 }}>
                <AlertTriangle size={14} /><span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" id="btn-save-fee" onClick={handleSave} disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : editing ? 'Save Changes' : 'Create Fee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
