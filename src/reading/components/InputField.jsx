export function InputField({ label, required, error, children, hint }) {
  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {children}
      {hint && <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 5 }}>{hint}</p>}
      {error && <p style={{ fontSize: 12.5, color: 'var(--danger)', marginTop: 5 }}>{error}</p>}
    </div>
  )
}

const baseStyle = {
  width: '100%', height: 40, padding: '0 14px', borderRadius: 8,
  fontSize: 14, color: 'var(--text-primary)',
  backgroundColor: 'var(--bg-card)',
  border: '1px solid var(--border-strong)',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit', boxSizing: 'border-box',
}

export function TextInput({ label, required, error, hint, className = '', style = {}, ...props }) {
  return (
    <InputField label={label} required={required} error={error} hint={hint}>
      <input
        className={`rt-input ${className}`}
        style={{ ...baseStyle, ...style }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none' }}
        {...props}
      />
    </InputField>
  )
}

export function TextareaInput({ label, required, error, hint, rows = 3, className = '', style = {}, ...props }) {
  return (
    <InputField label={label} required={required} error={error} hint={hint}>
      <textarea
        rows={rows}
        className={`rt-textarea ${className}`}
        style={{ ...baseStyle, height: 'auto', padding: '10px 14px', resize: 'none', ...style }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none' }}
        {...props}
      />
    </InputField>
  )
}

export function SelectInput({ label, required, error, hint, children, className = '', style = {}, ...props }) {
  return (
    <InputField label={label} required={required} error={error} hint={hint}>
      <select
        className={`rt-select ${className}`}
        style={{ ...baseStyle, cursor: 'pointer', ...style }}
        onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)' }}
        onBlur={e => { e.target.style.borderColor = 'var(--border-strong)'; e.target.style.boxShadow = 'none' }}
        {...props}
      >
        {children}
      </select>
    </InputField>
  )
}
