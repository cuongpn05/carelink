import React from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  errorMessage?: string;
  isRequired?: boolean;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      errorMessage,
      isRequired = false,
      disabled = false,
      id,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    const hasError = Boolean(errorMessage);

    const wrapperClasses = [
      'cds-select-wrapper',
      hasError ? 'cds-select-wrapper--error' : '',
      disabled ? 'cds-select-wrapper--disabled' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="cds-select-group">
        {label && (
          <label htmlFor={selectId} className="cds-select-label">
            {label}
            {isRequired && <span className="cds-select-required">*</span>}
          </label>
        )}

        <div className={wrapperClasses}>
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError}
            className="cds-select-field"
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          <span className="cds-select-chevron" aria-hidden="true">
            <ChevronDown size={18} />
          </span>
        </div>

        {hasError && (
          <div className="cds-select-error-msg" role="alert">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
