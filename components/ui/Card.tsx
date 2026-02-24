import React from 'react';

export const Card: React.FC<{ children?: React.ReactNode, className?: string, onClick?: (e: React.MouseEvent) => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-200 break-inside-avoid ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`p-6 border-b border-slate-100 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <h3 className={`text-lg font-bold text-slate-800 dark:text-white ${className}`}>
    {children}
  </h3>
);

export const CardContent: React.FC<{ children?: React.ReactNode, className?: string }> = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);
