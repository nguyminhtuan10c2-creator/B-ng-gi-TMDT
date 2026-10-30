import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#0b1734] text-white px-4 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-blue-500/30 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span>{message}</span>
    </div>
  );
};
