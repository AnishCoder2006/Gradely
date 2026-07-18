import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToastContext } from '../context/ToastContext';
import { announcementService, Announcement } from '../services/announcementService';
import { Megaphone, Plus, Trash2, AlertTriangle } from 'lucide-react';

const PRIORITY_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  normal:    { color: 'var(--text-secondary)', label: 'Notice',    bg: 'var(--bg-base)' },
  important: { color: '#eab308',               label: 'Important', bg: 'rgba(234,179,8,0.08)' },
  urgent:    { color: '#dc2626',               label: 'Urgent',    bg: 'rgba(220,38,38,0.08)' },
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AnnouncementsPage = () => {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const { success, error: toastError } = useToastContext();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal' });

  const canPost = user?.role === 'admin' || user?.role === 'teacher';

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementService.getAll();
      setAnnouncements(data);
    } catch {
      toastError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // ── Real-time: new announcements + deletions + presence ──
  useEffect(() => {
    if (!socket) return;

    const handleNew = (announcement: Announcement) => {
      setAnnouncements(prev => [announcement, ...prev]);
    };
    const handleDeleted = ({ _id }: { _id: string }) => {
      setAnnouncements(prev => prev.filter(a => a._id !== _id));
    };
    const handlePresence = ({ userId, online }: { userId: string; online: boolean }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (online) next.add(userId); else next.delete(userId);
        return next;
      });
    };

    socket.on('announcement:new', handleNew);
    socket.on('announcement:deleted', handleDeleted);
    socket.on('presence:update', handlePresence);

    // Ask server for the current online set on mount
    socket.emit('presence:request');
    socket.on('presence:list', (ids: string[]) => setOnlineUsers(new Set(ids)));

    return () => {
      socket.off('announcement:new', handleNew);
      socket.off('announcement:deleted', handleDeleted);
      socket.off('presence:update', handlePresence);
      socket.off('presence:list');
    };
  }, [socket]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      await announcementService.create(form);
      success('Announcement posted!');
      setForm({ title: '', message: '', priority: 'normal' });
      setShowForm(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to post announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementService.delete(id);
      success('Announcement deleted.');
    } catch {
      toastError('Failed to delete announcement.');
    }
  };

  return (
    <div className="page-section">

      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Communication</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Announcements</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pulse-dot" style={{ backgroundColor: connected ? 'var(--success)' : 'var(--text-muted)' }} />
          <span className="text-caption">{connected ? 'Live' : 'Connecting...'}</span>
          {canPost && (
            <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
              <Plus size={14} /><span>New Announcement</span>
            </button>
          )}
        </div>
      </div>

      {showForm && canPost && (
        <div className="card animate-scale-in" style={{ padding: '20px 24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input className="input" placeholder="Announcement title..."
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                maxLength={150} required />
              <textarea className="input" style={{ height: 90, resize: 'vertical' }}
                placeholder="Write your announcement..."
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                maxLength={2000} required />
              <div style={{ display: 'flex', gap: 8 }}>
                {(['normal', 'important', 'urgent'] as const).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const selected = form.priority === p;
                  return (
                    <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                      style={{
                        padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: selected ? `1.5px solid ${cfg.color}` : '1px solid var(--border-strong)',
                        backgroundColor: selected ? cfg.color + '14' : 'var(--bg-base)',
                        color: selected ? cfg.color : 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  <span>{submitting ? 'Posting...' : 'Post Announcement'}</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
        </div>
      ) : announcements.length === 0 ? (
        <div className="empty-state card animate-fade-up">
          <Megaphone size={28} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p className="empty-state-title">No announcements yet</p>
          <p className="empty-state-body">
            {canPost ? 'Post the first announcement to get started.' : 'Check back later for updates.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a, i) => {
            const cfg = PRIORITY_CONFIG[a.priority] ?? PRIORITY_CONFIG.normal;
            const isOnline = onlineUsers.has(a.postedBy);
            return (
              <div key={a._id} className="card animate-fade-up" style={{
                padding: '18px 22px', position: 'relative', overflow: 'hidden',
                animationDelay: `${Math.min(i, 5) * 40}ms`,
                border: a.priority === 'urgent' ? `1px solid ${cfg.color}40` : undefined,
              }}>
                {a.priority !== 'normal' && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: cfg.color, opacity: 0.6 }} />
                )}

                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {a.priority !== 'normal' && (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
                          padding: '2px 8px', borderRadius: 5,
                          backgroundColor: cfg.bg, color: cfg.color,
                        }}>
                          {a.priority === 'urgent' && <AlertTriangle size={10} />}
                          {cfg.label.toUpperCase()}
                        </span>
                      )}
                      <span className="text-caption">{timeAgo(a.createdAt)}</span>
                    </div>
                    <p className="text-heading" style={{ margin: '0 0 6px' }}>{a.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                      {a.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <div className="avatar" style={{
                          width: 22, height: 22, fontSize: 9,
                          backgroundColor: a.postedByRole === 'admin' ? '#eab308' : '#3b82f6',
                          color: a.postedByRole === 'admin' ? '#09090b' : '#fff',
                        }}>
                          {a.postedByName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                        </div>
                        {isOnline && (
                          <span style={{
                            position: 'absolute', bottom: -1, right: -1,
                            width: 8, height: 8, borderRadius: '50%',
                            backgroundColor: 'var(--success)',
                            border: '2px solid var(--bg-card)',
                          }} />
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {a.postedByName} · <span style={{ textTransform: 'capitalize' as const }}>{a.postedByRole}</span>
                        {isOnline && <span style={{ color: 'var(--success)', fontWeight: 600 }}> · Online now</span>}
                      </span>
                    </div>
                  </div>

                  {canPost && (
                    <button onClick={() => handleDelete(a._id)} style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-base)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--text-muted)',
                    }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsPage;