import React, { useState, useMemo } from 'react';
import {
  Users,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Trash2,
  Edit,
  Save,
  X,
  Upload,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

import { AppState, User, CoordinationDelivery, DeliveryType, DeliveryStatus } from '@/types';
import { api } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// --- Constants ---
const DELIVERY_TYPES: Record<DeliveryType, string> = {
    'Exam': 'Entrega de Provas e Roteiros',
    'Plan': 'Entrega de Planos de Aula',
    'Report': 'Acompanhamento de Relatórios',
    'Drive': 'Atualização do Driver'
};

const STATUS_OPTIONS: DeliveryStatus[] = ['No Prazo', 'Antecipado', 'Fora do prazo', 'Em Dias', 'Atrasado'];

interface CoordinationViewProps {
  state: AppState;
  currentUser: User;
}

export function CoordinationView({ state, currentUser }: CoordinationViewProps) {
  // --- ACCORDION STATE ---
  const [openSection, setOpenSection] = useState<'teachers' | 'drives' | null>('drives');
  const [activeDriveTab, setActiveDriveTab] = useState<DeliveryType>('Exam');

  // --- TEACHER MANAGEMENT STATE ---
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');

  const [teacherForm, setTeacherForm] = useState<User>({
      id: '', name: '', email: '', password: '', role: 'Teacher', allowedGrades: [], subjects: []
  });
  const [newSubject, setNewSubject] = useState('');

  // --- DELIVERY MANAGEMENT STATE ---
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<CoordinationDelivery | null>(null);
  const [deliverySearch, setDeliverySearch] = useState('');

  const [deliveryForm, setDeliveryForm] = useState<CoordinationDelivery>({
      id: '',
      teacherId: '',
      teacherName: '',
      type: 'Exam',
      status: 'No Prazo',
      metadata: {}
  });
  const [isUploading, setIsUploading] = useState(false);

  // --- COMPUTED DATA ---
  const teachers = useMemo(() => {
      return (state.users || []).filter(u => u.role === 'Teacher' || u.role === 'Coordinator')
             .filter(u => u.name.toLowerCase().includes(teacherSearch.toLowerCase()));
  }, [state.users, teacherSearch]);

  const deliveries = useMemo(() => {
      return (state.coordinationDeliveries || [])
             .filter(d => d.type === activeDriveTab)
             .filter(d => d.teacherName.toLowerCase().includes(deliverySearch.toLowerCase()) ||
                          (d.metadata.subject && d.metadata.subject.toLowerCase().includes(deliverySearch.toLowerCase())));
  }, [state.coordinationDeliveries, activeDriveTab, deliverySearch]);

  // --- TEACHER ACTIONS ---
  const handleOpenTeacherModal = (user?: User) => {
      if (user) {
          setEditingTeacher(user);
          setTeacherForm({ ...user, subjects: user.subjects || [] });
      } else {
          setEditingTeacher(null);
          setTeacherForm({
              id: Math.random().toString(36).substr(2, 9),
              name: '', email: '', password: '123', role: 'Teacher',
              photoUrl: `https://ui-avatars.com/api/?name=Teacher&background=random`,
              allowedGrades: [], subjects: []
          });
      }
      setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async () => {
      if (!teacherForm.name || !teacherForm.email) {
          alert("Nome e Email são obrigatórios.");
          return;
      }
      await api.saveUser(teacherForm);
      setIsTeacherModalOpen(false);
      // Force reload or state update handled by parent via listener/refresh but here we rely on local mutation if parent re-renders
      // Ideally parent re-fetches. For now we assume optimistic update isn't needed as we don't have setUsers prop.
      // We will trigger a reload via window or assume App handles sync.
      // ACTUALLY: App.tsx doesn't pass setUsers. We need to rely on auto-refresh or manual sync?
      // Wait, api.saveUser returns the user. But we can't update state here.
      // We should probably trigger a refresh.
      window.location.reload();
  };

  const handleDeleteTeacher = async (id: string) => {
      if (confirm("Tem certeza que deseja excluir este professor?")) {
          await api.deleteUser(id);
          window.location.reload();
      }
  };

  const handleAddSubject = () => {
      if (newSubject && !teacherForm.subjects?.includes(newSubject)) {
          setTeacherForm(prev => ({ ...prev, subjects: [...(prev.subjects || []), newSubject] }));
          setNewSubject('');
      }
  };

  const handleRemoveSubject = (sub: string) => {
      setTeacherForm(prev => ({ ...prev, subjects: (prev.subjects || []).filter(s => s !== sub) }));
  };

  // --- DELIVERY ACTIONS ---
  const handleOpenDeliveryModal = (record?: CoordinationDelivery) => {
      if (record) {
          setEditingDelivery(record);
          setDeliveryForm({ ...record });
      } else {
          setEditingDelivery(null);
          setDeliveryForm({
              id: Math.random().toString(36).substr(2, 9),
              teacherId: '',
              teacherName: '',
              type: activeDriveTab,
              status: 'No Prazo',
              metadata: {},
              deadline: '',
              deliveryDate: ''
          });
      }
      setIsDeliveryModalOpen(true);
  };

  const handleSaveDelivery = async () => {
      if (!deliveryForm.teacherId) {
          alert("Selecione um professor.");
          return;
      }

      // Auto-fill teacher name
      const teacher = teachers.find(t => t.id === deliveryForm.teacherId);
      if (teacher) deliveryForm.teacherName = teacher.name;

      await api.saveCoordinationDelivery(deliveryForm);
      setIsDeliveryModalOpen(false);
      window.location.reload();
  };

  const handleDeleteDelivery = async (id: string) => {
      if (confirm("Excluir este registro?")) {
          await api.deleteCoordinationDelivery(id);
          window.location.reload();
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
          const url = await api.uploadDocument(file, deliveryForm.type.toLowerCase(), deliveryForm.id);
          setDeliveryForm(prev => ({ ...prev, fileUrl: url }));
      } catch (error) {
          console.error(error);
          alert("Erro no upload.");
      } finally {
          setIsUploading(false);
      }
  };

  // --- HELPER COMPONENTS ---

  const StatusBadge = ({ status }: { status: DeliveryStatus }) => {
      const colors: Record<string, string> = {
          'No Prazo': 'bg-green-100 text-green-700 border-green-200',
          'Em Dias': 'bg-green-100 text-green-700 border-green-200',
          'Antecipado': 'bg-blue-100 text-blue-700 border-blue-200',
          'Fora do prazo': 'bg-red-100 text-red-700 border-red-200',
          'Atrasado': 'bg-red-100 text-red-700 border-red-200'
      };
      return (
          <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
              {status}
          </span>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* HEADER */}
      <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Coordenação Pedagógica</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão de professores e entregas</p>
      </div>

      {/* SECTION 1: CADASTROS (PROFESSORES) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
            onClick={() => setOpenSection(openSection === 'teachers' ? null : 'teachers')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
            <div className="flex items-center gap-3">
                <Users className="text-indigo-500" size={20} />
                <span className="font-bold text-slate-700 dark:text-slate-200">Cadastros (Professores)</span>
            </div>
            {openSection === 'teachers' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {openSection === 'teachers' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between mb-4">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <Input
                            placeholder="Buscar professor..."
                            className="pl-9 h-9"
                            value={teacherSearch}
                            onChange={e => setTeacherSearch(e.target.value)}
                        />
                    </div>
                    <Button size="sm" onClick={() => handleOpenTeacherModal()} className="flex items-center gap-2">
                        <Plus size={16} /> Novo Professor
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Nome</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Disciplinas</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {teachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td className="px-4 py-3 font-medium">{teacher.name}</td>
                                    <td className="px-4 py-3 text-slate-500">{teacher.email}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(teacher.subjects || []).map(sub => (
                                                <span key={sub} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] border border-indigo-100">
                                                    {sub}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenTeacherModal(teacher)} className="p-1.5 hover:bg-slate-100 rounded text-indigo-600">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteTeacher(teacher.id)} className="p-1.5 hover:bg-slate-100 rounded text-red-500">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* SECTION 2: ATUALIZAÇÃO DOS DRIVES */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
            onClick={() => setOpenSection(openSection === 'drives' ? null : 'drives')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
            <div className="flex items-center gap-3">
                <FileText className="text-orange-500" size={20} />
                <span className="font-bold text-slate-700 dark:text-slate-200">Atualização dos Drives</span>
            </div>
            {openSection === 'drives' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {openSection === 'drives' && (
            <div className="border-t border-slate-200 dark:border-slate-700">
                {/* TABS */}
                <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-700">
                    {(['Exam', 'Plan', 'Report', 'Drive'] as DeliveryType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => setActiveDriveTab(type)}
                            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                                activeDriveTab === type
                                ? 'border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-900/10'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {DELIVERY_TYPES[type]}
                        </button>
                    ))}
                </div>

                <div className="p-4">
                    <div className="flex justify-between mb-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input
                                placeholder="Buscar entrega..."
                                className="pl-9 h-9"
                                value={deliverySearch}
                                onChange={e => setDeliverySearch(e.target.value)}
                            />
                        </div>
                        <Button size="sm" onClick={() => handleOpenDeliveryModal()} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
                            <Plus size={16} /> Nova Entrega
                        </Button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Professor</th>
                                    {activeDriveTab === 'Exam' && <th className="px-4 py-3">Contexto (Série/Turno)</th>}
                                    {activeDriveTab === 'Drive' && <th className="px-4 py-3">Semana</th>}
                                    {activeDriveTab === 'Report' && <th className="px-4 py-3">Período</th>}
                                    <th className="px-4 py-3">Prazos</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Arquivo</th>
                                    <th className="px-4 py-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {deliveries.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-4 py-3 font-medium">
                                            {item.teacherName}
                                            {item.metadata.subject && <div className="text-xs text-slate-400">{item.metadata.subject}</div>}
                                        </td>

                                        {activeDriveTab === 'Exam' && (
                                            <td className="px-4 py-3 text-slate-500">
                                                {item.metadata.grade} - {item.metadata.shift}
                                            </td>
                                        )}
                                        {activeDriveTab === 'Drive' && (
                                            <td className="px-4 py-3 text-slate-500">
                                                {item.metadata.week ? new Date(item.metadata.week).toLocaleDateString() : '-'}
                                            </td>
                                        )}
                                        {activeDriveTab === 'Report' && (
                                            <td className="px-4 py-3 text-slate-500">
                                                {item.metadata.period || '-'}
                                            </td>
                                        )}

                                        <td className="px-4 py-3">
                                            <div className="flex flex-col text-xs">
                                                {item.deadline && <span className="text-slate-500">Prazo: {new Date(item.deadline).toLocaleDateString()}</span>}
                                                {item.deliveryDate && <span className="text-green-600">Entregue: {new Date(item.deliveryDate).toLocaleDateString()}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.fileUrl ? (
                                                <a href={item.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:underline">
                                                    <FileText size={14} /> Ver Doc
                                                </a>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenDeliveryModal(item)} className="p-1.5 hover:bg-slate-100 rounded text-indigo-600">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteDelivery(item.id)} className="p-1.5 hover:bg-slate-100 rounded text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {deliveries.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                            Nenhum registro encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* TEACHER MODAL */}
      {isTeacherModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                  <h3 className="text-lg font-bold mb-4">{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500">Nome</label>
                          <Input value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500">Email</label>
                          <Input value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} />
                      </div>
                      {!editingTeacher && (
                          <div>
                              <label className="text-xs font-bold text-slate-500">Senha Padrão</label>
                              <Input value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} />
                          </div>
                      )}

                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                          <label className="text-xs font-bold text-slate-500 mb-2 block">Disciplinas</label>
                          <div className="flex gap-2 mb-2">
                              <Input
                                  placeholder="Ex: Matemática"
                                  value={newSubject}
                                  onChange={e => setNewSubject(e.target.value)}
                                  className="h-8 text-xs"
                              />
                              <Button size="sm" onClick={handleAddSubject} disabled={!newSubject}><Plus size={14} /></Button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {(teacherForm.subjects || []).map(sub => (
                                  <span key={sub} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs flex items-center gap-1">
                                      {sub}
                                      <button onClick={() => handleRemoveSubject(sub)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
                                  </span>
                              ))}
                          </div>
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsTeacherModalOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSaveTeacher}>Salvar</Button>
                  </div>
              </div>
          </div>
      )}

      {/* DELIVERY MODAL */}
      {isDeliveryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">
                      {editingDelivery ? 'Editar Entrega' : `Nova ${DELIVERY_TYPES[activeDriveTab]}`}
                  </h3>
                  <div className="space-y-4">
                      {/* Teacher Select */}
                      <div>
                          <label className="text-xs font-bold text-slate-500">Professor</label>
                          <select
                              className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent"
                              value={deliveryForm.teacherId}
                              onChange={e => setDeliveryForm({...deliveryForm, teacherId: e.target.value})}
                          >
                              <option value="">Selecione...</option>
                              {teachers.map(t => (
                                  <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                          </select>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500">Prazo (Previsto)</label>
                              <Input type="date" value={deliveryForm.deadline || ''} onChange={e => setDeliveryForm({...deliveryForm, deadline: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500">Data da Entrega</label>
                              <Input type="date" value={deliveryForm.deliveryDate || ''} onChange={e => setDeliveryForm({...deliveryForm, deliveryDate: e.target.value})} />
                          </div>
                      </div>

                      {/* Status */}
                      <div>
                          <label className="text-xs font-bold text-slate-500">Status</label>
                          <select
                              className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent"
                              value={deliveryForm.status}
                              onChange={e => setDeliveryForm({...deliveryForm, status: e.target.value as DeliveryStatus})}
                          >
                              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>

                      {/* Context Fields based on Type */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase">Contexto</h4>

                          {(activeDriveTab === 'Exam' || activeDriveTab === 'Report' || activeDriveTab === 'Drive') && (
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-xs text-slate-400">Série</label>
                                      <Input
                                        value={deliveryForm.metadata.grade || ''}
                                        onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, grade: e.target.value}})}
                                        placeholder="Ex: 9º Ano"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-xs text-slate-400">Turno</label>
                                      <select
                                        className="w-full p-2 h-10 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        value={deliveryForm.metadata.shift || ''}
                                        onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, shift: e.target.value}})}
                                      >
                                          <option value="">Selecione...</option>
                                          <option value="Manhã">Manhã</option>
                                          <option value="Tarde">Tarde</option>
                                      </select>
                                  </div>
                              </div>
                          )}

                          {(activeDriveTab === 'Exam') && (
                              <div>
                                  <label className="text-xs text-slate-400">Disciplina</label>
                                  <Input
                                    value={deliveryForm.metadata.subject || ''}
                                    onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, subject: e.target.value}})}
                                  />
                              </div>
                          )}

                          {activeDriveTab === 'Report' && (
                              <div>
                                  <label className="text-xs text-slate-400">Período (Bimestre)</label>
                                  <select
                                      className="w-full p-2 h-10 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                      value={deliveryForm.metadata.period || ''}
                                      onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, period: e.target.value}})}
                                  >
                                      <option value="">Selecione...</option>
                                      <option value="1º Bimestre">1º Bimestre</option>
                                      <option value="2º Bimestre">2º Bimestre</option>
                                      <option value="3º Bimestre">3º Bimestre</option>
                                      <option value="4º Bimestre">4º Bimestre</option>
                                  </select>
                              </div>
                          )}

                          {activeDriveTab === 'Drive' && (
                              <div>
                                  <label className="text-xs text-slate-400">Semana</label>
                                  <Input
                                    type="date"
                                    value={deliveryForm.metadata.week || ''}
                                    onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, week: e.target.value}})}
                                  />
                              </div>
                          )}
                      </div>

                      {/* File Upload */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Relatório / Arquivo (PDF/Excel)</label>
                          <div className="flex items-center gap-2">
                              <input
                                  type="file"
                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                                  onChange={handleFileUpload}
                                  className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                              />
                              {isUploading && <Clock size={16} className="animate-spin text-indigo-500" />}
                          </div>
                          {deliveryForm.fileUrl && (
                              <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Arquivo anexado
                              </div>
                          )}
                      </div>

                      {/* Observation */}
                      <div>
                          <label className="text-xs font-bold text-slate-500">Observação</label>
                          <textarea
                              className="w-full p-2 rounded border border-slate-300 dark:border-slate-600 bg-transparent h-20 text-sm resize-none"
                              value={deliveryForm.observation || ''}
                              onChange={e => setDeliveryForm({...deliveryForm, observation: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsDeliveryModalOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSaveDelivery}>Salvar</Button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}
