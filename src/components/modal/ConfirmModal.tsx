import React from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={isOpen} onClose={onCancel} className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

        <div className="relative bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-auto shadow-lg z-50">
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <X size={20} />
          </button>
          <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 dark:text-gray-300 mb-6">
            {description}
          </Dialog.Description>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmModal;
