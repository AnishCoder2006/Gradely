export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear - 1}–${String(currentYear).slice(2)}`;

  return (
    <footer
      role="contentinfo"
      style={{
        minHeight: 48,
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 32px',
        flexShrink: 0,
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* Left — system label + year */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{
          fontSize: 12,
          fontFamily: "'Instrument Sans', sans-serif",
          fontWeight: 600,
          color: 'var(--text-secondary)',
          letterSpacing: '-0.01em',
        }}>
          Student Records
        </span>
        <span style={{ color: 'var(--border-strong)', fontSize: 14, lineHeight: 1 }}>·</span>
        <span style={{
          fontSize: 12,
          fontFamily: "'IBM Plex Mono', monospace",
          color: 'var(--text-muted)',
        }}>
          Academic Year {academicYear}
        </span>
      </div>

      {/* Right — version + copyright */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 11,
          fontFamily: "'IBM Plex Mono', monospace",
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
          fontFamily: "'Instrument Sans', sans-serif",
          color: 'var(--text-muted)',
        }}>
          © {currentYear} Student Records
        </span>
      </div>
    </footer>
  );
};