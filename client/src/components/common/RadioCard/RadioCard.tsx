import React from 'react';
import { Check } from 'lucide-react';
import './RadioCard.css';

export interface RadioCardProps {
  id?: string;
  name?: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const RadioCard: React.FC<RadioCardProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  title,
  description,
  icon,
  disabled = false,
  className = '',
}) => {
  const cardClasses = [
    'cds-radio-card',
    checked ? 'cds-radio-card--checked' : '',
    disabled ? 'cds-radio-card--disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(value);
    }
  };

  return (
    <div
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange(value)}
      onKeyDown={handleKeyDown}
      className={cardClasses}
      id={id}
    >
      {icon && <div className="cds-radio-card-icon">{icon}</div>}
      <div className="cds-radio-card-content">
        <h4 className="cds-radio-card-title">{title}</h4>
        {description && <p className="cds-radio-card-desc">{description}</p>}
      </div>
      <div className="cds-radio-card-indicator" aria-hidden="true">
        {checked && <Check size={12} strokeWidth={3} />}
      </div>
    </div>
  );
};

export default RadioCard;

