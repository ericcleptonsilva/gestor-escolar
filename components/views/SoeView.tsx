import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Plus, Filter, MessageCircle, Edit2, Trash2, Calendar, User as UserIcon, Check, ChevronDown, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { PrintButton } from '../features/PrintButton';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Select } from '../ui/Select';
import { SearchableSelect } from '../ui/SearchableSelect';
import { MultiSelect } from '../ui/MultiSelect';
import { AppState, SoeRecord, Student } from '../../types';
import { api } from '../../services/api';

interface SoeViewProps {
    state: AppState;
    setState: React.Dispatch<React.SetStateAction<AppState>>;
    onPrint: () => void;
}

export const SoeView = ({ state, setState, onPrint }: SoeViewProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState<string[]>([]);
    const [filterShift, setFilterShift] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState<SoeRecord | null>(null);
    const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedRecords(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const [formData, setFormData] = useState({
        studentId: '',
        date: new Date().toISOString().split('T')[0],
        returnDate: '',
        reason: '',
        status: 'Pendente' as SoeRecord['status'],
        observation: ''
    });



    const visibleGradesList = useMemo(() => {
        const grades = new Set(state.students.map(s => s.grade));
        return Array.from(grades).sort();
    }, [state.students]);



    const filteredRecords = useMemo(() => {
        return (state.soeRecords || []).filter(record => {
            const student = state.students.find(s => s.id === record.studentId);
            if (!student) return false;

            if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase()) && !student.registration.includes(searchTerm)) {
                return false;
            }

            if (filterGrade.length > 0 && !filterGrade.includes(student.grade)) return false;
            if (filterShift.length > 0 && !filterShift.includes(student.shift)) return false;
            if (filterStatus.length > 0 && !filterStatus.includes(record.status)) return false;

            return true;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [state.soeRecords, state.students, searchTerm, filterGrade, filterShift, filterStatus]);

    const handleOpenModal = (record?: SoeRecord) => {
        if (record) {
            setEditingRecord(record);
            setFormData({
                studentId: record.studentId,
                date: record.date,
                returnDate: record.returnDate || '',
                reason: record.reason,
                status: record.status,
                observation: record.observation || ''
            });
        } else {
            setEditingRecord(null);
            setFormData({
                studentId: '',
                date: new Date().toISOString().split('T')[0],
                returnDate: '',
                reason: '',
                status: 'Pendente',
                observation: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.studentId || !formData.date || !formData.reason) {
            alert('Preencha os campos obrigatórios (Aluno, Data, Motivo).');
            return;
        }

        setIsSaving(true);
        try {
            const recordToSave: SoeRecord = {
                id: editingRecord ? editingRecord.id : Date.now().toString(),
                ...formData
            };

            // Saves via API
            try {
                await api.saveSoeRecord(recordToSave);
            } catch (e) {
                console.warn("API S.O.E failed, persisting locally if offline");
            }

            setState(prev => {
                const existing = prev.soeRecords || [];
                const isUpdate = existing.some(r => r.id === recordToSave.id);
                return {
                    ...prev,
                    soeRecords: isUpdate 
                        ? existing.map(r => r.id === recordToSave.id ? recordToSave : r) 
                        : [...existing, recordToSave]
                };
            });

            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving SOE record:', error);
            alert('Erro ao salvar registro do S.O.E.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir este encaminhamento?')) return;

        try {
            try {
                await api.deleteSoeRecord(id);
            } catch (e) {
                console.warn("API S.O.E delete failed, persisting locally if offline");
            }

            setState(prev => ({
                ...prev,
                soeRecords: (prev.soeRecords || []).filter(r => r.id !== id)
            }));
        } catch (error) {
            console.error('Error deleting SOE record:', error);
            alert('Erro ao excluir registro.');
        }
    };

    const getStatusBadgeColor = (status: SoeRecord['status']) => {
        switch (status) {
            case 'Pendente': return 'red';
            case 'Em Andamento': return 'yellow';
            case 'Concluído': return 'green';
            default: return 'slate';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                        <MessageCircle className="mr-3 text-indigo-600 dark:text-indigo-400" size={28} />
                        S.O.E. (Serviço de Orientação Educacional)
                    </h2>
                    <div className="flex gap-2">
                        <PrintButton onClick={onPrint} />
                        <Button onClick={() => handleOpenModal()}>
                            <Plus size={20} className="mr-2" /> Novo Atendimento
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 no-print relative z-20 overflow-visible">
                    <div className="md:col-span-3 relative flex items-center">
                        <Search className="absolute left-3 text-slate-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="Buscar por aluno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="md:col-span-3">
                        <MultiSelect
                            options={visibleGradesList.map(g => ({ label: g, value: g }))}
                            selectedValues={filterGrade}
                            onChange={setFilterGrade}
                            placeholder="Todas as Turmas"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <MultiSelect
                            options={[
                                { label: 'Manhã', value: 'Manhã' },
                                { label: 'Tarde', value: 'Tarde' },
                                { label: 'Noite', value: 'Noite' }
                            ]}
                            selectedValues={filterShift}
                            onChange={setFilterShift}
                            placeholder="Todos os Turnos"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <MultiSelect
                            options={[
                                { label: 'Pendente', value: 'Pendente' },
                                { label: 'Em Andamento', value: 'Em Andamento' },
                                { label: 'Concluído', value: 'Concluído' }
                            ]}
                            selectedValues={filterStatus}
                            onChange={setFilterStatus}
                            placeholder="Todos os Status"
                        />
                    </div>
                </div>
            </div>

            {/* List of Records */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredRecords.map(record => {
                    const student = state.students.find(s => s.id === record.studentId);
                    if (!student) return null;

                    return (
                        <Card key={record.id} className="p-5 flex flex-col hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                     <img
                                        src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                        alt={student.name}
                                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-sm flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate" title={student.name}>{student.name}</h3>
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate gap-2 flex items-center">
                                            <span>{student.grade} - {student.shift}</span>
                                            <span>•</span>
                                            <span>Matrícula: {student.registration}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 mb-4 flex-1">
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                                    <MessageCircle size={14} className="mr-1.5 opacity-70" />
                                    Motivo do Encaminhamento
                                </div>
                                <p className={`text-sm text-slate-600 dark:text-slate-400 break-words ${expandedRecords.has(record.id) ? '' : 'line-clamp-2'}`} title={record.reason}>
                                    {record.reason}
                                </p>
                                {record.observation && (
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Observações</div>
                                         <p className={`text-xs text-slate-500 dark:text-slate-500 italic ${expandedRecords.has(record.id) ? '' : 'line-clamp-2'}`} title={record.observation}>{record.observation}</p>
                                    </div>
                                )}
                                {(record.reason.length > 80 || (record.observation && record.observation.length > 80)) && (
                                    <button 
                                        onClick={() => toggleExpand(record.id)}
                                        className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 hover:underline font-medium focus:outline-none"
                                    >
                                        {expandedRecords.has(record.id) ? 'Ver menos' : 'Ver mais'}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-auto">
                                <Badge color={getStatusBadgeColor(record.status)}>{record.status}</Badge>
                                
                                <div className="flex flex-col gap-1 items-start mr-2">
                                    <span className="text-xs text-slate-400 flex items-center">
                                        <Calendar size={12} className="mr-1" />
                                        {new Date(record.date).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}
                                    </span>
                                    {record.returnDate && (
                                        <span className="text-xs text-indigo-500 font-medium flex items-center" title="Data de Retorno">
                                            <Calendar size={12} className="mr-1" />
                                            {new Date(record.returnDate).toLocaleDateString('pt-BR', { timeZone: 'UTC'})}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleOpenModal(record)}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                        title="Editar S.O.E."
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                     <button 
                                        onClick={() => handleDelete(record.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    );
                })}

                {filteredRecords.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <MessageCircle size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Nenhum registro no S.O.E. encontrado.</p>
                    </div>
                )}
            </div>

            {/* Modal de Criação / Edição */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center">
                                {editingRecord ? <Edit2 className="mr-2 text-indigo-500" size={20} /> : <Plus className="mr-2 text-indigo-500" size={20} />}
                                {editingRecord ? 'Editar S.O.E.' : 'Novo Encaminhamento S.O.E.'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Aluno Responsável *</label>
                                <SearchableSelect
                                    value={formData.studentId}
                                    onChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}
                                    options={state.students.slice().sort((a, b) => a.name.localeCompare(b.name)).map(s => ({
                                        value: s.id,
                                        label: `${s.name} (${s.grade} - ${s.shift})`
                                    }))}
                                    placeholder="Selecione um aluno..."
                                    className="w-full"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Data da Ocorrência *</label>
                                    <Input 
                                        type="date" 
                                        value={formData.date} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Data de Retorno</label>
                                    <Input 
                                        type="date" 
                                        value={formData.returnDate} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Status</label>
                                    <Select 
                                        value={formData.status} 
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as SoeRecord['status'] }))}
                                        className="w-full h-full min-h-[42px]"
                                    >
                                        <option value="Pendente">Pendente</option>
                                        <option value="Em Andamento">Em Andamento</option>
                                        <option value="Concluído">Concluído</option>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Motivo do Chamado *</label>
                                <textarea
                                    className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Descreva o motivo pelo qual o aluno foi chamado..."
                                    value={formData.reason}
                                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Resolução / Observação Final <span className="font-normal text-slate-400">(Opcional)</span></label>
                                <textarea
                                    className="w-full h-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                                    placeholder="Notas sobre a conversa, acordos feitos, etc."
                                    value={formData.observation}
                                    onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Salvando...' : 'Salvar Registro'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
