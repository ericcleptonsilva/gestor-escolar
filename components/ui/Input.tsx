import React from 'react';

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-100 placeholder-slate-400 ${props.className}`}
  />
);
