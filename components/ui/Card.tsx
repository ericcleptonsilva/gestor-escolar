import React from 'react';

export const Card: React.FC<{ children?: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent) => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200 break-inside-avoid ${className}`}>
    {children}
  </div>
);
