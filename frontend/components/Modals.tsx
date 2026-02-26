
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] px-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center transform transition-all scale-100">
        <h3 className="text-2xl font-bold text-red-500 mb-4">{title}</h3>
        <p className="text-gray-700 mb-8 text-lg">{message}</p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={onCancel}
            className="px-8 py-2 font-bold text-gray-500 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-8 py-2 bg-white border-2 border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white transition-all shadow-md"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
