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
  CheckCircle,
  XCircle,
  Upload,
  User,
  Settings,
  BookOpen,
  GraduationCap,
  Printer
} from 'lucide-react';
import { AppState, User as UserType, CoordinationRecord, CoordinationType, TeacherClass, Shift } from '@/types';
import { api } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GRADES_LIST } from '@/constants';

interface CoordinationViewProps {
  state: AppState;
  currentUser: UserType;
  onRefresh: () => void;
}

export function CoordinationView({ state, currentUser, onRefresh }: CoordinationViewProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'teachers' | 'drives'>('drives');

  // --- STATE: Config ---
  const [newGrade, setNewGrade] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // --- STATE: Teachers ---
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<UserType | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<UserType>>({
      name: '', email: '', password: '', role: 'Teacher', registration: '', photoUrl: '', classes: []
  });
  const [newTeacherClass, setNewTeacherClass] = useState<{grade: string, subject: string, shift: Shift}>({ grade: '', subject: '', shift: 'Manhã' });

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
  const handleOpenTeacherModal = (teacher?: UserType) => {
      if (teacher) {
          setEditingTeacher(teacher);
          setTeacherForm({ ...teacher, password: '', classes: teacher.classes || [] });
      } else {
          setEditingTeacher(null);
          setTeacherForm({
              id: '', name: '', email: '', password: '', role: 'Teacher', registration: '', photoUrl: '',
              allowedGrades: [], classes: []
          });
      }
      setNewTeacherClass({ grade: '', subject: '', shift: 'Manhã' });
      setIsTeacherModalOpen(true);
  };

  const handleAddTeacherClass = () => {
      if (newTeacherClass.grade && newTeacherClass.subject) {
          const newClass: TeacherClass = {
              id: Math.random().toString(36).substr(2, 9),
              grade: newTeacherClass.grade,
              subject: newTeacherClass.subject,
              shift: newTeacherClass.shift
          };
          setTeacherForm(prev => ({
              ...prev,
              classes: [...(prev.classes || []), newClass]
          }));
          setNewTeacherClass({ grade: '', subject: '', shift: 'Manhã' });
      }
  };

  const handleRemoveTeacherClass = (id: string) => {
      setTeacherForm(prev => ({
          ...prev,
          classes: (prev.classes || []).filter(c => c.id !== id)
      }));
  };

  const handleSaveTeacher = async () => {
      if (!teacherForm.name) {
          alert("Nome é obrigatório.");
          return;
      }

      // Auto-generate credentials if not provided (hidden from UI)
      const generatedEmail = teacherForm.registration
          ? `${teacherForm.registration}@professor.com`
          : `${teacherForm.name.toLowerCase().replace(/\s+/g, '.')}@professor.com`;

      const userToSave: UserType = {
          id: editingTeacher?.id || Math.random().toString(36).substr(2, 9),
          name: teacherForm.name,
          email: editingTeacher?.email || generatedEmail,
          role: 'Teacher',
          photoUrl: teacherForm.photoUrl || `https://ui-avatars.com/api/?name=${teacherForm.name}&background=random`,
          registration: teacherForm.registration || '',
          allowedGrades: teacherForm.allowedGrades || [],
          classes: teacherForm.classes || []
      };

      // Default password for new users if hidden
      if (!editingTeacher) {
          userToSave.password = '123';
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
              isCompleted: false,
              subject: ''
          });
      }
      setIsRecordModalOpen(true);
  };

  const handleTeacherSelect = (teacherId: string) => {
      const teacher = state.users.find(u => u.id === teacherId);
      setRecordForm(prev => ({
          ...prev,
          teacherId,
          teacherName: teacher?.name || '',
          grade: '',
          subject: ''
      }));
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

  const handlePrintSection = (type: CoordinationType, title: string) => {
      const records = (state.coordinationRecords || []).filter(r => r.type === type);

      let html = `
        <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; }
            .status-badge { padding: 2px 5px; border-radius: 4px; font-size: 10px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead>
              <tr>
                <th>Professor</th>
                ${type === 'DRIVE_UPDATE' ? '<th>Série/Turno</th><th>Semana</th><th>Concluído</th>' : '<th>Prazo</th><th>Entrega</th>'}
                ${type === 'REPORT_MONITORING' ? '<th>Bimestre</th>' : ''}
                ${type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY' ? '<th>Série</th><th>Disciplina</th>' : ''}
                <th>Status</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              ${records.map(r => `
                <tr>
                  <td>${r.teacherName}</td>
                  ${type === 'DRIVE_UPDATE'
                    ? `<td>${r.grade || '-'} / ${r.shift || '-'}</td><td>${r.weekDate ? new Date(r.weekDate).toLocaleDateString('pt-BR') : '-'}</td><td>${r.isCompleted ? 'Sim' : 'Não'}</td>`
                    : `<td>${r.deadline ? new Date(r.deadline).toLocaleDateString('pt-BR') : '-'}</td><td>${r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString('pt-BR') : '-'}</td>`
                  }
                  ${type === 'REPORT_MONITORING' ? `<td>${r.period || '-'}</td>` : ''}
                  ${type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY' ? `<td>${r.grade || '-'}</td><td>${r.subject || '-'}</td>` : ''}
                  <td>${r.status}</td>
                  <td>${r.observation || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const win = window.open('', '_blank');
      win?.document.write(html);
      win?.document.close();
      win?.print();
  };

  // --- RENDER HELPERS ---
  const teachers = state.users.filter(u => u.role === 'Teacher');
  const activeGrades = state.grades.length > 0 ? state.grades : GRADES_LIST;

  // Helper to get available grades for selected teacher in form
  const getTeacherGrades = () => {
      if (!recordForm.teacherId) return activeGrades;
      const teacher = state.users.find(u => u.id === recordForm.teacherId);
      if (teacher && teacher.classes && teacher.classes.length > 0) {
          // Unique grades from classes
          return Array.from(new Set(teacher.classes.map(c => c.grade)));
      }
      return activeGrades;
  };

  // Helper to get available shifts for selected teacher AND grade in form
  const getTeacherShifts = () => {
      if (!recordForm.teacherId) return ['Manhã', 'Tarde'];
      const teacher = state.users.find(u => u.id === recordForm.teacherId);
      if (!teacher) return ['Manhã', 'Tarde'];

      if (teacher.classes && teacher.classes.length > 0) {
          let classes = teacher.classes;
          if (recordForm.grade) {
              classes = classes.filter(c => c.grade === recordForm.grade);
          }
          const shifts = Array.from(new Set(classes.map(c => c.shift || 'Manhã'))); // Default to Manhã if undefined
          return shifts.length > 0 ? shifts : ['Manhã', 'Tarde'];
      }
      return ['Manhã', 'Tarde'];
  };

  // Helper to get available subjects for selected teacher AND grade in form
  const getTeacherSubjects = () => {
      if (!recordForm.teacherId) return state.subjects;
      const teacher = state.users.find(u => u.id === recordForm.teacherId);
      if (!teacher) return state.subjects;

      if (teacher.classes && teacher.classes.length > 0) {
          let classes = teacher.classes;
          if (recordForm.grade) {
              classes = classes.filter(c => c.grade === recordForm.grade);
          }
          const subjects = Array.from(new Set(classes.map(c => c.subject)));
          return subjects.length > 0 ? subjects : state.subjects;
      }
      return state.subjects;
  };

  const renderRecordTable = (type: CoordinationType, title: string) => {
      const records = (state.coordinationRecords || []).filter(r => r.type === type);

      return (
          <div className="overflow-x-auto">
              <div className="flex justify-between mb-2">
                 <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wide pt-2">Registros</h4>
                 <Button variant="ghost" size="sm" onClick={() => handlePrintSection(type, title)} className="text-slate-500">
                     <Printer size={16} className="mr-2"/> Imprimir Relatório
                 </Button>
              </div>
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
                          {(type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY') && (
                              <>
                                <th className="px-4 py-3">Série</th>
                                <th className="px-4 py-3">Disciplina</th>
                              </>
                          )}
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Arquivo</th>
                          <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {records.length === 0 ? (
                          <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Nenhum registro.</td></tr>
                      ) : (
                          records.map(r => (
                              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                  <td className="px-4 py-3">{r.teacherName}</td>
                                  {type === 'DRIVE_UPDATE' ? (
                                      <>
                                          <td className="px-4 py-3">{r.grade} - {r.shift}</td>
                                          <td className="px-4 py-3">{r.weekDate ? new Date(r.weekDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                                          <td className="px-4 py-3">
                                              {r.isCompleted ? <CheckCircle size={16} className="text-green-500"/> : <XCircle size={16} className="text-red-300"/>}
                                          </td>
                                      </>
                                  ) : (
                                      <>
                                          <td className="px-4 py-3">{r.deadline ? new Date(r.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                                          <td className="px-4 py-3">{r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                                          {type === 'REPORT_MONITORING' && <td className="px-4 py-3">{r.period}</td>}
                                      </>
                                  )}
                                  {(type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY') && (
                                      <>
                                        <td className="px-4 py-3">{r.grade || '-'}</td>
                                        <td className="px-4 py-3">{r.subject || '-'}</td>
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
                          <th className="px-6 py-4">Turmas</th>
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
                              <td className="px-6 py-4 text-slate-500 text-xs">
                                  {(t.classes || []).length > 0
                                      ? (t.classes || []).map(c => `${c.grade} (${c.subject})`).join(', ')
                                      : <span className="text-slate-400 italic">Nenhuma turma</span>
                                  }
                              </td>
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
                              {renderRecordTable(section.type, section.label)}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      )}

      {/* --- MODAL: TEACHER --- */}
      {isTeacherModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h3>
                    <button onClick={() => setIsTeacherModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                        <label className="cursor-pointer relative group">
                            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                                {teacherForm.photoUrl ? <img src={teacherForm.photoUrl} alt="" className="w-full h-full object-cover"/> : <User size={32} className="text-slate-400"/>}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload size={20} className="text-white"/>
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={handleTeacherPhotoUpload}/>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Nome Completo" value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})}/>
                        <Input placeholder="Matrícula" value={teacherForm.registration} onChange={e => setTeacherForm({...teacherForm, registration: e.target.value})}/>
                    </div>

                    {/* Class/Subject Linker */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400 mb-3">Vincular Turmas e Disciplinas</h4>

                        <div className="flex gap-2 mb-3">
                            <select
                                className="flex-1 p-2 rounded text-sm border border-slate-200 dark:border-slate-600"
                                value={newTeacherClass.grade}
                                onChange={e => setNewTeacherClass({...newTeacherClass, grade: e.target.value})}
                            >
                                <option value="">Série...</option>
                                {activeGrades.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                             <select
                                className="flex-1 p-2 rounded text-sm border border-slate-200 dark:border-slate-600"
                                value={newTeacherClass.shift}
                                onChange={e => setNewTeacherClass({...newTeacherClass, shift: e.target.value as Shift})}
                            >
                                <option value="Manhã">Manhã</option>
                                <option value="Tarde">Tarde</option>
                            </select>
                            <select
                                className="flex-1 p-2 rounded text-sm border border-slate-200 dark:border-slate-600"
                                value={newTeacherClass.subject}
                                onChange={e => setNewTeacherClass({...newTeacherClass, subject: e.target.value})}
                            >
                                <option value="">Disciplina...</option>
                                {state.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <Button size="sm" onClick={handleAddTeacherClass} disabled={!newTeacherClass.grade || !newTeacherClass.subject}>
                                <Plus size={16}/>
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-32 overflow-y-auto">
                            {(teacherForm.classes || []).length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma turma vinculada</p>}
                            {(teacherForm.classes || []).map(c => (
                                <div key={c.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs">
                                    <span>{c.grade} ({c.shift || 'Manhã'}) - <strong>{c.subject}</strong></span>
                                    <button onClick={() => handleRemoveTeacherClass(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <Button className="w-full mt-2" onClick={handleSaveTeacher}>Salvar Professor</Button>
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
                            onChange={e => handleTeacherSelect(e.target.value)}
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
                                {getTeacherGrades().map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Turno</label>
                            <select
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                value={recordForm.shift}
                                onChange={e => setRecordForm({...recordForm, shift: e.target.value})}
                            >
                                {getTeacherShifts().map(s => <option key={s} value={s}>{s}</option>)}
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

                    {(recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'PLAN_DELIVERY') && (
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Disciplina</label>
                            <select
                                className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                value={recordForm.subject}
                                onChange={e => setRecordForm({...recordForm, subject: e.target.value})}
                            >
                                <option value="">Selecione...</option>
                                {getTeacherSubjects().map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
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
