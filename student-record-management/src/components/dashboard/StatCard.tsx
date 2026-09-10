import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon | ReactNode;
  trend?: { value: number; label: string };
  valueColor?: string;
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'red' | 'slate';
}

const COLOR_TOKENS = {
  yellow: { bg: 'var(--accent-subtle)', icon: 'var(--accent-primary)' },
  blue: { bg: 'var(--accent-subtle)', icon: 'var(--accent-primary)' },
  green: { bg: 'var(--accent-subtle)', icon: 'var(--accent-primary)' },
  purple: { bg: 'var(--accent-subtle)', icon: 'var(--accent-primary)' },
  red: { bg: 'var(--accent-subtle)', icon: 'var(--accent-primary)' },
  slate: { bg: 'var(--accent-subtle)', icon: 'var(--accent-primary)' },
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  valueColor,
  color = 'yellow',
}: StatCardProps) => {
  const token = COLOR_TOKENS[color] || COLOR_TOKENS.yellow;
  const isPositive = (trend?.value ?? 0) >= 0;

  const renderIcon = () => {
    if (!Icon) return null;
    // Check if Icon is a LucideIcon component (function/object) or direct ReactNode element
    if (typeof Icon === 'function' || (typeof Icon === 'object' && 'render' in Icon)) {
      const LucideComp = Icon as LucideIcon;
      return <LucideComp size={15} style={{ color: token.icon, flexShrink: 0 }} />;
    }
    return Icon;
  };

  return (
    <div
      className="stat-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Subtle top-edge accent gradient line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 2.5,
        background: `linear-gradient(90deg, ${token.icon}cc, ${token.icon}44)`,
        borderRadius: '24px 24px 0 0',
      }} />

      {/* Icon + Title Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="stat-card-label" style={{ margin: 0 }}>{title}</p>
        <div
          className="stat-card-icon"
          style={{
            backgroundColor: token.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {renderIcon()}
        </div>
      </div>

      {/* Metric Value */}
      <p className="stat-card-value" style={valueColor ? { color: valueColor } : undefined}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Trend Indicator */}
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
            fontFamily: 'IBM Plex Mono, monospace',
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
