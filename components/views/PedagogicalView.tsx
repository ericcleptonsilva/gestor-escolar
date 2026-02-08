import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Trash2,
  Edit,
  Save,
  X
} from 'lucide-react';
import { AppState, PedagogicalRecord } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface PedagogicalViewProps {
  state: AppState;
  onSaveRecord: (record: PedagogicalRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

export function PedagogicalView({ state, onSaveRecord, onDeleteRecord }: PedagogicalViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PedagogicalRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<PedagogicalRecord>({
      id: '',
      teacherName: '',
      weekStart: '',
      checklist: { agenda: false, exams: false, diaries: false },
      classHours: { planned: 0, given: 0 },
      observation: ''
  });

  const filteredRecords = useMemo(() => {
    return (state.pedagogicalRecords || []).filter(record => {
      const matchesSearch = record.teacherName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWeek = filterWeek ? record.weekStart === filterWeek : true;
      return matchesSearch && matchesWeek;
    });
  }, [state.pedagogicalRecords, searchTerm, filterWeek]);

  const handleOpenModal = (record?: PedagogicalRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({ ...record });
    } else {
      setEditingRecord(null);
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        teacherName: '',
        weekStart: new Date().toISOString().split('T')[0],
        checklist: { agenda: false, exams: false, diaries: false },
        classHours: { planned: 0, given: 0 },
        observation: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.teacherName || !formData.weekStart) {
        alert("Preencha o nome do professor e a semana.");
        return;
    }
    await onSaveRecord(formData);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
      if (confirm("Tem certeza que deseja excluir este registro?")) {
          await onDeleteRecord(id);
      }
  };

  const StatusIcon = ({ checked }: { checked: boolean }) => (
      checked ? <CheckCircle2 className="text-green-500 mx-auto" size={20} /> : <XCircle className="text-red-300 mx-auto" size={20} />
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão Pedagógica</h1>
          <p className="text-slate-500 dark:text-slate-400">Acompanhamento de entregas e horas aula</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus size={18} /> Novo Registro
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Buscar Professor</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Nome do professor..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        <div className="w-full md:w-48">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Filtrar por Semana</label>
            <Input
                type="date"
                value={filterWeek}
                onChange={e => setFilterWeek(e.target.value)}
            />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">Professor</th>
                        <th className="px-6 py-4">Semana (Início)</th>
                        <th className="px-6 py-4 text-center">Agenda</th>
                        <th className="px-6 py-4 text-center">Provas</th>
                        <th className="px-6 py-4 text-center">Diários</th>
                        <th className="px-6 py-4 text-center">Horas (Plan/Dada)</th>
                        <th className="px-6 py-4">Observação</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredRecords.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                                Nenhum registro encontrado.
                            </td>
                        </tr>
                    ) : (
                        filteredRecords.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">{record.teacherName}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(record.weekStart).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                </td>
                                <td className="px-6 py-4 text-center"><StatusIcon checked={record.checklist.agenda} /></td>
                                <td className="px-6 py-4 text-center"><StatusIcon checked={record.checklist.exams} /></td>
                                <td className="px-6 py-4 text-center"><StatusIcon checked={record.checklist.diaries} /></td>
                                <td className="px-6 py-4 text-center">
                                    <span className={record.classHours.given < record.classHours.planned ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                        {record.classHours.given} / {record.classHours.planned}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={record.observation}>{record.observation || '-'}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => handleOpenModal(record)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(record.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                        {editingRecord ? 'Editar Registro' : 'Novo Registro Pedagógico'}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Professor</label>
                        <Input
                            value={formData.teacherName}
                            onChange={e => setFormData({...formData, teacherName: e.target.value})}
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semana (Data de Início)</label>
                        <Input
                            type="date"
                            value={formData.weekStart}
                            onChange={e => setFormData({...formData, weekStart: e.target.value})}
                        />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-3">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Checklist de Entregas</h4>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={formData.checklist.agenda}
                                onChange={e => setFormData({...formData, checklist: {...formData.checklist, agenda: e.target.checked}})}
                            />
                            <span className="text-slate-700 dark:text-slate-300">Agenda Atualizada</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={formData.checklist.exams}
                                onChange={e => setFormData({...formData, checklist: {...formData.checklist, exams: e.target.checked}})}
                            />
                            <span className="text-slate-700 dark:text-slate-300">Provas Entregues</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                checked={formData.checklist.diaries}
                                onChange={e => setFormData({...formData, checklist: {...formData.checklist, diaries: e.target.checked}})}
                            />
                            <span className="text-slate-700 dark:text-slate-300">Diários em Dia</span>
                        </label>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-3">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Gestão de Horas</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Horas Planejadas</label>
                                <Input
                                    type="number"
                                    value={formData.classHours.planned}
                                    onChange={e => setFormData({...formData, classHours: {...formData.classHours, planned: parseInt(e.target.value) || 0}})}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Horas Dadas</label>
                                <Input
                                    type="number"
                                    value={formData.classHours.given}
                                    onChange={e => setFormData({...formData, classHours: {...formData.classHours, given: parseInt(e.target.value) || 0}})}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                        <textarea
                            className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                            placeholder="Observações adicionais..."
                            value={formData.observation}
                            onChange={e => setFormData({...formData, observation: e.target.value})}
                        />
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} className="flex items-center gap-2">
                        <Save size={18} /> Salvar
                    </Button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
