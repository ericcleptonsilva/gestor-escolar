import React from 'react';

export const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick
}: {
  icon: any,
  label: string,
  active: boolean,
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <Icon size={20} className="flex-shrink-0" />
    <span className="font-medium truncate">{label}</span>
  </button>
);
