import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  className = "",
  ...rest
}: {
  children?: React.ReactNode,
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'success' | 'warning',
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const baseStyle = "px-2 py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-md shadow-indigo-200 dark:shadow-none",
    secondary: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95",
    danger: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 active:scale-95",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95",
    warning: "bg-amber-500 text-white hover:bg-amber-600 active:scale-95",
    outline: "border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95"
  };

  return (
    <button
      {...rest}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
