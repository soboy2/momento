'use client';

import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          icon: 'text-red-600'
        };
      case 'warning':
        return {
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: 'text-yellow-600'
        };
      case 'info':
        return {
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: 'text-blue-600'
        };
      default:
        return {
          confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
          icon: 'text-red-600'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
          <button 
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-100"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg ${styles.confirmButton} flex items-center`}
            disabled={isLoading}
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 