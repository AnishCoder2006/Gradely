import { InputHTMLAttributes, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  className = '',
  id: externalId,
  ...props
}: InputProps) => {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: '100%' }}>

      {label && (
        <label
          htmlFor={id}
          className="input-label"
        >
          {label}
          {props.required && (
            <span style={{ color: 'var(--accent)', marginLeft: 3 }}>*</span>
          )}
        </label>
      )}

      <div style={{ position: 'relative' }}>
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
          }}>
            {icon}
          </span>
        )}

        <input
          id={id}
          className={`input ${className}`}
          style={{
            paddingLeft: icon ? 34 : undefined,
            borderColor: error ? 'var(--error)' : undefined,
            boxShadow: error
              ? '0 0 0 3px rgba(220,38,38,0.08)'
              : undefined,
          }}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
      </div>

      {/* Error */}
      {error && (
        <p
          id={`${id}-error`}
          style={{
            marginTop: 5,
            fontSize: 12,
            color: 'var(--error)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </p>
      )}

      {/* Hint — only shown when no error */}
      {hint && !error && (
        <p
          id={`${id}-hint`}
          style={{ marginTop: 5, fontSize: 12, color: 'var(--text-muted)' }}
        >
          {hint}
        </p>
      )}
    </div>
  );
};