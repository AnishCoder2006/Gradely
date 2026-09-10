import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children: ReactNode;
}

const SIZE_STYLES = {
  sm: { padding: '5px 11px', fontSize: 12, gap: 5 },
  md: { padding: '7px 14px', fontSize: 13, gap: 6 },
  lg: { padding: '9px 18px', fontSize: 14, gap: 7 },
};

const ICON_SIZES = { sm: 13, md: 14, lg: 15 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  children,
  className = '',
  disabled,
  style,
  ...props
}, ref) => {
  const isDisableOrLoading = disabled || isLoading;

  const renderIcon = () => {
    if (isLoading && iconPosition === 'left') {
      return (
        <span
          className="btn-spinner"
          style={{
            width: ICON_SIZES[size],
            height: ICON_SIZES[size],
            border: '1.5px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'btn-spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      );
    }

    if (Icon) {
      return <Icon size={ICON_SIZES[size]} style={{ flexShrink: 0 }} />;
    }

    return null;
  };

  return (
    <button
      ref={ref}
      className={`btn btn-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Instrument Sans, sans-serif',
        fontWeight: 500,
        borderRadius: 8,
        cursor: isDisableOrLoading ? 'not-allowed' : 'pointer',
        opacity: isDisableOrLoading ? 0.55 : 1,
        pointerEvents: isDisableOrLoading ? 'none' : 'auto',
        transition: 'all 0.15s ease',
        border: 'none',
        outline: 'none',
        ...SIZE_STYLES[size],
        ...style,
      }}
      disabled={isDisableOrLoading}
      {...props}
    >
      {iconPosition === 'left' && renderIcon()}

      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
        {children}
      </span>

      {iconPosition === 'right' && (
        isLoading ? (
          <span
            className="btn-spinner"
            style={{
              width: ICON_SIZES[size],
              height: ICON_SIZES[size],
              border: '1.5px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'btn-spin 0.6s linear infinite',
              flexShrink: 0,
            }}
          />
        ) : renderIcon()
      )}

      <style>{`
        @keyframes btn-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
});

Button.displayName = 'Button';