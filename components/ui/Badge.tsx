import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  color?: "slate" | "green" | "red" | "yellow" | "blue";
  size?: "sm" | "md";
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const Badge = ({ children, color = "slate", size = "md", onClick, className = "" }: BadgeProps) => {
  const colors = {
    slate: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
    green: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
    red: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400",
    yellow: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400",
    blue: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  };

  const sizes = {
    sm: "px-1.5 py-0.5 text-[9px]",
    md: "px-2 py-0.5 text-[10px]"
  };

  return (
    <span
      onClick={onClick}
      className={`${sizes[size]} rounded font-bold border border-transparent whitespace-nowrap transition-transform active:scale-95 ${colors[color]} ${className}`}
    >
      {children}
    </span>
  );
};
