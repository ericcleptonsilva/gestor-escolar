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
  Clock,
  List
} from 'lucide-react';

import { AppState, User, CoordinationDelivery, DeliveryType, DeliveryStatus, TeacherAttendanceRecord } from '@/types';
import { api } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { parseTopData } from '@/utils/parsing';

// --- Constants ---
const DELIVERY_TYPES: Record<DeliveryType, string> = {
    'Exam': 'Entrega de Provas e Roteiros',
    'Plan': 'Entrega de Planos de Aula',
    'Report': 'Acompanhamento de Relatórios',
    'Drive': 'Atualização do Driver'
};

// Define status options by delivery type
const STATUS_OPTIONS_BY_TYPE: Record<DeliveryType, DeliveryStatus[]> = {
    'Exam': ['No Prazo', 'Antecipado', 'Fora do prazo'],
    'Plan': ['No Prazo', 'Antecipado', 'Fora do prazo'],
    'Report': ['Em Dias', 'Atrasado'],
    'Drive': ['Em Dias', 'Atrasado']
};

interface CoordinationViewProps {
  state: AppState;
  currentUser: User;
  onUpdateState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function CoordinationView({ state, currentUser, onUpdateState }: CoordinationViewProps) {
  // --- ACCORDION STATE ---
  const [openSection, setOpenSection] = useState<'teachers' | 'drives' | 'catalogs' | 'attendance' | null>('drives');
  const [activeDriveTab, setActiveDriveTab] = useState<DeliveryType>('Exam');

  // --- TEACHER ATTENDANCE STATE ---
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [isImportingAttendance, setIsImportingAttendance] = useState(false);

  // --- TEACHER MANAGEMENT STATE ---
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [teacherSearch, setTeacherSearch] = useState('');

  const [teacherForm, setTeacherForm] = useState<User>({
      id: '', name: '', email: '', password: '', role: 'Teacher', allowedGrades: [], subjects: []
  });
  const [newSubjectSelection, setNewSubjectSelection] = useState<string[]>([]);
  const [newGradeSelection, setNewGradeSelection] = useState<string[]>([]);

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

  // --- CATALOG MANAGEMENT STATE ---
  const [newCatalogSubject, setNewCatalogSubject] = useState('');
  const [newCatalogGrade, setNewCatalogGrade] = useState('');

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

  const teacherAttendance = useMemo(() => {
      return (state.teacherAttendance || []).filter(a => a.date === attendanceDate);
  }, [state.teacherAttendance, attendanceDate]);

  // --- ATTENDANCE ACTIONS ---
  const handleImportTeacherTurnstile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImportingAttendance(true);
      const reader = new FileReader();

      reader.onload = async (evt) => {
          try {
              const text = evt.target?.result as string;
              const records = parseTopData(text);

              const teacherMap = new Map<string, User>();
              const teachersList = (state.users || []).filter(u => u.role === 'Teacher');

              teachersList.forEach(t => {
                  if (t.registration) {
                      teacherMap.set(t.registration, t);
                      // Handle leading zeros matching
                      const regInt = parseInt(t.registration, 10);
                      if (!isNaN(regInt)) {
                          teacherMap.set(regInt.toString(), t);
                      }
                  }
              });

              let processedCount = 0;
              let notFoundCount = 0;
              const pendingUpdates: TeacherAttendanceRecord[] = [];
              const presentTeacherIds = new Set<string>();

              // Filter records for selected date
              // Wait, usually imports are for "Today" or we scan the file.
              // For Teachers, let's process ALL dates found in file, or just selected?
              // The user requirement "gerar sua falta automaticamente" implies we should look at the file's date.
              // Let's filter records that match the currently selected date in UI to avoid confusion, or process all.
              // Let's process records matching the file dates, but since we view by date, maybe we should auto-switch date?
              // Standard approach: Process file for its dates.

              // Group by date
              const recordsByDate = new Map<string, typeof records>();
              records.forEach(r => {
                  if (!recordsByDate.has(r.date)) recordsByDate.set(r.date, []);
                  recordsByDate.get(r.date)?.push(r);
              });

              for (const [date, dateRecords] of recordsByDate.entries()) {
                  const dayPresentIds = new Set<string>();
                  const processedTeacherIds = new Set<string>();

                  // Group punches by Teacher for this Date
                  // TeacherID -> List of Records
                  const punchesByTeacher = new Map<string, typeof dateRecords>();

                  for (const rec of dateRecords) {
                      let teacher = teacherMap.get(rec.matricula);
                      if (!teacher) {
                          const intVal = parseInt(rec.matricula, 10);
                          if (!isNaN(intVal)) teacher = teacherMap.get(intVal.toString());
                      }

                      if (teacher) {
                          if (!punchesByTeacher.has(teacher.id)) {
                              punchesByTeacher.set(teacher.id, []);
                          }
                          punchesByTeacher.get(teacher.id)?.push(rec);
                      } else {
                          notFoundCount++; // Count unfound lines
                      }
                  }

                  // Process Present Teachers (Aggregate Punches)
                  for (const [teacherId, punches] of punchesByTeacher.entries()) {
                      // Sort by time
                      punches.sort((a, b) => a.time.localeCompare(b.time));

                      const timeStr = punches.map(p => p.time).join(' | ');
                      const codes = [...new Set(punches.map(p => p.code))].join(',');

                      const record: TeacherAttendanceRecord = {
                          id: Math.random().toString(36).substr(2, 9),
                          teacherId: teacherId,
                          date: date,
                          status: 'Present',
                          time: timeStr,
                          observation: `Catraca (${codes})`
                      };

                      pendingUpdates.push(record);
                      dayPresentIds.add(teacherId);
                      processedCount += punches.length;
                  }

                  // Generate Absences for this date
                  const allTeachers = (state.users || []).filter(u => u.role === 'Teacher');
                  for (const t of allTeachers) {
                      if (!dayPresentIds.has(t.id)) {
                          pendingUpdates.push({
                              id: Math.random().toString(36).substr(2, 9),
                              teacherId: t.id,
                              date: date,
                              status: 'Absent',
                              observation: 'Ausência automática (Catraca)'
                          });
                      }
                  }
              }

              // Apply updates
              for (const update of pendingUpdates) {
                  await api.saveTeacherAttendance(update);
              }

              onUpdateState(prev => {
                  const newAttendance = [...(prev.teacherAttendance || [])];
                  pendingUpdates.forEach(u => {
                      const idx = newAttendance.findIndex(a => a.teacherId === u.teacherId && a.date === u.date);
                      if (idx >= 0) {
                          // Prefer Present over Absent if multiple updates (though logic above handles it)
                          // If current is Present and new is Absent, ignore.
                          // If current is Absent and new is Present, overwrite.
                          if (u.status === 'Present') newAttendance[idx] = u;
                          else if (newAttendance[idx].status !== 'Present') newAttendance[idx] = u;
                      } else {
                          newAttendance.push(u);
                      }
                  });
                  return { ...prev, teacherAttendance: newAttendance };
              });

              alert(`Importação concluída.\nRegistros processados: ${processedCount}\nNão encontrados: ${notFoundCount}`);
              if (recordsByDate.size > 0) {
                  setAttendanceDate(recordsByDate.keys().next().value); // Jump to first date found
              }

          } catch (err: any) {
              alert("Erro ao importar: " + err.message);
          } finally {
              setIsImportingAttendance(false);
              e.target.value = '';
          }
      };
      reader.readAsText(file);
  };

