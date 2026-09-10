import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToastContext } from '../context/ToastContext';
import type { Doubt, DoubtMessage } from '../services/doubtService';
import {
  baseApi,
  useAppDispatch,
  useCreateDoubtMutation,
  useGetDoubtsQuery,
  useReplyToDoubtMutation,
  useCloseDoubtMutation,
} from '../store';
import { MessageCircle, Send, Plus, CheckCircle, X } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  open: { color: 'var(--status-warning)', label: 'Open' },
  answered: { color: 'var(--accent-primary)', label: 'Answered' },
  closed: { color: 'var(--status-success)', label: 'Closed' },
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

const DoubtsPage = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { success, error: toastError } = useToastContext();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newText, setNewText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();
  const { data: doubts = [], isLoading: loading, error } = useGetDoubtsQuery();
  const [createDoubt] = useCreateDoubtMutation();
  const [replyToDoubt] = useReplyToDoubtMutation();
  const [closeDoubt] = useCloseDoubtMutation();

  const isStudent = user?.role === 'student';

  useEffect(() => {
    if (error) toastError('Failed to load doubts.');
  }, [error, toastError]);

  useEffect(() => {
    if (!selectedId && doubts.length > 0) setSelectedId(doubts[0]._id);
  }, [doubts, selectedId]);

  const selectedDoubt = doubts.find(d => d._id === selectedId) ?? null;

  // ── Join/leave the doubt room when selection changes ──
  useEffect(() => {
    if (!socket || !selectedId) return;
    socket.emit('doubt:join', selectedId);
    return () => { socket.emit('doubt:leave', selectedId); };
  }, [socket, selectedId]);

  // ── Real-time: new doubt created (teachers see it appear) ──
  useEffect(() => {
    if (!socket) return;
    const handleNewDoubt = (doubt: Doubt) => {
      if (isStudent) return; // students only see their own, already in initial fetch
      dispatch(baseApi.util.updateQueryData('getDoubts', undefined, current => {
        if (!current.some(item => item._id === doubt._id)) current.unshift(doubt);
      }));
    };
    socket.on('doubt:new', handleNewDoubt);
    return () => { socket.off('doubt:new', handleNewDoubt); };
  }, [socket, isStudent]);

  // ── Real-time: new message in the currently open thread ──
  useEffect(() => {
    if (!socket) return;
    const handleMessage = (payload: {
      doubtId: string; message: DoubtMessage; status: string;
      teacherId?: string; teacherName?: string;
    }) => {
      dispatch(baseApi.util.updateQueryData('getDoubts', undefined, current => {
        const doubt = current.find(item => item._id === payload.doubtId);
        if (!doubt || doubt.messages.some(message => message.createdAt === payload.message.createdAt && message.text === payload.message.text)) return;
        doubt.messages.push(payload.message);
        doubt.status = payload.status as Doubt['status'];
        doubt.teacherId = payload.teacherId ?? doubt.teacherId;
        doubt.teacherName = payload.teacherName ?? doubt.teacherName;
        doubt.lastMessageAt = payload.message.createdAt;
      }));
    };
    socket.on('doubt:message', handleMessage);
    return () => { socket.off('doubt:message', handleMessage); };
  }, [socket]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedDoubt?.messages.length]);

  const handleCreateDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newText.trim()) return;
    setCreating(true);
    try {
      const doubt = await createDoubt({ subject: newSubject, text: newText }).unwrap();
      dispatch(baseApi.util.updateQueryData('getDoubts', undefined, current => {
        if (!current.some(item => item._id === doubt._id)) current.unshift(doubt);
      }));
      setSelectedId(doubt._id);
      setNewSubject(''); setNewText('');
      setShowNewForm(false);
      success('Doubt submitted!');
    } catch (err: any) {
      toastError(err.message || 'Failed to submit doubt.');
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedDoubt) return;
    setSending(true);
    const text = replyText;
    setReplyText('');
    try {
      await replyToDoubt({ id: selectedDoubt._id, text }).unwrap();
      // Message arrives via socket event — no need to manually append
    } catch (err: any) {
      toastError(err.message || 'Failed to send message.');
      setReplyText(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await closeDoubt(id).unwrap();
      dispatch(baseApi.util.updateQueryData('getDoubts', undefined, current => {
        const doubt = current.find(item => item._id === id);
        if (doubt) doubt.status = 'closed';
      }));
      success('Doubt marked as closed.');
    } catch {
      toastError('Failed to close doubt.');
    }
  };

  return (
    <div className="page-section">

      <div className="flex-between animate-fade-in">
        <div>
          <p className="text-eyebrow">Communication</p>
          <h1 className="text-title" style={{ marginTop: 4 }}>Doubts</h1>
        </div>
        {isStudent && (
          <button className="btn btn-primary" onClick={() => setShowNewForm(true)}>
            <Plus size={14} /><span>Ask a Doubt</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 200px)', minHeight: 480 }}>

        {/* ── Thread list ── */}
        <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <p className="text-heading" style={{ fontSize: 13 }}>
              {isStudent ? 'My Doubts' : 'All Doubts'} ({doubts.length})
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 50, borderRadius: 8 }} />
                </div>
              ))
            ) : doubts.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <MessageCircle size={24} style={{ opacity: 0.3, marginBottom: 10 }} />
                <p className="empty-state-title" style={{ fontSize: 12 }}>No doubts yet</p>
              </div>
            ) : (
              doubts.map(d => {
                const cfg = STATUS_CONFIG[d.status];
                const isSelected = d._id === selectedId;
                return (
                  <button
                    key={d._id}
                    onClick={() => setSelectedId(d._id)}
                    style={{
                      width: '100%', textAlign: 'left' as const,
                      padding: '12px 18px', border: 'none', cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(234,179,8,0.06)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                        {d.subject}
                      </p>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
                    </div>
                    {!isStudent && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 4px' }}>{d.studentName}</p>
                    )}
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                      {timeAgo(d.lastMessageAt)} · {d.messages.length} msg{d.messages.length !== 1 ? 's' : ''}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Thread view ── */}
        <div className="card animate-fade-up" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', animationDelay: '60ms' }}>
          {!selectedDoubt ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={32} style={{ opacity: 0.25, marginBottom: 12 }} />
              <p className="empty-state-title">Select a doubt to view</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex-between" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="text-heading" style={{ fontSize: 14, margin: 0 }}>{selectedDoubt.subject}</p>
                  <p className="text-caption" style={{ margin: '2px 0 0' }}>
                    {isStudent ? (selectedDoubt.teacherName ? `Answered by ${selectedDoubt.teacherName}` : 'Waiting for a teacher') : selectedDoubt.studentName}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                    backgroundColor: STATUS_CONFIG[selectedDoubt.status].color + '15',
                    color: STATUS_CONFIG[selectedDoubt.status].color,
                  }}>
                    {STATUS_CONFIG[selectedDoubt.status].label.toUpperCase()}
                  </span>
                  {!isStudent && selectedDoubt.status !== 'closed' && (
                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => handleClose(selectedDoubt._id)}>
                      <CheckCircle size={11} /><span>Close</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedDoubt.messages.map((m, i) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <div style={{ maxWidth: '75%' }}>
                        <div style={{
                          padding: '10px 14px', borderRadius: 14,
                          borderBottomRightRadius: isMine ? 4 : 14,
                          borderBottomLeftRadius: isMine ? 14 : 4,
                          backgroundColor: isMine ? 'var(--accent)' : 'var(--bg-base)',
                          color: isMine ? '#09090b' : 'var(--text-primary)',
                          border: isMine ? 'none' : '1px solid var(--border)',
                        }}>
                          <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' as const }}>
                            {m.text}
                          </p>
                        </div>
                        <p style={{
                          fontSize: 10, color: 'var(--text-muted)', margin: '4px 4px 0',
                          textAlign: isMine ? 'right' as const : 'left' as const,
                        }}>
                          {m.senderName} · {timeAgo(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              {selectedDoubt.status !== 'closed' ? (
                <form onSubmit={handleReply} style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input
                    className="input" style={{ flex: 1 }}
                    placeholder="Type your message..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    maxLength={1000}
                  />
                  <button type="submit" className="btn btn-primary" disabled={sending || !replyText.trim()} style={{ padding: '8px 14px' }}>
                    <Send size={14} />
                  </button>
                </form>
              ) : (
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' as const }}>
                  <p className="text-caption">This doubt has been closed.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* New doubt modal */}
      {showNewForm && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowNewForm(false); }}>
          <div className="modal-box">
            <div className="flex-between" style={{ marginBottom: 4 }}>
              <p className="modal-title">Ask a Doubt</p>
              <button onClick={() => setShowNewForm(false)} style={{
                width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'var(--text-muted)',
              }}>
                <X size={14} />
              </button>
            </div>
            <p className="modal-subtitle">Your question will be sent to the first available teacher.</p>
            <div className="divider" style={{ margin: '0 0 20px' }} />

            <form onSubmit={handleCreateDoubt}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="input-label">Subject *</label>
                  <input className="input" placeholder="e.g. Doubt about recursion in DSA"
                    value={newSubject} onChange={e => setNewSubject(e.target.value)} maxLength={150} required />
                </div>
                <div>
                  <label className="input-label">Your Question *</label>
                  <textarea className="input" style={{ height: 100, resize: 'vertical' }}
                    placeholder="Describe your doubt in detail..."
                    value={newText} onChange={e => setNewText(e.target.value)} maxLength={1000} required />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={creating}>
                    <span>{creating ? 'Submitting...' : 'Submit Doubt'}</span>
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowNewForm(false)}>
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoubtsPage;