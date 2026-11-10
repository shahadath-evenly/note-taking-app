'use client';

import Modal from './Modal';
import Button from '@/components/forms/Button';
import Spinner from '@/components/common/Spinner';
import ErrorMessage from '@/components/common/ErrorMessage';

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  isConfirming = false,
  error = null,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      <div className="mt-2">
        <ErrorMessage message={error} />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isConfirming}>
          Cancel
        </Button>
        <Button type="button" onClick={onConfirm} disabled={isConfirming}>
          {isConfirming ? <Spinner /> : null}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
