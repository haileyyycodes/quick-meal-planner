import { ReactNode } from 'react';
import styles from './FormField.module.css';

type FormFieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  hintId?: string;
  error?: string;
  errorId?: string;
  size?: 'md' | 'sm';
  children: ReactNode;
};

export function FormField({
  label,
  htmlFor,
  required,
  hint,
  hintId,
  error,
  errorId,
  size = 'md',
  children,
}: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={size === 'sm' ? styles.labelSm : styles.label}>
        {label}
        {required && (
          <span aria-hidden="true" className={styles.required}>
            {' '}
            *
          </span>
        )}
      </label>
      {hint && <p id={hintId} className={size === 'sm' ? styles.hintSm : styles.hint}>{hint}</p>}
      {children}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(...ids: Array<string | undefined | false>): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined.length > 0 ? joined : undefined;
}
