'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';

interface EditableFieldProps {
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onSave: (value: string) => void;
}

export default function EditableField({ value, placeholder, icon, onSave }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
  };

  const handleSave = () => {
    onSave(inputValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center text-gray-600 group">
      <div className="mr-2">
        {icon}
      </div>
      
      {isEditing ? (
        <div className="flex items-center flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-sm border-b border-blue-400 focus:outline-none py-1 text-black"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="ml-2 p-1 text-green-500 hover:bg-green-50 rounded-full"
            aria-label="Save"
          >
            <Check size={16} />
          </button>
          <button
            onClick={handleCancel}
            className="ml-1 p-1 text-red-500 hover:bg-red-50 rounded-full"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <span className="text-sm flex-1">{value || placeholder}</span>
          <button 
            onClick={handleEdit}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 size={14} />
          </button>
        </>
      )}
    </div>
  );
} 