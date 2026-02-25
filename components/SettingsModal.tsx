import React, { useState, useEffect } from 'react';
import { Settings, Image as ImageIcon } from 'lucide-react';
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
  onSave: (settings: { apiBaseUrl: string; schoolName: string; logo: string }) => void
}) => {
  const [url, setUrl] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [logo, setLogo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setSchoolName(localStorage.getItem('escola360_school_name') || 'Gestor de Alunos');
      setLogo(localStorage.getItem('escola360_logo') || '');
    }
  }, [isOpen]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) { // 2MB limit
        alert("A imagem deve ter no máximo 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        setLogo(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogo('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 transform scale-100 transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6 text-indigo-600 dark:text-indigo-400 border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
            <Settings size={28} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Configurações do Sistema</h3>
        </div>

        {/* --- CONEXÃO --- */}
        <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Conexão (API)</h4>
            <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    URL do Servidor
                </label>
                <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="http://localhost/sistema_escolar_api"
                />
                <p className="text-xs text-slate-500">
                    Endereço para sincronização com o XAMPP.
                </p>
            </div>
        </div>

        {/* --- PERSONALIZAÇÃO --- */}
        <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Personalização Visual</h4>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Nome da Escola / Sistema
                    </label>
                    <Input
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        placeholder="Ex: Escola Municipal..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Logotipo
                    </label>
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            {logo ? (
                                <div className="relative group">
                                    <img src={logo} alt="Logo Preview" className="w-20 h-20 object-contain bg-slate-100 rounded-lg border border-slate-200" />
                                    <button
                                        onClick={handleRemoveLogo}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remover Logo"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-400">
                                    <ImageIcon size={24} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="block w-full text-sm text-slate-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100
                                  cursor-pointer
                                "
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Formatos: PNG, JPG, SVG. Máx: 2MB.<br/>
                                A imagem será salva no navegador deste dispositivo.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={() => onSave({ apiBaseUrl: url, schoolName, logo })}>
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
};
