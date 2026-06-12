import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    duration?: number; // زمان به میلی‌ثانیه
    isVisible: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    isVisible,
    onClose
}) => {

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer); // پاکسازی تایمر در صورت بستن دستی
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    // تعیین رنگ بر اساس نوع پیام
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    }[type];

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-in">
            <div className={`${bgColor} text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3 min-w-[300px] justify-between`}>
                <span className="font-medium text-sm">{message}</span>

                {/* دکمه بستن دستی */}
                <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200">
                    ✕
                </button>

                {/* نوار پیشرفت (Progress Bar) پایین پیام */}
                <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-2xl animate-shrink-width"
                    style={{ animationDuration: `${duration}ms` }}>
                </div>
            </div>
        </div>
    );
};

export default Toast;