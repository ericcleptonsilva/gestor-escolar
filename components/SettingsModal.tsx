import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { getApiBaseUrl } from '../services/api';

export const SettingsModal = ({
  isOpen,
  onClose,
  onSave
}: {
  isOpen: boolean,
  onClose: () => void,
  onSave: (newUrl: string) => void
}) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all">
        <div className="flex items-center space-x-3 mb-4 text-indigo-600 dark:text-indigo-400">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Settings size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurações de Conexão</h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
           Configure o endereço do servidor para sincronização de dados.
        </p>

        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                URL do Servidor API (XAMPP/PHP)
            </label>
            <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://192.168.x.x:8787/sistema_escolar_api"
            />
            <p className="text-xs text-slate-500 mt-2">
                Padrão: http://192.168.25.77:8787/sistema_escolar_api
            </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(url)}>
            Salvar e Recarregar
          </Button>
        </div>
      </div>
    </div>
  );
};
