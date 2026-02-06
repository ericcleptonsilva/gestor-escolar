import React from 'react';
import { Printer } from 'lucide-react';

export const PrintButton = ({ onClick, label = "Gerar PDF" }: { onClick: () => void, label?: string }) => (
    <button
        onClick={onClick}
        className="flex w-full items-center justify-center space-x-1 px-2 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-lg transition-colors shadow-sm hover:shadow-md no-print ml-auto whitespace-nowrap"
        title="Gerar Relatório Completo em PDF"
    >
        <Printer size={18} />
        <span className="font-bold text-sm hidden md:inline">{label}</span>
    </button>
);
