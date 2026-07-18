import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService } from '../../services/studentService';
import { MousePointer2, ArrowRight } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [user]);

  if (loading) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: 0 }}>
      {/* ── HERO SECTION ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '40px', alignItems: 'center' }}>
        {/* Left: 7 cols */}
        <div style={{ gridColumn: 'span 7' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '6px 12px', borderRadius: '99px',
            border: '1px solid var(--border-strong)',
            marginBottom: '24px'
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulse 2s infinite' }} />
            AI-Enhanced Protocol
          </div>
          <h1 style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: '7.5rem',
            lineHeight: 0.85,
            fontWeight: 700,
            letterSpacing: '-0.06em',
            margin: 0,
            color: 'var(--text-primary)'
          }}>
            SYSTEM<br />
            <span style={{
              fontStyle: 'italic',
              background: 'linear-gradient(90deg, #ccff00 0%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              paddingRight: 10
            }}>OVERRIDE</span>
          </h1>
          <p style={{
            marginTop: '32px', fontSize: '18px', color: 'var(--text-secondary)',
            maxWidth: '80%', lineHeight: 1.5, fontFamily: 'Space Grotesk, sans-serif'
          }}>
            A futuristic glassmorphism architecture built for high-contrast data visualization. Welcome back, {user?.name?.split(' ')[0]}.
          </p>
          <button className="neon-pulse-btn" style={{ marginTop: '40px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            INITIALIZE <ArrowRight size={16} />
          </button>
        </div>

        {/* Right: 5 cols */}
        <div style={{ gridColumn: 'span 5', position: 'relative', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-effect" style={{
            width: '100%', height: '100%', borderRadius: '2.5rem',
            position: 'relative', overflow: 'hidden', padding: '32px',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ width: 40, height: 12, backgroundColor: 'var(--border-strong)', borderRadius: 6 }} />
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--accent)', borderRadius: '50%' }} />
            </div>
            
            <div className="glass-effect" style={{
              padding: '24px', borderRadius: '1.5rem',
              animation: 'float 6s infinite ease-in-out'
            }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)', margin: '0 0 8px 0' }}>// MODULE_A</p>
              <div style={{ width: '80%', height: 8, backgroundColor: 'var(--border-strong)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '60%', height: 8, backgroundColor: 'var(--border-strong)', borderRadius: 4 }} />
            </div>

            <div className="glass-effect" style={{
              padding: '24px', borderRadius: '1.5rem',
              animation: 'float 6s infinite ease-in-out 1.5s', marginLeft: '20px'
            }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#10b981', margin: '0 0 8px 0' }}>// MODULE_B</p>
              <div style={{ width: '90%', height: 8, backgroundColor: 'var(--border-strong)', borderRadius: 4, marginBottom: 8 }} />
              <div style={{ width: '40%', height: 8, backgroundColor: 'var(--border-strong)', borderRadius: 4 }} />
            </div>

            <div style={{
              position: 'absolute', bottom: 60, right: 40,
              backgroundColor: 'var(--accent)', color: '#000',
              padding: '6px 12px', borderRadius: '99px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 10px 20px rgba(204, 255, 0, 0.3)',
              animation: 'float 6s infinite ease-in-out 0.5s', zIndex: 10
            }}>
              <MousePointer2 size={12} fill="#000" />
              AI Cursor
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', gridAutoRows: '220px' }}>
        {/* Large Card (2x2) */}
        <div className="glass-effect" style={{
          gridColumn: 'span 2', gridRow: 'span 2', borderRadius: '2.5rem', padding: '40px',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          position: 'relative', overflow: 'hidden'
        }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', marginBottom: 8 }}>DATA_VIZ</p>
          <h2 style={{ fontSize: '32px', margin: 0, fontWeight: 600 }}>Performance Metrics</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, marginTop: 32 }}>
            {[40, 70, 45, 90, 65, 80, 50, 100, 75, 60].map((h, i) => (
              <div key={i} style={{
                flex: 1, height: `${h}%`, backgroundColor: i === 7 ? 'var(--accent)' : 'var(--border-strong)',
                borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease'
              }} />
            ))}
          </div>
        </div>

        {/* Tall Card (1x2) */}
        <div className="glass-effect" style={{
          gridColumn: 'span 1', gridRow: 'span 2', borderRadius: '2.5rem', padding: '40px',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <h3 style={{ fontSize: '24px', margin: '0 0 24px 0' }}>Tokens</h3>
          {[
            { label: 'Obsidian', color: '#000000' },
            { label: 'Lime', color: '#ccff00' },
            { label: 'Emerald', color: '#10b981' },
            { label: 'White', color: '#ffffff' }
          ].map(t => (
            <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: t.color, border: '1px solid var(--border)' }} />
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{t.label}</p>
            </div>
          ))}
        </div>

        <div className="glass-effect" style={{ gridColumn: 'span 1', gridRow: 'span 1', borderRadius: '2.5rem', padding: '32px' }}>
           <p style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', marginBottom: 8 }}>V 2.0</p>
           <h3 style={{ fontSize: '24px', margin: 0 }}>System Online</h3>
        </div>

        {/* Accent Card */}
        <div style={{
          gridColumn: 'span 1', gridRow: 'span 1', borderRadius: '2.5rem', padding: '32px',
          backgroundColor: 'var(--accent)', color: '#000', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }} />
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, marginBottom: 8, position: 'relative' }}>CRITICAL</p>
          <h3 style={{ fontSize: '24px', margin: 0, fontWeight: 700, position: 'relative' }}>All Systems Nominal</h3>
        </div>
      </section>

      {/* ── CONTRAST SECTION ── */}
      <section style={{
        backgroundColor: '#e5e5e5', color: '#000', borderRadius: '4rem 4rem 2.5rem 2.5rem',
        padding: '100px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60,
        marginLeft: '-32px', marginRight: '-32px' // break out of padding
      }}>
        <div>
          <h2 style={{ fontSize: '4rem', fontWeight: 700, lineHeight: 1, marginBottom: 40, letterSpacing: '-0.04em' }}>
            Core<br />Methodology
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {[
              { num: '01', title: 'Data Integrity', desc: 'Immutable ledger architecture.' },
              { num: '02', title: 'Real-time Sync', desc: 'Zero latency state propagation.' },
              { num: '03', title: 'Access Control', desc: 'Role-based hierarchical auth.' }
            ].map(i => (
              <div key={i.num} style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', border: '1px solid #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, flexShrink: 0
                }}>
                  {i.num}
                </div>
                <div>
                  <h4 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 8px 0' }}>{i.title}</h4>
                  <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.6)', margin: 0 }}>{i.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 400, height: 400, borderRadius: '50%', backgroundColor: '#000',
            backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop)',
            backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(100%)'
          }} />
          <div style={{
            position: 'absolute', bottom: -20, left: 20, right: 20,
            background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)',
            padding: '24px', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 18, fontWeight: 500, margin: '0 0 12px 0' }}>
              "The glassmorphism implementation is flawless. It feels like software from 2030."
            </p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, margin: 0 }}>— LEAD ARCHITECT</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        backgroundColor: '#000', borderRadius: '2.5rem', padding: '100px 60px 40px',
        position: 'relative', overflow: 'hidden',
        marginLeft: '-32px', marginRight: '-32px', marginBottom: '-28px' // flush to bottom of shell
      }}>
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          fontSize: '12rem', fontWeight: 800, color: '#fff', opacity: 0.03,
          fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.06em', pointerEvents: 'none'
        }}>
          SUPER
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 100, position: 'relative' }}>
          <button className="neon-pulse-btn" style={{
            fontSize: 24, padding: '24px 64px', borderRadius: '999px',
            position: 'relative', overflow: 'hidden', display: 'inline-block'
          }}>
            <span style={{ position: 'relative', zIndex: 2 }}>DEPLOY PROJECT</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 40 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            © 2026 ACADEMIC SUITE.<br/>ALL RIGHTS RESERVED.
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
             {['Privacy', 'Terms', 'Security'].map(l => (
               <span key={l} style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>{l}</span>
             ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
             {[1, 2, 3].map(i => (
               <div key={i} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
               </div>
             ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentDashboard;