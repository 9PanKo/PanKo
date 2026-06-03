/** PanKo — Password field with show/hide toggle. */
import { useState } from 'react';

export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-group">
      {label && <label htmlFor={id}>{label}</label>}
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="password-field__toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          <i className={`fa-solid ${visible ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