  // --- TEACHER ACTIONS ---
  const handleOpenTeacherModal = (user?: User) => {
      if (user) {
          setEditingTeacher(user);
          setTeacherForm({ ...user, subjects: user.subjects || [], allowedGrades: user.allowedGrades || [] });
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
      const savedUser = await api.saveUser(teacherForm);
      onUpdateState(prev => {
          const exists = prev.users.find(u => u.id === savedUser.id);
          if (exists) {
              return { ...prev, users: prev.users.map(u => u.id === savedUser.id ? savedUser : u) };
          } else {
              return { ...prev, users: [...prev.users, savedUser] };
          }
      });
      setIsTeacherModalOpen(false);
  };

  const handleDeleteTeacher = async (id: string) => {
      if (confirm("Tem certeza que deseja excluir este professor?")) {
          await api.deleteUser(id);
          onUpdateState(prev => ({
              ...prev,
              users: prev.users.filter(u => u.id !== id)
          }));
      }
  };

  const toggleSubject = (subject: string) => {
      setTeacherForm(prev => {
          const subjects = prev.subjects || [];
          if (subjects.includes(subject)) {
              return { ...prev, subjects: subjects.filter(s => s !== subject) };
          } else {
              return { ...prev, subjects: [...subjects, subject] };
          }
      });
  };

  const toggleGrade = (grade: string) => {
      setTeacherForm(prev => {
          const grades = prev.allowedGrades || [];
          if (grades.includes(grade)) {
              return { ...prev, allowedGrades: grades.filter(g => g !== grade) };
          } else {
              return { ...prev, allowedGrades: [...grades, grade] };
          }
      });
  };

  // --- CATALOG ACTIONS ---
  const handleAddCatalogSubject = async () => {
      if (newCatalogSubject && !state.subjects.includes(newCatalogSubject)) {
          const newSubjects = [...state.subjects, newCatalogSubject];
          await api.updateSubjects(newSubjects);
          onUpdateState(prev => ({ ...prev, subjects: newSubjects }));
          setNewCatalogSubject('');
      }
  };

  const handleRemoveCatalogSubject = async (subject: string) => {
      if (confirm(`Remover disciplina "${subject}"?`)) {
          const newSubjects = state.subjects.filter(s => s !== subject);
          await api.updateSubjects(newSubjects);
          onUpdateState(prev => ({ ...prev, subjects: newSubjects }));
      }
  };

  const handleAddCatalogGrade = async () => {
      if (newCatalogGrade && !state.grades.includes(newCatalogGrade)) {
          const newGrades = [...state.grades, newCatalogGrade];
          await api.updateGrades(newGrades);
          onUpdateState(prev => ({ ...prev, grades: newGrades }));
          setNewCatalogGrade('');
      }
  };

  const handleRemoveCatalogGrade = async (grade: string) => {
      if (confirm(`Remover série "${grade}"?`)) {
          const newGrades = state.grades.filter(g => g !== grade);
          await api.updateGrades(newGrades);
          onUpdateState(prev => ({ ...prev, grades: newGrades }));
      }
  };

  // --- DELIVERY ACTIONS ---
  const handleOpenDeliveryModal = (record?: CoordinationDelivery) => {
      const allowedStatus = STATUS_OPTIONS_BY_TYPE[activeDriveTab];
      const defaultStatus = allowedStatus[0];

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
              status: defaultStatus,
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

      const savedDelivery = await api.saveCoordinationDelivery(deliveryForm);
      onUpdateState(prev => {
          const exists = (prev.coordinationDeliveries || []).find(d => d.id === savedDelivery.id);
          if (exists) {
              return { ...prev, coordinationDeliveries: prev.coordinationDeliveries.map(d => d.id === savedDelivery.id ? savedDelivery : d) };
          } else {
              return { ...prev, coordinationDeliveries: [...(prev.coordinationDeliveries || []), savedDelivery] };
          }
      });
      setIsDeliveryModalOpen(false);
  };

  const handleDeleteDelivery = async (id: string) => {
      if (confirm("Excluir este registro?")) {
          await api.deleteCoordinationDelivery(id);
          onUpdateState(prev => ({
              ...prev,
              coordinationDeliveries: (prev.coordinationDeliveries || []).filter(d => d.id !== id)
          }));
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

  const allowedStatusOptions = STATUS_OPTIONS_BY_TYPE[activeDriveTab] || [];

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
                                <th className="px-4 py-3">Matrícula</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Disciplinas</th>
                                <th className="px-4 py-3">Séries</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {teachers.map(teacher => (
                                <tr key={teacher.id}>
                                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                                        <img src={teacher.photoUrl || `https://ui-avatars.com/api/?name=${teacher.name}`} alt="" className="w-8 h-8 rounded-full" />
                                        {teacher.name}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{teacher.registration || '-'}</td>
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
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(teacher.allowedGrades || []).map(grade => (
                                                <span key={grade} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] border border-green-100">
                                                    {grade}
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

      {/* SECTION 1.5: FREQUÊNCIA (PROFESSORES) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
            onClick={() => setOpenSection(openSection === 'attendance' ? null : 'attendance')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
            <div className="flex items-center gap-3">
                <Clock className="text-teal-500" size={20} />
                <span className="font-bold text-slate-700 dark:text-slate-200">Frequência (Professores)</span>
            </div>
            {openSection === 'attendance' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {openSection === 'attendance' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-slate-500">Data:</label>
                        <Input
                            type="date"
                            className="w-40 h-9 text-sm"
                            value={attendanceDate}
                            onChange={e => setAttendanceDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                            {isImportingAttendance ? <Clock className="animate-spin" size={16} /> : <Upload size={16} />}
                            Importar TopData.txt
                            <input
                                type="file"
                                accept=".txt"
                                onChange={handleImportTeacherTurnstile}
                                disabled={isImportingAttendance}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                            <tr>
                                <th className="px-4 py-3">Professor</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Horário</th>
                                <th className="px-4 py-3">Observação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {teachers.map(t => {
                                const record = teacherAttendance.find(a => a.teacherId === t.id);
                                const isPresent = record?.status === 'Present';
                                return (
                                    <tr key={t.id}>
                                        <td className="px-4 py-3 font-medium">{t.name}</td>
                                        <td className="px-4 py-3">
                                            {record ? (
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${isPresent ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                                                    {isPresent ? 'Presente' : 'Falta'}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Não Registrado</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{record?.time || '-'}</td>
                                        <td className="px-4 py-3 text-slate-500 text-xs">{record?.observation || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>

      {/* SECTION 2: CADASTROS AUXILIARES */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <button
            onClick={() => setOpenSection(openSection === 'catalogs' ? null : 'catalogs')}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
            <div className="flex items-center gap-3">
                <List className="text-purple-500" size={20} />
                <span className="font-bold text-slate-700 dark:text-slate-200">Cadastros Auxiliares</span>
            </div>
            {openSection === 'catalogs' ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </button>

        {openSection === 'catalogs' && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Subjects Catalog */}
                <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Disciplinas</h4>
                    <div className="flex gap-2 mb-3">
                        <Input
                            placeholder="Nova disciplina..."
                            value={newCatalogSubject}
                            onChange={e => setNewCatalogSubject(e.target.value)}
                            className="h-9"
                        />
                        <Button size="sm" onClick={handleAddCatalogSubject} disabled={!newCatalogSubject}><Plus size={16} /></Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {state.subjects.map(sub => (
                                <li key={sub} className="flex justify-between items-center p-2 text-sm">
                                    <span>{sub}</span>
                                    <button onClick={() => handleRemoveCatalogSubject(sub)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Grades Catalog */}
                <div>
                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Séries</h4>
                    <div className="flex gap-2 mb-3">
                        <Input
                            placeholder="Nova série..."
                            value={newCatalogGrade}
                            onChange={e => setNewCatalogGrade(e.target.value)}
                            className="h-9"
                        />
                        <Button size="sm" onClick={handleAddCatalogGrade} disabled={!newCatalogGrade}><Plus size={16} /></Button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 max-h-60 overflow-y-auto">
                        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                            {state.grades.map(grade => (
                                <li key={grade} className="flex justify-between items-center p-2 text-sm">
                                    <span>{grade}</span>
                                    <button onClick={() => handleRemoveCatalogGrade(grade)} className="text-red-400 hover:text-red-600 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

            </div>
        )}
      </div>

      {/* SECTION 3: ATUALIZAÇÃO DOS DRIVES */}
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
                                                {item.metadata.week || '-'}
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
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h3>
                  <div className="space-y-4">
                      <div className="flex flex-col items-center mb-4">
                          <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden mb-2 border">
                              <img src={teacherForm.photoUrl || `https://ui-avatars.com/api/?name=${teacherForm.name || 'User'}`} alt="Foto" className="w-full h-full object-cover" />
                          </div>
                          <label className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 font-bold">
                              Alterar Foto
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                  if (e.target.files?.[0]) {
                                      const url = await api.uploadPhoto(e.target.files[0], 'user', teacherForm.id || 'temp');
                                      setTeacherForm({...teacherForm, photoUrl: url});
                                  }
                              }} />
                          </label>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-500">Nome</label>
                          <Input value={teacherForm.name} onChange={e => setTeacherForm({...teacherForm, name: e.target.value})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500">Email</label>
                            <Input value={teacherForm.email} onChange={e => setTeacherForm({...teacherForm, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500">Matrícula (5 Dígitos)</label>
                            <Input
                                value={teacherForm.registration || ''}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                                    setTeacherForm({...teacherForm, registration: val});
                                }}
                                placeholder="00000"
                            />
                        </div>
                      </div>
                      {!editingTeacher && (
                          <div>
                              <label className="text-xs font-bold text-slate-500">Senha Padrão</label>
                              <Input value={teacherForm.password} onChange={e => setTeacherForm({...teacherForm, password: e.target.value})} />
                          </div>
                      )}

                      {/* Subjects Selection */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block">Disciplinas</label>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                              {state.subjects.map(sub => (
                                  <label key={sub} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                                      <input
                                          type="checkbox"
                                          checked={teacherForm.subjects?.includes(sub)}
                                          onChange={() => toggleSubject(sub)}
                                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>{sub}</span>
                                  </label>
                              ))}
                          </div>
                      </div>

                      {/* Grades Selection */}
                      <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block">Séries</label>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                              {state.grades.map(grade => (
                                  <label key={grade} className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                                      <input
                                          type="checkbox"
                                          checked={teacherForm.allowedGrades?.includes(grade)}
                                          onChange={() => toggleGrade(grade)}
                                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                      <span>{grade}</span>
                                  </label>
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
                              {allowedStatusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>

                      {/* Context Fields based on Type */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase">Contexto</h4>

                          {(activeDriveTab === 'Exam' || activeDriveTab === 'Report' || activeDriveTab === 'Drive') && (
                              <div className="grid grid-cols-2 gap-3">
                                  <div>
                                      <label className="text-xs text-slate-400">Série</label>
                                      <select
                                        className="w-full p-2 h-10 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                        value={deliveryForm.metadata.grade || ''}
                                        onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, grade: e.target.value}})}
                                      >
                                          <option value="">Selecione...</option>
                                          {state.grades.map(g => (
                                              <option key={g} value={g}>{g}</option>
                                          ))}
                                      </select>
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
                                  <select
                                    className="w-full p-2 h-10 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                    value={deliveryForm.metadata.subject || ''}
                                    onChange={e => setDeliveryForm({...deliveryForm, metadata: {...deliveryForm.metadata, subject: e.target.value}})}
                                  >
                                      <option value="">Selecione...</option>
                                      {state.subjects.map(s => (
                                          <option key={s} value={s}>{s}</option>
                                      ))}
                                  </select>
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
                                  <label className="text-xs text-slate-400 block mb-2">Dias da Semana e Datas</label>
                                  <div className="space-y-2">
                                    {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day) => {
                                        // Parse current metadata.week string to find if day is selected and its date
                                        // Format expected: "Segunda (2023-10-23), Terça (2023-10-24)"
                                        const parseWeek = (weekStr: string | undefined) => {
                                            const map: Record<string, string> = {};
                                            if (!weekStr) return map;
                                            weekStr.split(',').forEach(part => {
                                                const match = part.trim().match(/^(.+?)(?:\s\((.+)\))?$/);
                                                if (match) {
                                                    const d = match[1];
                                                    const date = match[2] || '';
                                                    if (['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].includes(d)) {
                                                        map[d] = date;
                                                    }
                                                }
                                            });
                                            return map;
                                        };

                                        const weekMap = parseWeek(deliveryForm.metadata.week);
                                        const isChecked = weekMap.hasOwnProperty(day);
                                        const dateValue = weekMap[day] || '';

                                        const updateWeekMetadata = (newMap: Record<string, string>) => {
                                            const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
                                            const parts = order
                                                .filter(d => newMap.hasOwnProperty(d))
                                                .map(d => newMap[d] ? `${d} (${newMap[d]})` : d);

                                            setDeliveryForm({
                                                ...deliveryForm,
                                                metadata: { ...deliveryForm.metadata, week: parts.join(', ') }
                                            });
                                        };

                                        return (
                                            <div key={day} className="flex items-center gap-2">
                                                <label className="flex items-center space-x-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded w-24">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => {
                                                            const newMap = { ...weekMap };
                                                            if (isChecked) {
                                                                delete newMap[day];
                                                            } else {
                                                                newMap[day] = '';
                                                            }
                                                            updateWeekMetadata(newMap);
                                                        }}
                                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span>{day}</span>
                                                </label>

                                                {isChecked && (
                                                    <Input
                                                        type="date"
                                                        className="h-8 w-40 text-xs"
                                                        value={dateValue}
                                                        onChange={(e) => {
                                                            const newMap = { ...weekMap };
                                                            newMap[day] = e.target.value;
                                                            updateWeekMetadata(newMap);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                  </div>
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
