import { ReactNode } from 'react';
import Modal from './Modal';

type ConfirmActionVariant = 'danger' | 'warning' | 'primary';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: ConfirmActionVariant;
  children?: ReactNode;
}

const getConfirmButtonClass = (variant: ConfirmActionVariant) => {
  if (variant === 'danger') return 'btn-delete';
  if (variant === 'warning') return 'btn-warning';
  return 'btn-primary';
};

const getDefaultIcon = (variant: ConfirmActionVariant) => {
  if (variant === 'primary') return 'ℹ️';
  return '⚠️';
};

const ConfirmActionModal = ({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
  children,
}: ConfirmActionModalProps) => {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose} size="small">
      <div className="confirmation-modal-content">
        <div className="confirmation-icon">{getDefaultIcon(variant)}</div>
        <p className="confirmation-message">{message}</p>
        {children}
        <div className="confirmation-actions">
          <button className="btn-secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            className={getConfirmButtonClass(variant)}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmActionModal;
