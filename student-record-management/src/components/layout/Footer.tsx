export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        height: 48,
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        flexShrink: 0,
      }}
    >
      {/* Left — system label + year */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 600,
          color: 'var(--text-secondary)',
          letterSpacing: '-0.01em',
        }}>
          Student Records
        </span>
        <span style={{ color: 'var(--border-strong)', fontSize: 14, lineHeight: 1 }}>·</span>
        <span style={{
          fontSize: 12,
          fontFamily: "'Geist Mono', monospace",
          color: 'var(--text-muted)',
        }}>
          Academic Year 2025–26
        </span>
      </div>

      {/* Right — version + copyright */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11,
          fontFamily: "'Geist Mono', monospace",
          color: 'var(--text-muted)',
          backgroundColor: 'var(--border)',
          padding: '2px 7px',
          borderRadius: 5,
          letterSpacing: '0.02em',
        }}>
          v1.0.0
        </span>
        <span style={{ color: 'var(--border-strong)', fontSize: 14, lineHeight: 1 }}>·</span>
        <span style={{
          fontSize: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          color: 'var(--text-muted)',
        }}>
          © {year} Student Records
        </span>
      </div>
    </footer>
  );
};