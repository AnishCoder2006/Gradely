import { useState, useEffect, useCallback } from 'react';
import {
  IndianRupee, CheckCircle, Clock, CreditCard,
  AlertTriangle, Loader2, XCircle,
} from 'lucide-react';
import { feeService, paymentService, Fee, Payment } from '../../services/paymentService';

declare global { interface Window { Razorpay: any; } }

const loadRazorpay = (): Promise<boolean> =>
  new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const fmtINR  = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  paid:    { label: 'Paid',    cls: 'badge-green',  icon: CheckCircle },
  created: { label: 'Pending', cls: 'badge-yellow', icon: Clock },
  failed:  { label: 'Failed',  cls: 'badge-red',    icon: XCircle },
};

export default function PaymentPage() {
  const [fees, setFees]         = useState<Fee[]>([]);
  const [myPayments, setMyPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [f, p] = await Promise.all([feeService.getAll(), paymentService.getMyPayments()]);
      setFees(f);
      setMyPayments(p);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Check if student already paid a specific fee
  const isPaid = (feeId: string) =>
    myPayments.some(p => {
      const id = typeof p.feeId === 'object' ? p.feeId._id : p.feeId;
      return id === feeId && p.status === 'paid';
    });

  const handlePay = async (fee: Fee) => {
    setError(''); setSuccess('');
    setPayingId(fee._id);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) { setError('Could not load Razorpay. Check your connection.'); return; }

      const order = await paymentService.createOrder(fee._id);

      const rzp = new window.Razorpay({
        key:         order.keyId,
        amount:      order.amount,
        currency:    order.currency,
        name:        'Student Record System',
        description: fee.title,
        order_id:    order.orderId,
        prefill:     { name: order.studentName, email: order.studentEmail },
        theme:       { color: '#d97706' },
        handler: async (resp: any) => {
          try {
            await paymentService.verifyPayment({
              razorpay_order_id:   resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature:  resp.razorpay_signature,
            });
            setSuccess(`Payment for "${fee.title}" successful!`);
            load();
          } catch { setError('Payment verification failed. Contact support.'); }
        },
        modal: { ondismiss: () => setPayingId(null) },
      });
      rzp.on('payment.failed', () => { setError('Payment failed. Please try again.'); setPayingId(null); });
      rzp.open();
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="page-section">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <p className="text-eyebrow">Student Portal</p>
          <h1 className="text-display" style={{ fontSize: 24 }}>Fee Payments</h1>
        </div>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: 16 }}>
          <AlertTriangle size={14} /><span>{error}</span>
        </div>
      )}
      {success && (
        <div style={{ display:'flex', gap:10, padding:'12px 16px', background:'rgba(13,148,136,0.06)', border:'1px solid rgba(13,148,136,0.18)', borderRadius:10, marginBottom:16, fontSize:13, color:'var(--success)', fontFamily:'Plus Jakarta Sans, sans-serif' }}>
          <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /><span>{success}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 14 }} />)}
        </div>
      ) : fees.length === 0 ? (
        <div className="empty-state">
          <IndianRupee size={28} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 10 }} />
          <p className="empty-state-title">No fees posted yet</p>
          <p className="empty-state-body">Your institution hasn't posted any fee notices yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fees.map(fee => {
            const paid    = isPaid(fee._id);
            const paying  = payingId === fee._id;
            const dueDate = new Date(fee.dueDate);
            const overdue = !paid && dueDate < new Date();

            return (
              <div
                key={fee._id}
                className="card"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '20px 24px',
                  borderColor: paid ? 'rgba(13,148,136,0.2)' : overdue ? 'rgba(190,18,60,0.15)' : undefined,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: paid ? 'rgba(13,148,136,0.08)' : 'rgba(217,119,6,0.08)',
                  }}>
                    {paid
                      ? <CheckCircle size={18} color="var(--success)" />
                      : <IndianRupee size={18} color="var(--accent)" />}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                      {fee.title}
                    </p>
                    <p style={{ margin: '3px 0 0', fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                      {fee.description} · Due {fmtDate(fee.dueDate)}
                      {overdue && <span style={{ color: 'var(--error)', marginLeft: 6, fontWeight: 600 }}>Overdue</span>}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                  <p style={{ margin: 0, fontFamily: 'Geist Mono, monospace', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {fmtINR(fee.amount)}
                  </p>
                  {paid ? (
                    <span className="badge badge-green">Paid</span>
                  ) : (
                    <button
                      id={`btn-pay-${fee._id}`}
                      className="btn btn-primary"
                      style={{ minWidth: 110 }}
                      onClick={() => handlePay(fee)}
                      disabled={paying}
                    >
                      {paying
                        ? <><Loader2 size={14} className="animate-spin" />Processing</>
                        : <><CreditCard size={14} />Pay Now</>}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction History */}
      {myPayments.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>
            Transaction History
          </p>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  {['Fee', 'Amount', 'Status', 'Date'].map(h => <th key={h} className="table-header">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {myPayments.map(p => {
                  const cfg = STATUS_BADGE[p.status] ?? STATUS_BADGE.created;
                  const fee = typeof p.feeId === 'object' ? p.feeId : null;
                  return (
                    <tr key={p._id} className="table-row">
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
        </div>
      )}
    </div>
  );
}
