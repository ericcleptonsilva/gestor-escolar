import React from 'react';
import { Loader2, Upload, Image as ImageIcon, Phone, Download } from 'lucide-react';

export const ExportButton = ({ onClick, label = "CSV" }: { onClick: () => void, label?: string }) => (
    <button
        onClick={onClick}
        className="flex w-full items-center justify-center space-x-1 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md no-print ml-auto whitespace-nowrap"
        title="Exportar dados para Excel/CSV"
    >
        <Download size={18} />
        <span className="font-bold text-sm hidden md:inline">{label}</span>
    </button>
);

export const ImportButton = ({ onFileSelect, label = "Importar CSV", isLoading = false }: { onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, label?: string, isLoading?: boolean }) => (
  <label className={`flex w-full items-center justify-center space-x-1 px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md no-print ml-auto cursor-pointer whitespace-nowrap ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
      <span className="font-bold text-sm hidden md:inline">{label}</span>
      <input type="file" accept=".csv" onChange={onFileSelect} disabled={isLoading} className="hidden" />
  </label>
);

export const PhotoImportButton = ({ onFileSelect, label = "Importar Pasta Fotos", isLoading = false }: { onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, label?: string, isLoading?: boolean }) => (
  <label className={`flex w-full items-center justify-center space-x-1 px-2  py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md no-print ml-auto cursor-pointer whitespace-nowrap ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} title="Selecione uma pasta contendo as fotos. O nome do arquivo deve ser a matrícula (ex: 001.jpg)">
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
      <span className="font-bold text-sm hidden md:inline">{label}</span>
      {/* webkitdirectory allows folder selection */}
      <input
        type="file"
        accept="image/*"
        multiple
        {...({ webkitdirectory: "", directory: "" } as any)}
        onChange={onFileSelect}
        disabled={isLoading}
        className="hidden"
      />
  </label>
);

export const PhoneImportButton = ({ onFileSelect, label = "Importar Telefones", isLoading = false }: { onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void, label?: string, isLoading?: boolean }) => (
  <label className={`flex w-full items-center justify-center space-x-1 px-2 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md no-print ml-auto cursor-pointer whitespace-nowrap ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Phone size={18} />}
      <span className="font-bold text-sm hidden md:inline">{label}</span>
      <input type="file" accept=".txt,.csv" onChange={onFileSelect} disabled={isLoading} className="hidden" />
  </label>
);
