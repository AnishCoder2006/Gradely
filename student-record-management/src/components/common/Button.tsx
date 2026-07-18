import { ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const sizeStyles = {
    sm: { padding: '5px 11px', fontSize: 12, gap: 5 },
    md: { padding: '7px 14px', fontSize: 13, gap: 6 },
    lg: { padding: '9px 18px', fontSize: 14, gap: 7 },
  };

  const iconSize = { sm: 13, md: 14, lg: 15 };

  return (
    <button
      className={`btn btn-${variant} ${className}`}
      style={sizeStyles[size]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span style={{
          width: iconSize[size],
          height: iconSize[size],
          border: '1.5px solid currentColor',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'btn-spin 0.6s linear infinite',
          flexShrink: 0,
        }} />
      ) : Icon && (
        <Icon size={iconSize[size]} style={{ flexShrink: 0 }} />
      )}
      {children}

      <style>{`
        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }
        .btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          pointer-events: none;
        }
      `}</style>
    </button>
  );
};