import { ButtonHTMLAttributes } from 'react';
import { FaDownload, FaEdit, FaEye, FaTrash, FaUndoAlt } from 'react-icons/fa';
import './ActionIconButton.css';

type ActionVariant = 'view' | 'edit' | 'delete' | 'download' | 'return';

interface ActionIconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant: ActionVariant;
  tooltip?: string;
  showLabel?: boolean;
  label?: string;
}

const ActionIconButton = ({
  variant,
  tooltip,
  showLabel = false,
  label,
  className = '',
  type = 'button',
  ...props
}: ActionIconButtonProps) => {
  const defaultLabel =
    label ||
    (variant === 'view'
      ? 'View'
      : variant === 'edit'
      ? 'Edit'
      : variant === 'delete'
      ? 'Delete'
      : variant === 'download'
      ? 'Download'
      : 'Return');
  const title = tooltip || defaultLabel;
  const variantClass =
    variant === 'view'
      ? 'btn-view'
      : variant === 'edit'
      ? 'btn-edit'
      : variant === 'delete'
      ? 'btn-delete'
      : 'btn-primary';
  const Icon =
    variant === 'view'
      ? FaEye
      : variant === 'edit'
      ? FaEdit
      : variant === 'delete'
      ? FaTrash
      : variant === 'download'
      ? FaDownload
      : FaUndoAlt;

  return (
    <button
      type={type}
      className={`action-icon-btn ${variantClass} ${showLabel ? 'show-label' : ''} ${className}`.trim()}
      title={title}
      aria-label={title}
      {...props}
    >
      <Icon className="action-icon-glyph" aria-hidden="true" />
      <span className="action-icon-label">{defaultLabel}</span>
    </button>
  );
};

export default ActionIconButton;

