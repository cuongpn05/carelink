import React from 'react';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  rounded?: 'full' | 'md';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      rounded = 'full',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classNames = [
      'cds-btn',
      `cds-btn--${variant}`,
      `cds-btn--${size}`,
      rounded === 'md' ? 'cds-btn--rounded-md' : '',
      fullWidth ? 'cds-btn--full' : '',
      isLoading ? 'cds-btn--loading' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={props.type || 'button'}
        className={classNames}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && <span className="cds-btn-spinner" aria-hidden="true" />}
        {!isLoading && leftIcon && <span className="cds-btn-icon cds-btn-icon--left">{leftIcon}</span>}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="cds-btn-icon cds-btn-icon--right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;

