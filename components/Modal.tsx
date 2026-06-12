import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose} 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity"
    >
      {/* Container مودال */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-right shadow-2xl transition-all animate-in fade-in zoom-in duration-300"
      >
        {/* دکمه بستن */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-red-500 transition-colors text-xl"
        >
          ✕
        </button>

        {/* عنوان مودال */}
        {title && (
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
            {title}
          </h3>
        )}

        {/* محتوای مودال */}
        <div className="py-4 text-gray-700 text-center">
          {children}
        </div>

        {/* دکمه‌های عملیاتی */}
        <div className="mt-6 flex justify-center gap-4">
          <button 
            onClick={onConfirm} 
            className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-white font-medium hover:bg-red-600 active:scale-95 transition-all"
          >
            بله، مطمئنم
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 active:scale-95 transition-all"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;