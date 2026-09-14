'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  pending?: boolean;
  pendingLabel?: string;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', pending = false, pendingLabel, disabled, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        className={[styles.button, styles[variant], className].filter(Boolean).join(' ')}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        {...rest}
      >
        {pending && <span className={styles.spinner} aria-hidden="true" />}
        <span>{pending && pendingLabel ? pendingLabel : children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
