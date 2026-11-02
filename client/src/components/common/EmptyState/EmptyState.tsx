import React from 'react';
import { Inbox } from 'lucide-react';
import './EmptyState.css';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`cds-empty-state ${className}`} role="status">
      <div className="cds-empty-icon-box" aria-hidden="true">
        {icon || <Inbox size={32} />}
      </div>
      <h3 className="cds-empty-title">{title}</h3>
      {description && <p className="cds-empty-description">{description}</p>}
      {action && <div className="cds-empty-action">{action}</div>}
    </div>
  );
};

export default EmptyState;

