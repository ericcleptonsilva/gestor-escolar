import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Trash2,
  Edit,
  Save,
  X,
  FileSpreadsheet,
  LayoutList,
  CalendarDays,
  FolderOpen
} from 'lucide-react';
import { AppState, PedagogicalRecord, DeliveryRecord, AcademicPeriod, Shift } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface PedagogicalViewProps {
  state: AppState;
  onSaveRecord: (record: PedagogicalRecord) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}

const TAB_General = 'Geral';
const TAB_Coordination = 'Coordenação';

export function PedagogicalView({ state, onSaveRecord, onDeleteRecord }: PedagogicalViewProps) {
  const [activeTab, setActiveTab] = useState(TAB_General);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWeek, setFilterWeek] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PedagogicalRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<PedagogicalRecord>({
      id: '',
      teacherName: '',
      weekStart: '',
      checklist: { 'Agenda Atualizada': false, 'Provas Entregues': false, 'Diários em Dia': false },
      classHours: { planned: 0, given: 0 },
      missedClasses: [],
      coordination: [],
      observation: ''
  });

  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newMissedClass, setNewMissedClass] = useState<{date: string, time: string, hours: number, reason: string}>({ date: '', time: '', hours: 1, reason: '' });

  // Coordination Form State
  const [newDelivery, setNewDelivery] = useState<DeliveryRecord>({
      id: '',
      type: 'Prova',
      deadline: '',
      deliveredDate: '',
      status: 'Pendente',
      academicPeriod: '1ª Bi',
      week: '',
      class: '',
      shift: 'Manhã'
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
      // Ensure checklist has defaults if old record
      const checklist = record.checklist || {};
      if (Object.keys(checklist).length === 0) {
          checklist['Agenda Atualizada'] = false;
          checklist['Provas Entregues'] = false;
          checklist['Diários em Dia'] = false;
      }
      setFormData({
          ...record,
          checklist,
          missedClasses: record.missedClasses || [],
          coordination: record.coordination || []
      });
    } else {
      setEditingRecord(null);
      setFormData({
        id: Math.random().toString(36).substr(2, 9),
        teacherName: '',
        weekStart: new Date().toISOString().split('T')[0],
        checklist: { 'Agenda Atualizada': false, 'Provas Entregues': false, 'Diários em Dia': false },
        classHours: { planned: 0, given: 0 },
        missedClasses: [],
        coordination: [],
        observation: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleAddDelivery = () => {
      // Auto-calc status based on dates if both present
      let calculatedStatus = newDelivery.status;
      if (newDelivery.deadline && newDelivery.deliveredDate) {
          if (newDelivery.deliveredDate <= newDelivery.deadline) {
              // Check if significantly early (e.g. 2 days)
              const diff = new Date(newDelivery.deadline).getTime() - new Date(newDelivery.deliveredDate).getTime();
              const daysDiff = diff / (1000 * 3600 * 24);
              calculatedStatus = daysDiff >= 2 ? 'Antecipado' : 'No Prazo';
          } else {
              calculatedStatus = 'Fora do Prazo';
          }
      }

      const item: DeliveryRecord = {
          ...newDelivery,
          id: Math.random().toString(36).substr(2, 9),
          status: calculatedStatus
      };

      setFormData(prev => ({
          ...prev,
          coordination: [...(prev.coordination || []), item]
      }));

      // Reset mostly, keep some context like type
      setNewDelivery(prev => ({
          ...prev,
          id: '',
          deadline: '',
          deliveredDate: '',
          status: 'Pendente'
      }));
  };

  const handleRemoveDelivery = (id: string) => {
      setFormData(prev => ({
          ...prev,
          coordination: (prev.coordination || []).filter(c => c.id !== id)
      }));
  };

  const handleSave = async () => {
    if (!formData.teacherName || !formData.weekStart) {
        alert("Preencha o nome do professor e a semana.");
        return;
    }
    await onSaveRecord(formData);
    setIsModalOpen(false);
  };

  const handleAddChecklistItem = () => {
      if (newChecklistItem.trim()) {
          setFormData(prev => ({
              ...prev,
              checklist: { ...prev.checklist, [newChecklistItem]: false }
          }));
          setNewChecklistItem('');
      }
  };

  const handleRemoveChecklistItem = (key: string) => {
      const newChecklist = { ...formData.checklist };
      delete newChecklist[key];
      setFormData(prev => ({ ...prev, checklist: newChecklist }));
  };

  const handleAddMissedClass = () => {
      if (newMissedClass.date && newMissedClass.time) {
          const hoursMissed = newMissedClass.hours || 0;

          setFormData(prev => ({
              ...prev,
              classHours: {
                  ...prev.classHours,
                  given: Math.max(0, prev.classHours.given - hoursMissed)
              },
              missedClasses: [...(prev.missedClasses || []), newMissedClass]
          }));

          setNewMissedClass({ date: '', time: '', hours: 1, reason: '' });
      } else {
          alert("Informe data e hora da falta.");
      }
  };

  const handleRemoveMissedClass = (index: number) => {
      setFormData(prev => ({
          ...prev,
          missedClasses: (prev.missedClasses || []).filter((_, i) => i !== index)
      }));
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

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
          {[TAB_General, TAB_Coordination].map(tab => (
              <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                  {tab}
              </button>
          ))}
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

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                    <tr>
                        <th className="px-6 py-4">Professor</th>
                        <th className="px-6 py-4">Semana</th>

                        {activeTab === TAB_General && (
                            <>
                                <th className="px-6 py-4 text-center">Checklist</th>
                                <th className="px-6 py-4 text-center">Horas (Plan/Dada)</th>
                            </>
                        )}

                        {activeTab === TAB_Coordination && (
                            <th className="px-6 py-4">Entregas & Drives</th>
                        )}

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

                                {activeTab === TAB_General && (
                                    <>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                <div className="flex items-center gap-1 text-xs" title="Agenda Atualizada">
                                                    <span className="text-slate-500">Agenda:</span>
                                                    <StatusIcon checked={!!record.checklist['Agenda Atualizada'] || !!record.checklist['agenda']} />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs" title="Provas Entregues">
                                                    <span className="text-slate-500">Provas:</span>
                                                    <StatusIcon checked={!!record.checklist['Provas Entregues'] || !!record.checklist['exams']} />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs" title="Diários em Dia">
                                                    <span className="text-slate-500">Diários:</span>
                                                    <StatusIcon checked={!!record.checklist['Diários em Dia'] || !!record.checklist['diaries']} />
                                                </div>
                                                {Object.entries(record.checklist)
                                                    .filter(([k]) => !['Agenda Atualizada', 'Provas Entregues', 'Diários em Dia', 'agenda', 'exams', 'diaries'].includes(k))
                                                    .map(([k, v]) => (
                                                        <div key={k} className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-800">
                                                            <span className="text-indigo-600 dark:text-indigo-300 font-medium">{k}</span>
                                                            {v ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-300" />}
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className={record.classHours.given < record.classHours.planned ? "text-red-500 font-bold" : "text-green-600 font-bold"}>
                                                    {record.classHours.planned} / {record.classHours.given}
                                                </span>
                                                {(record.missedClasses?.length || 0) > 0 && (
                                                    <div className="flex flex-col items-center gap-1 mt-1">
                                                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">
                                                            {record.missedClasses?.length} falta(s)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </>
                                )}

                                {activeTab === TAB_Coordination && (
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {(record.coordination || []).map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs border border-slate-200 dark:border-slate-700 p-1.5 rounded bg-slate-50 dark:bg-slate-900/30">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                        item.type === 'Prova' ? 'bg-purple-100 text-purple-700' :
                                                        item.type === 'Plano' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                        {item.type}
                                                    </span>
                                                    <span className={`font-medium ${
                                                        item.status === 'Fora do Prazo' || item.status === 'Atrasado' ? 'text-red-500' :
                                                        item.status === 'Antecipado' ? 'text-green-600' : 'text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                    {item.deliveredDate && (
                                                        <span className="text-slate-400 text-[10px]">
                                                            (Ent: {new Date(item.deliveredDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                            {(!record.coordination || record.coordination.length === 0) && (
                                                <span className="text-slate-400 text-xs italic">Sem registros de coordenação</span>
                                            )}
                                        </div>
                                    </td>
                                )}

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

                    {/* Coordination Section in Modal */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl space-y-3 border border-indigo-100 dark:border-indigo-900/50">
                        <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <FolderOpen size={16} />
                            Coordenação (Entregas & Drives)
                        </h4>

                        <div className="grid grid-cols-12 gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="col-span-4">
                                <label className="text-[10px] text-slate-500 font-bold block mb-1">Tipo</label>
                                <select
                                    className="w-full text-xs h-8 rounded border-slate-300 bg-slate-50 p-1"
                                    value={newDelivery.type}
                                    onChange={e => setNewDelivery({...newDelivery, type: e.target.value as any})}
                                >
                                    <option value="Prova">Prova</option>
                                    <option value="Plano">Plano</option>
                                    <option value="Drive">Drive</option>
                                </select>
                            </div>

                            {newDelivery.type !== 'Drive' ? (
                                <>
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Prazo</label>
                                        <Input type="date" className="h-8 text-xs w-full" value={newDelivery.deadline} onChange={e => setNewDelivery({...newDelivery, deadline: e.target.value})} />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Entregue Em</label>
                                        <Input type="date" className="h-8 text-xs w-full" value={newDelivery.deliveredDate} onChange={e => setNewDelivery({...newDelivery, deliveredDate: e.target.value})} />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Semana/Ref</label>
                                        <Input className="h-8 text-xs w-full" placeholder="Ex: Sem 4" value={newDelivery.week} onChange={e => setNewDelivery({...newDelivery, week: e.target.value})} />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Status</label>
                                        <select
                                            className="w-full text-xs h-8 rounded border-slate-300 bg-slate-50 p-1"
                                            value={newDelivery.status}
                                            onChange={e => setNewDelivery({...newDelivery, status: e.target.value as any})}
                                        >
                                            <option value="Pendente">Pendente</option>
                                            <option value="No Prazo">Ok / No Prazo</option>
                                            <option value="Atrasado">Atrasado</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="col-span-12 flex justify-end">
                                <Button size="sm" onClick={handleAddDelivery} className="w-full mt-2">
                                    <Plus size={14} className="mr-1" /> Adicionar Entrega
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {(formData.coordination || []).map((item) => (
                                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.type}</span>
                                        <span className="text-[10px] text-slate-500">
                                            {item.type === 'Drive' ? item.week : `Prazo: ${item.deadline ? new Date(item.deadline).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '?'}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            item.status === 'No Prazo' || item.status === 'Antecipado' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                        <button onClick={() => handleRemoveDelivery(item.id)} className="text-red-400 hover:text-red-600">
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-3">
                        <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Checklist de Entregas (Geral)</h4>

                        {Object.entries(formData.checklist).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between group">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={value}
                                        onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})}
                                    />
                                    <span className="text-slate-700 dark:text-slate-300">{key}</span>
                                </label>
                                <button onClick={() => handleRemoveChecklistItem(key)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Input
                                placeholder="Novo item..."
                                value={newChecklistItem}
                                onChange={e => setNewChecklistItem(e.target.value)}
                                className="h-8 text-sm"
                            />
                            <Button size="sm" onClick={handleAddChecklistItem} disabled={!newChecklistItem.trim()}>
                                <Plus size={16} />
                            </Button>
                        </div>
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

                        <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-3">
                            <label className="text-xs text-slate-500 mb-2 block font-bold">Faltas por Horário</label>

                            <div className="space-y-2 mb-3">
                                {(formData.missedClasses || []).map((missed, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(missed.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                            <span className="text-slate-500">às {missed.time}</span>
                                            {missed.hours && (
                                                <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] border border-red-100 font-medium">
                                                    -{missed.hours}h
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-400 italic truncate max-w-[100px]">{missed.reason}</span>
                                            <button onClick={() => handleRemoveMissedClass(idx)} className="text-red-400 hover:text-red-600">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-4">
                                    <Input type="date" className="h-8 text-xs w-full" value={newMissedClass.date} onChange={e => setNewMissedClass({...newMissedClass, date: e.target.value})} />
                                </div>
                                <div className="col-span-3">
                                    <Input type="time" className="h-8 text-xs w-full" value={newMissedClass.time} onChange={e => setNewMissedClass({...newMissedClass, time: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <Input
                                        type="number"
                                        placeholder="Hrs"
                                        className="h-8 text-xs w-full"
                                        value={newMissedClass.hours}
                                        onChange={e => setNewMissedClass({...newMissedClass, hours: parseInt(e.target.value) || 0})}
                                        min={1}
                                    />
                                </div>
                                <div className="col-span-3 flex gap-2">
                                    <Input placeholder="Motivo" className="h-8 text-xs w-full" value={newMissedClass.reason} onChange={e => setNewMissedClass({...newMissedClass, reason: e.target.value})} />
                                    <Button size="sm" onClick={handleAddMissedClass} className="h-8 w-8 p-0 flex items-center justify-center shrink-0">
                                        <Plus size={14} />
                                    </Button>
                                </div>
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
