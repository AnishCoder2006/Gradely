import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'yellow' | 'blue' | 'green' | 'purple';
}

const colorTokens = {
  yellow: { bg: 'rgba(217,119,6,0.08)',   icon: '#d97706' },
  blue:   { bg: 'rgba(99,102,241,0.08)',  icon: '#6366f1' },
  green:  { bg: 'rgba(13,148,136,0.08)',  icon: '#0d9488' },
  purple: { bg: 'rgba(139,92,246,0.08)',  icon: '#8b5cf6' },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'yellow',
}: StatCardProps) => {
  const token = colorTokens[color];
  const isPositive = (trend?.value ?? 0) >= 0;

  return (
    <div
      className="stat-card"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Subtle top-edge accent gradient line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2.5,
        background: `linear-gradient(90deg, ${token.icon}cc, ${token.icon}44)`,
        borderRadius: '24px 24px 0 0',
      }} />

      {/* Icon + title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="stat-card-label">{title}</p>
        <div
          className="stat-card-icon"
          style={{ backgroundColor: token.bg }}
        >
          <Icon size={15} style={{ color: token.icon, flexShrink: 0 }} />
        </div>
      </div>

      {/* Value */}
      <p className="stat-card-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Trend — optional */}
      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          marginTop: 2,
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 2,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'Geist Mono, monospace',
            color: isPositive ? 'var(--success)' : 'var(--error)',
            backgroundColor: isPositive ? 'var(--success-bg)' : 'var(--error-bg)',
            padding: '2px 6px',
            borderRadius: 99,
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {trend.label}
          </span>
        </div>
      )}
    </div>
  );
};