import React from 'react';
import { AlertCircle } from 'lucide-react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      isRequired = false,
      disabled = false,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(errorMessage);

    const wrapperClasses = [
      'cds-input-wrapper',
      hasError ? 'cds-input-wrapper--error' : '',
      disabled ? 'cds-input-wrapper--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="cds-input-group">
        {label && (
          <label htmlFor={inputId} className="cds-input-label">
            {label}
            {isRequired && <span className="cds-input-required">*</span>}
          </label>
        )}

        <div className={wrapperClasses}>
          {leftIcon && <span className="cds-input-icon cds-input-icon--left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className="cds-input-field"
            {...props}
          />
          {rightIcon && <span className="cds-input-icon cds-input-icon--right">{rightIcon}</span>}
        </div>

        {hasError && (
          <div id={`${inputId}-error`} className="cds-input-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!hasError && helperText && (
          <p id={`${inputId}-helper`} className="cds-input-helper-text">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
