import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  User as UserIcon,
  Settings,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { AppState, User, CoordinationRecord, CoordinationType } from '@/types';
import { api } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GRADES_LIST } from '@/constants';

interface CoordinationViewProps {
  state: AppState;
  currentUser: User;
  onRefresh: () => void;
}

export function CoordinationView({ state, currentUser, onRefresh }: CoordinationViewProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'teachers' | 'drives'>('drives');

  // --- STATE: Config ---
  const [newGrade, setNewGrade] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // --- STATE: Teachers ---
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<User>>({
      name: '', email: '', password: '', role: 'Teacher', registration: '', photoUrl: ''
  });

  // --- STATE: Drives ---
  const [expandedSection, setExpandedSection] = useState<CoordinationType | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CoordinationRecord | null>(null);
  const [recordForm, setRecordForm] = useState<Partial<CoordinationRecord>>({
      status: 'No Prazo'
  });

  // --- HANDLERS: Config ---
  const handleAddGrade = async () => {
      if (!newGrade) return;
      const currentGrades = state.grades.length > 0 ? state.grades : [];
      if (currentGrades.includes(newGrade)) return;

      const updated = [...currentGrades, newGrade];
      await api.updateGrades(updated);
      setNewGrade('');
      onRefresh();
  };

  const handleDeleteGrade = async (grade: string) => {
      if (!confirm(`Remover a série "${grade}"?`)) return;
      const currentGrades = state.grades.length > 0 ? state.grades : []; // Should filter from state
      // If state.grades is empty, we can't really delete from GRADES_LIST constant in UI conceptually without saving first.
      // But if state.grades is empty, we are using defaults.
      // So first delete creates the list minus the item.

      let sourceList = state.grades.length > 0 ? state.grades : GRADES_LIST;
      const updated = sourceList.filter(g => g !== grade);
      await api.updateGrades(updated);
      onRefresh();
  };

  const handleImportDefaultGrades = async () => {
      await api.updateGrades(GRADES_LIST);
      onRefresh();
  };

  const handleAddSubject = async () => {
      if (!newSubject) return;
      if (state.subjects.includes(newSubject)) return;
      await api.updateSubjects([...state.subjects, newSubject]);
      setNewSubject('');
      onRefresh();
  };

  const handleDeleteSubject = async (subject: string) => {
      if (!confirm(`Remover a disciplina "${subject}"?`)) return;
      await api.updateSubjects(state.subjects.filter(s => s !== subject));
      onRefresh();
  };

  // --- HANDLERS: Teachers ---
  const handleOpenTeacherModal = (teacher?: User) => {
      if (teacher) {
          setEditingTeacher(teacher);
          setTeacherForm({ ...teacher, password: '' }); // Don't show hash
      } else {
          setEditingTeacher(null);
          setTeacherForm({
              id: '', name: '', email: '', password: '', role: 'Teacher', registration: '', photoUrl: '',
              allowedGrades: []
          });
      }
      setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = async () => {
      if (!teacherForm.name || !teacherForm.email) {
          alert("Nome e Email são obrigatórios.");
          return;
      }

      const userToSave: User = {
          id: editingTeacher?.id || Math.random().toString(36).substr(2, 9),
          name: teacherForm.name,
          email: teacherForm.email,
          role: 'Teacher',
          photoUrl: teacherForm.photoUrl || `https://ui-avatars.com/api/?name=${teacherForm.name}&background=random`,
          registration: teacherForm.registration || '',
          allowedGrades: teacherForm.allowedGrades || []
      };

      if (teacherForm.password) {
          userToSave.password = teacherForm.password;
      } else if (!editingTeacher) {
          alert("Senha é obrigatória para novos usuários.");
          return;
      } else {
          userToSave.password = editingTeacher.password;
      }

      await api.saveUser(userToSave);
      setIsTeacherModalOpen(false);
      onRefresh();
  };

  const handleDeleteTeacher = async (id: string) => {
      if (confirm("Excluir este professor?")) {
          await api.deleteUser(id);
          onRefresh();
      }
  };

  const handleTeacherPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
             const id = editingTeacher?.id || 'temp';
             const url = await api.uploadPhoto(file, 'user', id);
             setTeacherForm(prev => ({ ...prev, photoUrl: url }));
          } catch(err) {
              alert("Erro no upload");
          }
      }
  };

  // --- HANDLERS: Drives ---
  const handleOpenRecordModal = (type: CoordinationType, record?: CoordinationRecord) => {
      if (record) {
          setEditingRecord(record);
          setRecordForm({ ...record });
      } else {
          setEditingRecord(null);
          setRecordForm({
              type,
              status: 'No Prazo',
              teacherId: '',
              teacherName: '',
              observation: '',
              // Defaults based on type
              deadline: '',
              deliveryDate: '',
              grade: '',
              shift: 'Manhã',
              period: '',
              weekDate: '',
              isCompleted: false
          });
      }
      setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async () => {
      if (!recordForm.teacherId) {
          alert("Selecione um professor.");
          return;
      }

      // Find teacher name if not set
      const teacher = state.users.find(u => u.id === recordForm.teacherId);
      const recordToSave: CoordinationRecord = {
          id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
          type: recordForm.type!,
          teacherId: recordForm.teacherId,
          teacherName: teacher?.name || recordForm.teacherName || '?',
          status: recordForm.status || 'No Prazo',
          grade: recordForm.grade,
          shift: recordForm.shift,
          subject: recordForm.subject,
          deadline: recordForm.deadline,
          deliveryDate: recordForm.deliveryDate,
          fileUrl: recordForm.fileUrl,
          observation: recordForm.observation,
          period: recordForm.period,
          weekDate: recordForm.weekDate,
          isCompleted: recordForm.isCompleted
      };

      await api.saveCoordinationRecord(recordToSave);
      setIsRecordModalOpen(false);
      onRefresh();
  };

  const handleDeleteRecord = async (id: string) => {
      if (confirm("Excluir registro?")) {
          await api.deleteCoordinationRecord(id);
          onRefresh();
      }
  };

  // --- RENDER HELPERS ---
  const teachers = state.users.filter(u => u.role === 'Teacher');
  const activeGrades = state.grades.length > 0 ? state.grades : GRADES_LIST;

  const renderRecordTable = (type: CoordinationType) => {
      const records = (state.coordinationRecords || []).filter(r => r.type === type);

      return (
          <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                      <tr>
                          <th className="px-4 py-3">Professor</th>
                          {type === 'DRIVE_UPDATE' ? (
                              <>
                                <th className="px-4 py-3">Série/Turno</th>
                                <th className="px-4 py-3">Semana</th>
                                <th className="px-4 py-3">Concluído</th>
                              </>
                          ) : (
                              <>
                                <th className="px-4 py-3">Prazo</th>
                                <th className="px-4 py-3">Entrega</th>
                                {type === 'REPORT_MONITORING' && <th className="px-4 py-3">Bimestre</th>}
                              </>
                          )}
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Arquivo</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {records.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Nenhum registro.</td></tr>
                      ) : (
                          records.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-3">{r.teacherName}</td>
                                  {type === 'DRIVE_UPDATE' ? (
                                      <>
                                          <td className="px-4 py-3">{r.grade} - {r.shift}</td>
                                          <td className="px-4 py-3">{r.weekDate ? new Date(r.weekDate).toLocaleDateString() : '-'}</td>
                                          <td className="px-4 py-3">
                                              {r.isCompleted ? <CheckCircle2 size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-300"/>}
                                          </td>
                                      </>
                                  ) : (
                                      <>
                                          <td className="px-4 py-3">{r.deadline ? new Date(r.deadline).toLocaleDateString() : '-'}</td>
                                          <td className="px-4 py-3">{r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString() : '-'}</td>
                                          {type === 'REPORT_MONITORING' && <td className="px-4 py-3">{r.period}</td>}
                                      </>
                                  )}
                                  <td className="px-4 py-3">
                                      <span className={`px-2 py-0.5 rounded text-xs border ${
                                          r.status === 'No Prazo' || r.status === 'Em Dias' || r.status === 'Antecipado'
                                          ? 'bg-green-50 text-green-700 border-green-100'
                                          : 'bg-red-50 text-red-700 border-red-100'
                                      }`}>
                                          {r.status}
                                      </span>
                                  </td>
                                  <td className="px-4 py-3">
                                      {r.fileUrl ? (
                                          <a href={r.fileUrl} target="_blank" className="text-indigo-500 hover:underline flex items-center gap-1">
                                              <FileText size={14}/> Ver
                                          </a>
                                      ) : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-2">
                                          <button onClick={() => handleOpenRecordModal(type, r)} className="p-1 text-slate-400 hover:text-indigo-500"><Edit size={16}/></button>
                                          <button onClick={() => handleDeleteRecord(r.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Coordenação</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão de professores, séries e entregas.</p>
        </div>

        <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
             <button
                onClick={() => setActiveTab('drives')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'drives' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
             >
                 Entregas & Drives
             </button>
             <button
                onClick={() => setActiveTab('teachers')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'teachers' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
             >
                 Professores
             </button>
             <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'config' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}
             >
                 Configurações
             </button>
        </div>
      </div>

      {/* --- TAB: CONFIG --- */}
      {activeTab === 'config' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grades */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                          <GraduationCap className="text-indigo-500"/> Séries
                      </h3>
                      {state.grades.length === 0 && (
                          <button onClick={handleImportDefaultGrades} className="text-xs text-indigo-500 hover:underline">Importar Padrão</button>
                      )}
                  </div>

                  <div className="flex gap-2 mb-4">
                      <Input placeholder="Nova Série (ex: 3º Ano)" value={newGrade} onChange={e => setNewGrade(e.target.value)} className="h-9"/>
                      <Button size="sm" onClick={handleAddGrade} disabled={!newGrade}><Plus size={16}/></Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {activeGrades.map(g => (
                          <div key={g} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700">
                              <span className="text-sm">{g}</span>
                              <button onClick={() => handleDeleteGrade(g)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
              </div>

              {/* Subjects */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                      <BookOpen className="text-indigo-500"/> Disciplinas
                  </h3>

                  <div className="flex gap-2 mb-4">
                      <Input placeholder="Nova Disciplina" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="h-9"/>
                      <Button size="sm" onClick={handleAddSubject} disabled={!newSubject}><Plus size={16}/></Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                      {state.subjects.map(s => (
                          <div key={s} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700">
                              <span className="text-sm">{s}</span>
                              <button onClick={() => handleDeleteSubject(s)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- TAB: TEACHERS --- */}
      {activeTab === 'teachers' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 dark:text-slate-300">Cadastro de Professores</h3>
                  <Button onClick={() => handleOpenTeacherModal()} size="sm" className="flex items-center gap-2">
                      <Plus size={16}/> Novo Professor
                  </Button>
              </div>
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                      <tr>
                          <th className="px-6 py-4">Professor</th>
                          <th className="px-6 py-4">Matrícula</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {teachers.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="px-6 py-4 flex items-center gap-3">
                                  <img src={t.photoUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200"/>
                                  <span className="font-medium">{t.name}</span>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{t.registration || '-'}</td>
                              <td className="px-6 py-4 text-slate-500">{t.email}</td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => handleOpenTeacherModal(t)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded"><Edit size={16}/></button>
                                      <button onClick={() => handleDeleteTeacher(t.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}

      {/* --- TAB: DRIVES --- */}
      {activeTab === 'drives' && (
          <div className="space-y-4">
              {[
                  { type: 'EXAM_DELIVERY' as const, label: 'Entrega de provas e roteiros' },
                  { type: 'PLAN_DELIVERY' as const, label: 'Entrega planos de aula' },
                  { type: 'REPORT_MONITORING' as const, label: 'Acompanhamento dos relatórios' },
                  { type: 'DRIVE_UPDATE' as const, label: 'Atualização do Driver' },
              ].map(section => (
                  <div key={section.type} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <button
                          onClick={() => setExpandedSection(expandedSection === section.type ? null : section.type)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                              {expandedSection === section.type ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                              {section.label}
                          </span>
                          <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full border border-indigo-100">
                              {(state.coordinationRecords || []).filter(r => r.type === section.type).length} registros
                          </span>
                      </button>

                      {expandedSection === section.type && (
                          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                              <div className="flex justify-end mb-4">
                                  <Button size="sm" onClick={() => handleOpenRecordModal(section.type)} className="flex items-center gap-2">
                                      <Plus size={16}/> Novo Registro
                                  </Button>
                              </div>
                              {renderRecordTable(section.type)}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      )}

      {/* --- MODAL: TEACHER --- */}
      {isTeacherModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h3>
                    <button onClick={() => setIsTeacherModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <label className="cursor-pointer relative group">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                                {teacherForm.photoUrl ? <img src={teacherForm.photoUrl} alt="" className="w-full h-full object-cover"/> : <UserIcon size={32} className="text-slate-400"/>}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={20} className="text-white"/>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleTeacherPhotoUpload}/>
                        </label>
                    </div>
                    <Input placeholder="Nome Completo" value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}/>
                    <Input placeholder="Matrícula" value={teacherForm.registration} onChange={e => setTeacherForm({...teacherForm, registration: e.target.value})}/>
                    <Input type="email" placeholder="Email" value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})}/>
                    <Input type="password" placeholder={editingTeacher ? "Nova Senha (opcional)" : "Senha"} value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})}/>
                    <Button className="w-full mt-4" onClick={handleSaveTeacher}>Salvar Professor</Button>
                </div>
            </div>
          </div>
      )}

      {/* --- MODAL: RECORD --- */}
      {isRecordModalOpen && recordForm.type && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">
                        {editingRecord ? 'Editar Registro' : 'Novo Registro'}
                    </h3>
                    <button onClick={() => setIsRecordModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Professor</label>
                        <select
                            className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                            value={recordForm.teacherId}
                            onChange={e => setRecordForm({...recordForm, teacherId: e.target.value})}
                        >
                            <option value="">Selecione...</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Série</label>
                            <select
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                value={recordForm.grade}
                                onChange={e => setRecordForm({...recordForm, grade: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {activeGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Turno</label>
                            <select
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                value={recordForm.shift}
                                onChange={e => setRecordForm({...recordForm, shift: e.target.value})}
                            >
                                <option value="Manhã">Manhã</option>
                                <option value="Tarde">Tarde</option>
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Fields based on Type */}
                    {(recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'PLAN_DELIVERY') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Prazo</label>
                                <Input type="date" value={recordForm.deadline} onChange={e => setRecordForm({...recordForm, deadline: e.target.value})}/>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Data Entrega</label>
                                <Input type="date" value={recordForm.deliveryDate} onChange={e => setRecordForm({...recordForm, deliveryDate: e.target.value})}/>
                            </div>
                        </div>
                    )}

                    {recordForm.type === 'REPORT_MONITORING' && (
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Bimestre / Período</label>
                            <select
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                value={recordForm.period}
                                onChange={e => setRecordForm({...recordForm, period: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                <option value="1º Bimestre">1º Bimestre</option>
                                <option value="2º Bimestre">2º Bimestre</option>
                                <option value="3º Bimestre">3º Bimestre</option>
                                <option value="4º Bimestre">4º Bimestre</option>
                            </select>
                        </div>
                    )}

                    {recordForm.type === 'DRIVE_UPDATE' && (
                         <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                             <div className="mb-4">
                                <label className="text-xs font-bold text-slate-500 uppercase">Semana (Data Referência)</label>
                                <Input type="date" value={recordForm.weekDate} onChange={e => setRecordForm({...recordForm, weekDate: e.target.value})}/>
                             </div>
                             <label className="flex items-center gap-2 cursor-pointer">
                                 <input
                                    type="checkbox"
                                    className="w-5 h-5 text-indigo-600 rounded"
                                    checked={recordForm.isCompleted}
                                    onChange={e => setRecordForm({...recordForm, isCompleted: e.target.checked})}
                                 />
                                 <span className="font-medium text-slate-700 dark:text-slate-300">Concluído (Atualizado)</span>
                             </label>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                             <select
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                value={recordForm.status}
                                onChange={e => setRecordForm({...recordForm, status: e.target.value})}
                            >
                                <option value="No Prazo">No Prazo</option>
                                <option value="Antecipado">Antecipado</option>
                                <option value="Fora do prazo">Fora do Prazo</option>
                                <option value="Em Dias">Em Dias</option>
                                <option value="Atrasado">Atrasado</option>
                            </select>
                        </div>
                         <div>
                             <label className="text-xs font-bold text-slate-500 uppercase">Link do Arquivo</label>
                             <Input placeholder="URL do PDF/Excel" value={recordForm.fileUrl} onChange={e => setRecordForm({...recordForm, fileUrl: e.target.value})}/>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Observações</label>
                        <textarea
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 resize-none h-24"
                            value={recordForm.observation}
                            onChange={e => setRecordForm({...recordForm, observation: e.target.value})}
                        />
                    </div>

                    <Button className="w-full" onClick={handleSaveRecord}>Salvar Registro</Button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
}
