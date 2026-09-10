import { forwardRef, InputHTMLAttributes, useId, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  rightIcon,
  className = '',
  id: externalId,
  required,
  disabled,
  style,
  ...props
}, ref) => {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [
    hint ? hintId : null,
    error ? errorId : null,
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>

      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="input-label"
          style={{ opacity: disabled ? 0.6 : 1 }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>
          )}
        </label>
      )}

      {/* Input Container */}
      <div style={{ position: 'relative', width: '100%' }}>
        {/* Left Icon */}
        {icon && (
          <span style={{
            position: 'absolute',
            left: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: 1,
          }}>
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          disabled={disabled}
          required={required}
          className={`input ${className}`}
          style={{
            paddingLeft: icon ? 34 : undefined,
            paddingRight: rightIcon ? 34 : undefined,
            borderColor: error ? 'var(--error)' : undefined,
            boxShadow: error ? '0 0 0 3px rgba(220,38,38,0.08)' : undefined,
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
            ...style,
          }}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <span style={{
            position: 'absolute',
            right: 11,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
          }}>
            {rightIcon}
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p
          id={errorId}
          style={{
            marginTop: 5,
            fontSize: 12,
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Hint Message (Hidden if there is an active error) */}
      {hint && !error && (
        <p
          id={hintId}
          style={{ marginTop: 5, fontSize: 12, color: 'var(--text-muted)' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';