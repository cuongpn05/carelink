import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  closeOnBackdropClick?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'md',
  closeOnBackdropClick = true,
  children,
  footer,
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus dialog when opened
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="cds-modal-backdrop"
      onClick={closeOnBackdropClick ? onClose : undefined}
      aria-hidden="true"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'cds-modal-heading' : undefined}
        tabIndex={-1}
        className={`cds-modal-dialog cds-modal-dialog--${size} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="cds-modal-header">
            <div className="cds-modal-header-texts">
              {title && (
                <h2 id="cds-modal-heading" className="cds-modal-title">
                  {title}
                </h2>
              )}
              {subtitle && <p className="cds-modal-subtitle">{subtitle}</p>}
            </div>
            <button
              type="button"
              className="cds-modal-close-btn"
              onClick={onClose}
              aria-label="Đóng hộp thoại"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="cds-modal-body">{children}</div>

        {footer && <div className="cds-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;

