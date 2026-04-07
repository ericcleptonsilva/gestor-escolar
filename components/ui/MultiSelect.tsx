import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  options: { label: string; value: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Selecione...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleToggleAll = () => {
    if (selectedValues.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.value));
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      <div
        className="w-full pl-3 pr-10 py-2 min-h-[42px] rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer flex items-center justify-between text-slate-800 dark:text-slate-100"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`text-sm truncate ${selectedValues.length === 0 ? 'text-slate-500 dark:text-slate-400' : ''}`}>
          {selectedValues.length === 0
            ? placeholder
            : `${selectedValues.length} selecionado(s)`}
        </span>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
           <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 top-[calc(100%+4px)] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700 z-10">
            <button
              onClick={handleToggleAll}
              className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
            >
              {selectedValues.length === options.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
          <div className="p-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <label
                  key={option.value}
                  className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md cursor-pointer group"
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleOption(option.value);
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                    }`}
                  >
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{option.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
