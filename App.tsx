import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  FileText, 
  ClipboardList, 
  Bot,
  UserCog,
  Menu,
  RefreshCw,
  Wifi,
  WifiOff,
  LogOut,
  Moon,
  Sun,
  AlertTriangle,
  X,
  Settings,
  GraduationCap
} from 'lucide-react';

import { 
  Student, 
  AttendanceRecord, 
  HealthDocument, 
  MakeUpExam, 
  AppState, 
  ViewState, 
  DocType, 
  AttendanceStatus, 
  BookStatus, 
  PEStatus, 
  Shift, 
  Guardian, 
  User, 
  UserRole,
  AcademicPeriod
} from '@/types';

import { generateSmartReport } from '@/services/geminiService';
import { api, setApiBaseUrl } from '@/services/api';
import {
    GRADE_GROUPS,
    GRADES_LIST,
    IMPORT_GRADE_MAP,
    SHIFTS_LIST,
    ACADEMIC_PERIODS
} from '@/constants';

// --- Components ---
import { SidebarItem } from '@/components/SidebarItem';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SettingsModal } from '@/components/SettingsModal';
import { Breadcrumbs } from '@/components/features/Breadcrumbs';

// --- View Components ---
import { DashboardView } from '@/components/views/DashboardView';
import { StudentListView } from '@/components/views/StudentListView';
import { StudentDetailView } from '@/components/views/StudentDetailView';
import { StudentEditView } from '@/components/views/StudentEditView';
import { AttendanceView } from '@/components/views/AttendanceView';
import { HealthView } from '@/components/views/HealthView';
import { ExamView } from '@/components/views/ExamView';
import { ReportView } from '@/components/views/ReportView';
import { PedagogicalView } from '@/components/views/PedagogicalView';
import { UserManagementView } from '@/components/views/UserManagementView';
import { UserEditView } from '@/components/views/UserEditView';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

// --- STORAGE CONSTANTS ---
const STORAGE_KEY_SESSION = 'escola360_session_v1';
const STORAGE_KEY_THEME = 'escola360_theme';

const createEmptyStudent = (): Student => ({
  id: '',
  name: '',
  registration: '',
  sequenceNumber: '',
  birthDate: '',
  grade: 'INF II',
  shift: 'Manhã',
  email: '',
  fatherName: '',
  fatherPhone: '',
  motherName: '',
  motherPhone: '',
  guardians: [],
  bookStatus: 'Nao Comprou',
  peStatus: 'Pendente',
  turnstileRegistered: false
});

const createEmptyUser = (): User => ({
  id: '',
  name: '',
  email: '',
  password: '',
  role: 'Coordinator',
  allowedGrades: []
});

const EMPTY_STATE: AppState = {
    users: [],
    students: [],
    attendance: [],
    documents: [],
    exams: [],
    subjects: []
};

export default function App() {
  // --- THEME STATE ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      return saved === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  // --- APP STATE ---
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'error'>('online');
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingPhotos, setIsImportingPhotos] = useState(false);
  const [isImportingPhones, setIsImportingPhones] = useState(false);
  const [isImportingTurnstile, setIsImportingTurnstile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [view, setView] = useState<ViewState>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Custom Settings
  const [appTitle, setAppTitle] = useState(() => localStorage.getItem('escola360_school_name') || 'Gestor de Alunos');
  const [appLogo, setAppLogo] = useState(() => localStorage.getItem('escola360_logo') || '');

  const [state, setState] = useState<AppState>(EMPTY_STATE);

  // --- FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [filterBookStatus, setFilterBookStatus] = useState<BookStatus | ''>('');
  const [filterPEStatus, setFilterPEStatus] = useState<PEStatus | ''>('');
  const [filterTurnstile, setFilterTurnstile] = useState<string>('');

  const [filterAttendanceStatus, setFilterAttendanceStatus] = useState<AttendanceStatus | ''>('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedShift, setSelectedShift] = useState('');

  const [filterDocGrade, setFilterDocGrade] = useState('');
  const [filterDocShift, setFilterDocShift] = useState('');
  const [filterDocType, setFilterDocType] = useState<DocType | ''>('');

  const [filterExamGrade, setFilterExamGrade] = useState('');
  const [filterExamShift, setFilterExamShift] = useState('');

  // --- EDITING STATES ---
  const [tempStudent, setTempStudent] = useState<Student>(createEmptyStudent());
  const [tempUser, setTempUser] = useState<User>(createEmptyUser());
  const [newExam, setNewExam] = useState<MakeUpExam>({
    id: '', studentId: '', subject: '', originalDate: '', reason: '', status: 'Pending', period: '1ª Bi'
  });
  const [newDoc, setNewDoc] = useState<HealthDocument>({ id: '', studentId: '', type: DocType.MEDICAL_REPORT, description: '', dateIssued: '' });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  const [newSubjectName, setNewSubjectName] = useState("");
  const [showSubjectCatalog, setShowSubjectCatalog] = useState(false);

  // --- MODAL STATE ---
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirm = (title: string, message: string, action: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: action
    });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
  };

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    const handleSyncStatus = (e: any) => {
        setSyncStatus(e.detail.status);
    };
    window.addEventListener('api-sync-status', handleSyncStatus);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.loadAllData();
        setState(data);
      } catch (error: any) {
        console.error("Failed to load data", error);
        alert("Erro ao carregar dados locais: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    return () => window.removeEventListener('api-sync-status', handleSyncStatus);
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    }
  }, [currentUser]);

  // --- POLLING / AUTO-SYNC ---
  useEffect(() => {
    // Only poll if logged in and not editing (to avoid overwriting work)
    if (!currentUser || isEditingStudent || isEditingUser || isImporting) return;

    const intervalId = setInterval(async () => {
      try {
        // Silent sync (background)
        await api.sync();
        const freshData = await api.loadAllData();

        // Simple optimization: only setState if record counts changed or something obvious
        // For now, we just update to ensure freshness. React handles DOM diffing.
        setState(prev => {
           // Optional: Deep comparison could be here to avoid re-renders if data is identical.
           // For this size app, direct replacement is usually fine.
           return freshData;
        });
      } catch (e) {
        console.error("Auto-sync failed", e);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [currentUser, isEditingStudent, isEditingUser, isImporting]);

  // --- COMPUTED VALUES ---
  const getVisibleStudents = useMemo(() => {
    if (!currentUser) return [];
    const students = state.students || [];
    if (currentUser.role === 'Admin') return students;
    return students.filter(s => currentUser.allowedGrades?.includes(s.grade));
  }, [state.students, currentUser]);

  const visibleGradesList = useMemo(() => {
     if (!currentUser || currentUser.role === 'Admin') return GRADES_LIST;
     return GRADES_LIST.filter(g => currentUser.allowedGrades?.includes(g));
  }, [currentUser]);

  const filteredStudents = useMemo(() => {
      return (getVisibleStudents || []).filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              student.registration.includes(searchTerm);
        const matchesGrade = filterGrade ? student.grade === filterGrade : true;
        const matchesShift = filterShift ? student.shift === filterShift : true;
        const matchesBook = filterBookStatus ? student.bookStatus === filterBookStatus : true;
        const matchesPE = filterPEStatus ? student.peStatus === filterPEStatus : true;
        const matchesTurnstile = filterTurnstile !== ''
            ? (filterTurnstile === 'true' ? student.turnstileRegistered : !student.turnstileRegistered)
            : true;

        return matchesSearch && matchesGrade && matchesShift && matchesBook && matchesPE && matchesTurnstile;
      }).sort((a, b) => {
          const seqA = parseInt(a.sequenceNumber);
          const seqB = parseInt(b.sequenceNumber);

          const hasSeqA = !isNaN(seqA);
          const hasSeqB = !isNaN(seqB);

          if (hasSeqA && hasSeqB) {
            return seqA - seqB;
          }
          if (hasSeqA) return -1;
          if (hasSeqB) return 1;

          return a.name.localeCompare(b.name);
      });
  }, [getVisibleStudents, searchTerm, filterGrade, filterShift, filterBookStatus, filterPEStatus, filterTurnstile]);

  // --- ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const user = await api.login(loginEmail, loginPass);
    setIsLoading(false);

    if (user) {
      setCurrentUser(user);
      setLoginError('');
      setView('dashboard');
    } else {
      setLoginError('Credenciais inválidas. Tente novamente.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPass('');
  };

  const handleManualSync = async () => {
      if (isSyncing) return;
      setIsSyncing(true);
      try {
          await api.sync();
          const refreshedData = await api.loadAllData();
          setState(refreshedData);
          alert("Sincronização com o servidor concluída com sucesso!");
      } catch (e: any) {
          console.error(e);
          alert(`Erro na sincronização: ${e.message || "Verifique sua conexão."}\n\nDica: Verifique se o endereço do servidor nas Configurações está correto (ex: http://192.168.25.77:8787/sistema_escolar_api) e se o XAMPP está rodando.`);
      } finally {
          setIsSyncing(false);
      }
  };

  const handleResetSystem = async () => {
    requestConfirm(
      "Restaurar Sistema (Apagar Tudo)",
      "ATENÇÃO: Esta ação é irreversível. Ela apagará TODOS os dados cadastrados (alunos, faltas, usuários extras, documentos) e restaurará o sistema para o estado inicial de fábrica. Deseja continuar?",
      async () => {
        await api.resetSystem();
        closeConfirm();
        alert("Sistema restaurado com sucesso.");
        window.location.reload();
      }
    );
  };

  const handleSaveSettings = (settings: { apiBaseUrl: string; schoolName: string; logo: string }) => {
    setApiBaseUrl(settings.apiBaseUrl);
    localStorage.setItem('escola360_school_name', settings.schoolName);
    localStorage.setItem('escola360_logo', settings.logo);
    setIsSettingsOpen(false);
    window.location.reload();
  };

  // Student Actions
  const handleSaveStudent = async () => {
    if (!tempStudent.name || !tempStudent.grade) return;

    // Check for Duplicate Matricula
    const isDuplicate = state.students.some(s => 
        s.id !== tempStudent.id && 
        s.registration.trim() === tempStudent.registration.trim() &&
        s.registration.trim() !== ""
    );

    if (isDuplicate) {
        alert(`Erro: A matrícula "${tempStudent.registration}" já está cadastrada para outro aluno.`);
        return;
    }

    setIsLoading(true);
    let studentToSave = {...tempStudent};

    if (!studentToSave.id) {
       studentToSave.id = Math.random().toString(36).substr(2, 9);
       if (!studentToSave.photoUrl) {
           studentToSave.photoUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${studentToSave.id}`;
       }
    }

    const savedStudent = await api.saveStudent(studentToSave);

    setState(prev => {
        const exists = prev.students.find(s => s.id === savedStudent.id);
        if (exists) {
            return { ...prev, students: prev.students.map(s => s.id === savedStudent.id ? savedStudent : s) };
        } else {
            return { ...prev, students: [...prev.students, savedStudent] };
        }
    });

    if (selectedStudent && selectedStudent.id === savedStudent.id) {
       setSelectedStudent(savedStudent);
    }

    setTempStudent(createEmptyStudent());
    setIsEditingStudent(false);
    setIsLoading(false);
  };

  const handleDeleteStudent = (id: string) => {
    requestConfirm(
      "Excluir Aluno",
      "Tem certeza que deseja remover este aluno? Esta ação apagará permanentemente o cadastro, histórico de frequência e documentos associados.",
      async () => {
        setIsLoading(true);
        await api.deleteStudent(id);
        setState(prev => ({...prev, students: (prev.students || []).filter(s => s.id !== id)}));
        if (selectedStudent?.id === id) setSelectedStudent(null);
        setIsEditingStudent(false);
        setIsLoading(false);
        closeConfirm();
      }
    );
  };

  const handleEditStudent = (student: Student) => {
    setTempStudent({...student});
    setIsEditingStudent(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingPhoto(true);
      try {
          const currentId = tempStudent.id || Math.random().toString(36).substr(2, 9);
          const photoUrl = await api.uploadPhoto(file, 'student', currentId);
          setTempStudent(prev => ({ ...prev, id: currentId, photoUrl: photoUrl }));
      } catch (err) {
          console.error("Failed to upload photo", err);
          alert("Erro ao enviar foto. Verifique a conexão com o servidor.");
      } finally {
          setIsUploadingPhoto(false);
      }
    }
  };

  // Toggle Actions
  const handleToggleBookStatus = async (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Record<BookStatus, BookStatus> = {
        'Nao Comprou': 'Comprou',
        'Comprou': 'Copia',
        'Copia': 'Livro Antigo',
        'Livro Antigo': 'Nao Comprou'
    };
    const newStatus = nextStatus[student.bookStatus] || 'Nao Comprou';
    const updatedStudent = { ...student, bookStatus: newStatus };
    setState(prev => ({ ...prev, students: prev.students.map(s => s.id === student.id ? updatedStudent : s) }));
    await api.saveStudent(updatedStudent);
  };

  const handleTogglePEStatus = async (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Record<PEStatus, PEStatus> = {
        'Pendente': 'Em Análise',
        'Em Análise': 'Aprovado',
        'Aprovado': 'Reprovado',
        'Reprovado': 'Pendente'
    };
    const newStatus = nextStatus[student.peStatus] || 'Pendente';
    const updatedStudent = { ...student, peStatus: newStatus };
    setState(prev => ({ ...prev, students: prev.students.map(s => s.id === student.id ? updatedStudent : s) }));
    await api.saveStudent(updatedStudent);
  };

  const handleToggleTurnstile = async (student: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedStudent = { ...student, turnstileRegistered: !student.turnstileRegistered };
    setState(prev => ({ ...prev, students: prev.students.map(s => s.id === student.id ? updatedStudent : s) }));
    await api.saveStudent(updatedStudent);
  };

  const handleAttendanceUpdate = async (studentId: string, status: AttendanceStatus) => {
    const existingIndex = state.attendance.findIndex(
      a => a.studentId === studentId && a.date === attendanceDate
    );
    let recordToSave: AttendanceRecord;

    if (existingIndex >= 0 && state.attendance[existingIndex]) {
        recordToSave = { ...state.attendance[existingIndex]!, status };
    } else {
        recordToSave = {
            id: Math.random().toString(36).substr(2, 9),
            studentId,
            date: attendanceDate,
            status
        };
    }
    api.saveAttendance(recordToSave);
    let newAttendance = [...state.attendance];
    if (existingIndex >= 0) {
       newAttendance[existingIndex] = recordToSave;
    } else {
       newAttendance.push(recordToSave);
    }
    setState(prev => ({ ...prev, attendance: newAttendance }));
  };

  const handleRemoveAttendanceRecord = (studentId: string) => {
    requestConfirm(
      "Remover Registro",
      "Deseja remover este registro de frequência da lista? O status voltará a ser não registrado.",
      async () => {
        await api.deleteAttendance(studentId, attendanceDate);
        setState(prev => ({
          ...prev,
          attendance: (prev.attendance || []).filter(a => !(a.studentId === studentId && a.date === attendanceDate))
        }));
        closeConfirm();
      }
    );
  };

  const handleToggleAbsence = (student: Student, isAbsentToday: boolean) => {
      if (isAbsentToday) {
          handleRemoveAttendanceRecord(student.id);
      } else {
          setAttendanceDate(new Date().toISOString().split('T')[0]);
          handleAttendanceUpdate(student.id, 'Absent');
      }
  };

  const handleAttendanceObservation = async (studentId: string, observation: string) => {
    const existingIndex = state.attendance.findIndex(
      a => a.studentId === studentId && a.date === attendanceDate
    );
    let record;
    if (existingIndex >= 0) {
        record = { ...state.attendance[existingIndex], observation };
    } else {
       record = {
           id: Math.random().toString(36).substr(2, 9),
           studentId, date: attendanceDate,
           status: 'Present',
           observation
       };
    }
    await api.saveAttendance(record);
    let newAttendance = [...state.attendance];
    if (existingIndex >= 0) newAttendance[existingIndex] = record;
    else newAttendance.push(record);
    setState(prev => ({...prev, attendance: newAttendance}));
  };

  // Health Docs
  const handleSaveDocument = async () => {
    if (!newDoc.studentId || !newDoc.dateIssued) {
      alert("Selecione um aluno e a data do documento.");
      return;
    }
    const docToSave = { ...newDoc, id: newDoc.id || Math.random().toString(36).substr(2, 9) };
    await api.saveDocument(docToSave);
    setState(prev => ({...prev, documents: [...prev.documents, docToSave]}));
    setNewDoc({ id: '', studentId: '', type: DocType.MEDICAL_REPORT, description: '', dateIssued: '' });
  };

  const handleDeleteDocument = (id: string) => {
    requestConfirm("Excluir Documento", "Tem certeza que deseja excluir este documento?", async () => {
      await api.deleteDocument(id);
      setState(prev => ({...prev, documents: (prev.documents || []).filter(d => d.id !== id)}));
      closeConfirm();
    });
  };

  // Exams
  const handleSaveExam = async () => {
    if (!newExam.studentId || !newExam.subject || !newExam.originalDate) {
      alert("Preencha Aluno, Matéria e Data Original da Prova.");
      return;
    }
    const examToSave = { ...newExam, id: newExam.id || Math.random().toString(36).substr(2, 9) };
    await api.saveExam(examToSave);
    setState(prev => ({...prev, exams: [...prev.exams, examToSave]}));
    setNewExam({ id: '', studentId: '', subject: '', originalDate: '', reason: '', status: 'Pending', period: '1ª Bi' });
  };

  const handleUpdateExamStatus = async (id: string, status: 'Pending' | 'Completed' | 'Cancelled') => {
    const exam = state.exams.find(e => e.id === id);
    if (exam) {
      const updatedExam = { ...exam, status };
      await api.saveExam(updatedExam);
      setState(prev => ({...prev, exams: prev.exams.map(e => e.id === id ? updatedExam : e)}));
    }
  };

  const handleDeleteExam = (id: string) => {
    requestConfirm("Excluir Agendamento", "Deseja mesmo remover este agendamento de prova?", async () => {
      await api.deleteExam(id);
      setState(prev => ({...prev, exams: (prev.exams || []).filter(e => e.id !== id)}));
      closeConfirm();
    });
  };

  const handleAddSubject = async () => {
    if (newSubjectName && !state.subjects.includes(newSubjectName)) {
      const newSubjects = [...state.subjects, newSubjectName];
      await api.updateSubjects(newSubjects);
      setState(prev => ({ ...prev, subjects: newSubjects }));
      setNewSubjectName("");
    }
  };

  const handleRemoveSubject = (subject: string) => {
    requestConfirm("Remover Matéria", `Tem certeza que deseja remover a matéria "${subject}" do catálogo?`, async () => {
      const newSubjects = (state.subjects || []).filter(s => s !== subject);
      await api.updateSubjects(newSubjects);
      setState(prev => ({ ...prev, subjects: newSubjects }));
      closeConfirm();
    });
  };

  // Pedagogical Actions
  const handleSavePedagogical = async (record: any) => {
    const savedRecord = await api.savePedagogicalRecord(record);
    setState(prev => {
        const exists = (prev.pedagogicalRecords || []).find(r => r.id === savedRecord.id);
        if (exists) {
            return { ...prev, pedagogicalRecords: (prev.pedagogicalRecords || []).map(r => r.id === savedRecord.id ? savedRecord : r) };
        } else {
            return { ...prev, pedagogicalRecords: [...(prev.pedagogicalRecords || []), savedRecord] };
        }
    });
  };

  const handleDeletePedagogical = async (id: string) => {
    await api.deletePedagogicalRecord(id);
    setState(prev => ({
        ...prev,
        pedagogicalRecords: (prev.pedagogicalRecords || []).filter(r => r.id !== id)
    }));
  };

  // Users
  const handleSaveUser = async () => {
    if (!tempUser.name || !tempUser.email || ( !tempUser.id && !tempUser.password )) {
      alert("Por favor, preencha Nome, Email e Senha para novos usuários.");
      return;
    }
    setIsLoading(true);
    let userToSave = {...tempUser};
    if (!userToSave.id) {
        userToSave.id = Math.random().toString(36).substr(2, 9);
        userToSave.photoUrl = userToSave.photoUrl || `https://ui-avatars.com/api/?name=${userToSave.name}&background=random`;
    }
    const savedUser = await api.saveUser(userToSave);
    setState(prev => {
        const exists = prev.users.find(u => u.id === savedUser.id);
        if (exists) return { ...prev, users: prev.users.map(u => u.id === savedUser.id ? savedUser : u) };
        return { ...prev, users: [...prev.users, savedUser] };
    });
    setTempUser(createEmptyUser());
    setIsEditingUser(false);
    setIsLoading(false);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) {
      alert("Você não pode excluir seu próprio usuário.");
      return;
    }
    requestConfirm("Excluir Usuário", "Tem certeza que deseja excluir este usuário?", async () => {
      setIsLoading(true);
      await api.deleteUser(id);
      setState(prev => ({ ...prev, users: (prev.users || []).filter(u => u.id !== id) }));
      setIsLoading(false);
      closeConfirm();
    });
  };

  const handleUserPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
          const currentId = tempUser.id || Math.random().toString(36).substr(2, 9);
          const photoUrl = await api.uploadPhoto(file, 'user', currentId);
          setTempUser(prev => ({ ...prev, id: currentId, photoUrl: photoUrl }));
      } catch (err) {
          console.error("Failed to upload user photo", err);
          alert("Erro ao enviar foto de usuário.");
      }
    }
  };

  // Imports
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const delimiter = text.includes(';') ? ';' : ',';
        const lines = text.split('\n');
        const dataLines = lines.slice(1).filter(line => line.trim() !== '');
        let successCount = 0;
        let failCount = 0;
        const processedStudents: Student[] = [];

        // Map for fast lookup of existing students
        const existingStudentsMap = new Map<string, Student>();
        state.students.forEach(s => existingStudentsMap.set(s.registration, s));

        for (const line of dataLines) {
           const cols = line.split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
           if (cols.length >= 8) {
               const gradeCode = cols[0];
               const shiftRaw = cols[1];
               const registration = cols[2];
               const name = cols[3];
               const birthDateRaw = cols[4];
               const sequenceNumber = cols[5];
               const motherPhone = cols[6];
               const motherName = cols[7];
               const grade = IMPORT_GRADE_MAP[gradeCode] || "Não Identificado";
               let shift: Shift = 'Manhã';
               if (shiftRaw.trim().toUpperCase() === 'T' || shiftRaw.trim().toUpperCase() === 'TARDE') {
                   shift = 'Tarde';
               }
               let birthDate = '';
               if (birthDateRaw.includes('/')) {
                   const [day, month, year] = birthDateRaw.split('/');
                   birthDate = `${year}-${month}-${day}`;
               } else {
                   birthDate = birthDateRaw;
               }

               // Check if student exists
               const existingStudent = existingStudentsMap.get(registration);

               const studentToSave: Student = {
                   id: existingStudent ? existingStudent.id : Math.random().toString(36).substr(2, 9),
                   name, registration, sequenceNumber, birthDate, grade, shift,
                   email: existingStudent?.email || '',
                   fatherName: existingStudent?.fatherName || '',
                   fatherPhone: existingStudent?.fatherPhone || '',
                   motherName, motherPhone,
                   guardians: existingStudent?.guardians || [],
                   bookStatus: existingStudent?.bookStatus || 'Nao Comprou',
                   peStatus: existingStudent?.peStatus || 'Pendente',
                   turnstileRegistered: existingStudent?.turnstileRegistered || false,
                   photoUrl: existingStudent?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
               };

               try {
                   const saved = await api.saveStudent(studentToSave);
                   processedStudents.push(saved);
                   successCount++;
               } catch (err) { failCount++; }
           } else { failCount++; }
        }

        // Optimistically update state
        setState(prev => {
            const currentStudents = [...prev.students];
            processedStudents.forEach(processed => {
                const index = currentStudents.findIndex(s => s && s.id === processed.id);
                if (index !== -1) {
                    currentStudents[index] = processed;
                } else {
                    currentStudents.push(processed);
                }
            });
            return { ...prev, students: currentStudents };
        });
        alert(`Importação concluída!\nSucesso: ${successCount}\nFalhas/Ignorados: ${failCount}`);
      } catch (error: any) {
        alert("Erro fatal na importação: " + error.message);
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file, 'ISO-8859-1');
  };

  const handleImportPhones = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingPhones(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n');

        let updatedCount = 0;
        let notFoundCount = 0;
        let duplicateReport: string[] = [];
        const phoneMap = new Map<string, string[]>(); // phone -> [matriculas]

        const studentsToUpdate: Student[] = [];

        // Pre-fetch all students for faster lookup
        const studentMap = new Map<string, Student>();
        state.students.forEach(s => studentMap.set(s.registration.trim(), s));

        // FORMAT: Matrícula|-GS-|Nome|Mãe|Pai|Responsável|
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Skip empty lines, header lines, or separator lines
            if (!trimmedLine || trimmedLine.startsWith('Matrícula') || trimmedLine.startsWith('---')) continue;

            // Split by pipe
            let parts = trimmedLine.split('|').map(p => p.trim());

            // Handle leading pipe (results in first element being empty)
            // e.g. "| 123 |" -> ["", "123", ""]
            if (trimmedLine.startsWith('|')) {
                parts.shift();
            }

            if (parts.length < 4) continue; // Minimum required columns

            const matricula = parts[0];
            const motherPhoneRaw = parts[3] || "";
            const fatherPhoneRaw = parts[4] || "";
            const responsiblePhoneRaw = parts[5] || "";

            if (!matricula) continue;

            const student = studentMap.get(matricula);

            if (student) {
                let changed = false;
                let newMotherPhone = student.motherPhone;
                let newFatherPhone = student.fatherPhone;

                // Helper to validate and clean phone
                const isValidPhone = (p: string) => {
                    // Reject if contains any letters (avoids Names being saved as phones)
                    if (/[a-zA-Z]/.test(p)) return false;
                    const digits = p.replace(/\D/g, '');
                    return digits.length >= 8;
                };

                // Process Mother Phone
                if (motherPhoneRaw && isValidPhone(motherPhoneRaw)) {
                     if (phoneMap.has(motherPhoneRaw)) {
                         phoneMap.get(motherPhoneRaw)?.push(matricula);
                     } else {
                         phoneMap.set(motherPhoneRaw, [matricula]);
                     }

                     if (newMotherPhone !== motherPhoneRaw) {
                         newMotherPhone = motherPhoneRaw;
                         changed = true;
                     }
                }

                // Process Father Phone
                if (fatherPhoneRaw && isValidPhone(fatherPhoneRaw)) {
                     if (phoneMap.has(fatherPhoneRaw)) {
                         phoneMap.get(fatherPhoneRaw)?.push(matricula);
                     } else {
                         phoneMap.set(fatherPhoneRaw, [matricula]);
                     }

                     if (newFatherPhone !== fatherPhoneRaw) {
                         newFatherPhone = fatherPhoneRaw;
                         changed = true;
                     }
                }

                // Note: We don't have a specific "Responsible Phone" field in Student type currently
                // mapped to UI (only guardians list).
                // For now, we prioritize Father/Mother columns.
                // If Responsible column exists and Father is empty, we could potentially map it,
                // but let's stick to the requested explicit mapping first.

                if (changed) {
                    studentsToUpdate.push({
                        ...student,
                        motherPhone: newMotherPhone,
                        fatherPhone: newFatherPhone
                    });
                }
            } else {
                notFoundCount++;
            }
        }

        // Save updates
        for (const s of studentsToUpdate) {
             await api.saveStudent(s);
             updatedCount++;
        }

        // Generate duplicate report
        phoneMap.forEach((matriculas, phone) => {
            const uniqueMatriculas = Array.from(new Set(matriculas));
            if (uniqueMatriculas.length > 1) {
                duplicateReport.push(`Número ${phone} compartilhado por: ${uniqueMatriculas.join(', ')}`);
            }
        });

        // Update local state
        if (studentsToUpdate.length > 0) {
            setState(prev => {
                const newStudentsList = prev.students.map(s => {
                    if (!s) return s;
                    const updated = studentsToUpdate.find(u => u && u.id === s.id);
                    return updated || s;
                });
                return { ...prev, students: newStudentsList };
            });
        }

        let msg = `Importação de telefones concluída!\nAtualizados: ${updatedCount}\nNão encontrados (Matrícula): ${notFoundCount}`;
        if (duplicateReport.length > 0) {
            msg += `\n\nATENÇÃO: Números repetidos encontrados:\n` + duplicateReport.slice(0, 10).join('\n') + (duplicateReport.length > 10 ? '\n... (verifique os dados)' : '');
        }

        alert(msg);

      } catch (error: any) {
        console.error("Phone import failed", error);
        alert("Erro na importação de telefones: " + error.message);
      } finally {
        setIsImportingPhones(false);
        e.target.value = '';
      }
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  const handleImportTurnstile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingTurnstile(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n');
        
        let successCount = 0;
        let notFoundCount = 0;
        let processedCount = 0;
        let autoAbsenceCount = 0;
        let skippedDateCount = 0;

        // Get local date string for "Today" (YYYY-MM-DD)
        const today = new Date();
        const todayISO = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');

        // Create a normalized map for matching students
        // ENFORCE UNIQUE MATRICULA: Priority given to exact matches, then normalized.
        // If duplicates exist, the map will store the last processed student.
        const studentMap = new Map<string, Student>();
        
        state.students.forEach(s => {
             // 1. Normalize registration (remove leading zeros)
             const regInt = parseInt(s.registration, 10);
             const normalizedReg = !isNaN(regInt) ? regInt.toString() : s.registration.trim();
             
             // 2. Store normalized key. 
             // This effectively makes the Matricula the unique ID for lookup purposes.
             studentMap.set(normalizedReg, s);
             
             // 3. Also store exact string just in case normalization fails or differs
             if (s.registration !== normalizedReg) {
                 studentMap.set(s.registration, s);
             }
        });
        
        const pendingUpdates = new Map<string, AttendanceRecord>();
        const presentStudentsByDate = new Map<string, Set<string>>(); // Date -> Set<StudentId>
        const shiftsProcessedByDate = new Map<string, { morning: boolean, afternoon: boolean }>(); // Date -> Flags

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const cols = trimmed.split(';');
            if (cols.length < 6) continue;
            
            // Format: ID;Matrícula;Code;Date;Time;Turnstile
            // Example: 03549;00001018;111;29012026;1042;01
            const matriculaRaw = cols[1].trim();
            const code = cols[2].trim();
            const dateRaw = cols[3].trim(); 
            const timeRaw = cols[4].trim(); 
            
            // Find Student with Robust Matching
            // 1. Try exact match
            let student = studentMap.get(matriculaRaw);
            
            // 2. If not found, try stripping leading zeros from the file input
            if (!student) {
                const matriculaInt = parseInt(matriculaRaw, 10);
                if (!isNaN(matriculaInt)) {
                   student = studentMap.get(matriculaInt.toString());
                }
            }
            
            if (!student) {
                // Debug log for developer matching issues
                console.log(`Student not found for matricula: ${matriculaRaw}`);
                notFoundCount++;
                continue;
            }
            
            // Parse Date
            // Handle both DDMMYYYY and DD/MM/YYYY
            let dateISO = '';
            if (dateRaw.includes('/')) {
                const parts = dateRaw.split('/');
                if (parts.length === 3) {
                   dateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
            } else if (dateRaw.length === 8) {
                const day = dateRaw.substring(0, 2);
                const month = dateRaw.substring(2, 4);
                const year = dateRaw.substring(4, 8);
                dateISO = `${year}-${month}-${day}`;
            }

            if (!dateISO) continue; // Invalid date format
            
            // STRICT DATE FILTER: Only process records for TODAY
            if (dateISO !== todayISO) {
                skippedDateCount++;
                continue;
            }
            
            // Track presence
            if (!presentStudentsByDate.has(dateISO)) {
                presentStudentsByDate.set(dateISO, new Set());
                shiftsProcessedByDate.set(dateISO, { morning: false, afternoon: false });
            }
            presentStudentsByDate.get(dateISO)?.add(student.id);

            // Parse Time & Detect Shift Activity
            // Handle HHMM (1042) or HH:MM (10:42)
            const cleanTime = timeRaw.replace(':', '');
            const timeInt = parseInt(cleanTime, 10);
            
            if (!isNaN(timeInt)) {
                const flags = shiftsProcessedByDate.get(dateISO)!;
                // Morning: 06:00 (600) to 12:40 (1240)
                if (timeInt <= 1240) flags.morning = true;
                // Afternoon: 12:41 (1241) to 18:40 (1840)
                if (timeInt > 1240) flags.afternoon = true;
            }

            let timeFormatted = timeRaw;
            if (timeRaw.length === 4 && !timeRaw.includes(':')) {
                timeFormatted = `${timeRaw.substring(0, 2)}:${timeRaw.substring(2, 4)}`;
            }
            
            const key = `${student.id}_${dateISO}`;
            
            let record = pendingUpdates.get(key);
            if (!record) {
                const existing = state.attendance.find(a => a.studentId === student!.id && a.date === dateISO);
                if (existing) {
                    record = { ...existing };
                } else {
                    record = {
                        id: Math.random().toString(36).substr(2, 9),
                        studentId: student.id,
                        date: dateISO,
                        status: 'Present',
                        observation: ''
                    };
                }
            }
            
            const newObs = `Catraca (${code}) ${timeFormatted}`;
            
            if (record.observation) {
                if (!record.observation.includes(newObs)) {
                   record.observation += ` | ${newObs}`;
                }
            } else {
                record.observation = newObs;
            }
            
            record.status = 'Present';
            
            pendingUpdates.set(key, record);
            processedCount++;
            successCount++;
        }

        // --- AUTOMATIC ABSENCE LOGIC ---
        // For each date found in the import file, check all active students.
        // If a student is NOT in the present set for that date, mark them as Absent.
        // BUT ONLY IF the file contains data for their specific shift.
        presentStudentsByDate.forEach((presentSet, dateISO) => {
            const shiftFlags = shiftsProcessedByDate.get(dateISO);
            
            state.students.forEach(student => {
                // Determine if we should process this student's absence
                let shouldProcess = false;
                const studentShift = (student.shift || '').trim().toLowerCase();

                if ((studentShift === 'manhã' || studentShift === 'manha') && shiftFlags?.morning) shouldProcess = true;
                if ((studentShift === 'tarde' || studentShift === 'vespertino') && shiftFlags?.afternoon) shouldProcess = true;

                if (shouldProcess && !presentSet.has(student.id)) {
                    // Student was NOT in the turnstile file for this date AND we have data for their shift
                    const key = `${student.id}_${dateISO}`;
                    
                    // Check if we already have a pending update
                    if (!pendingUpdates.has(key)) {
                        // Check existing record in state
                        const existing = state.attendance.find(a => a.studentId === student.id && a.date === dateISO);
                        
                        // STRICT OVERWRITE POLICY:
                        // Only create a new Absent record if NO record exists.
                        if (!existing) {
                            pendingUpdates.set(key, {
                                id: Math.random().toString(36).substr(2, 9),
                                studentId: student.id,
                                date: dateISO,
                                status: 'Absent',
                                observation: 'Ausência automática (Catraca)'
                            });
                            autoAbsenceCount++;
                        }
                    }
                }
            });
        });
        
        for (const record of pendingUpdates.values()) {
             await api.saveAttendance(record);
        }
        
        setState(prev => {
            const newAttendance = [...prev.attendance];
            pendingUpdates.forEach(record => {
                const idx = newAttendance.findIndex(a => a.id === record.id);
                if (idx >= 0) {
                    newAttendance[idx] = record;
                } else {
                    newAttendance.push(record);
                }
            });
            return { ...prev, attendance: newAttendance };
        });

        let msg = `Importação de Catraca Concluída!\n\nLinhas Processadas (Hoje): ${processedCount}\nPresenças Registradas: ${successCount}\nFaltas Automáticas Geradas: ${autoAbsenceCount}\nNão Encontrados: ${notFoundCount}`;
        
        if (skippedDateCount > 0) {
            msg += `\n\nATENÇÃO: ${skippedDateCount} registros de datas diferentes de hoje (${todayISO.split('-').reverse().join('/')}) foram ignorados.`;
        } else if (processedCount === 0 && lines.length > 0) {
             msg += `\n\nATENÇÃO: Nenhum registro encontrado para a data de hoje (${todayISO.split('-').reverse().join('/')}). Verifique a data do arquivo.`;
        }
        
        alert(msg);

      } catch (error: any) {
        console.error("Turnstile import failed", error);
        alert("Erro na importação: " + error.message);
      } finally {
        setIsImportingTurnstile(false);
        e.target.value = '';
      }
    };
    
    reader.readAsText(file);
  };

  const handleBatchPhotoImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsImportingPhotos(true);
    let successCount = 0;
    let notFoundCount = 0;

    // Create a map for faster lookup: Registration -> Student Object
    const studentMap = new Map<string, Student>();
    state.students.forEach(s => studentMap.set(s.registration, s));

    const updatedStudents: Student[] = [];

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Security check: ensure it is an image
            if (!file.type.startsWith('image/')) continue;

            // Extract registration from filename (remove extension)
            // Example: "0001.bmp" -> "0001"
            const fileName = file.name;
            const lastDotIndex = fileName.lastIndexOf('.');
            const registration = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

            // Check if student exists
            const student = studentMap.get(registration);

            if (student) {
                try {
                    // Try to upload via API first (saves to folder)
                    // If that fails or we are in sqlite mode, it returns base64
                    const uploadedUrl = await api.uploadPhoto(file, 'student', student.id);
                    const updatedStudent = { ...student, photoUrl: uploadedUrl };

                    // Save to API
                    await api.saveStudent(updatedStudent);
                    updatedStudents.push(updatedStudent);
                    successCount++;
                } catch (err) {
                    console.error(`Erro ao processar foto ${fileName}`, err);
                }
            } else {
                notFoundCount++;
            }
        }

        // Update local state with all changes
        if (updatedStudents.length > 0) {
            setState(prev => {
                const newStudentsList = prev.students.map(s => {
                    const updated = updatedStudents.find(u => u.id === s.id);
                    return updated || s;
                });
                return { ...prev, students: newStudentsList };
            });
        }

        alert(`Processamento de pasta concluído!\nAssociadas com sucesso: ${successCount}\nNão encontradas (Matrícula inexistente): ${notFoundCount}`);

    } catch (error: any) {
        console.error("Batch photo import error", error);
        alert("Erro ao importar fotos: " + error.message);
    } finally {
        setIsImportingPhotos(false);
        e.target.value = ''; // Reset input
    }
  };

  // Print Logic
  const handlePrint = () => {
    let title = "Relatório Escolar";
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    // Filter Logic Replicated for Printing to ensure WYSIWYG based on current filters
    if (view === 'students') {
      title = "Relatório de Alunos";
      headers = ["Matrícula", "Nome Completo", "Série", "Turno", "Livro", "Ed. Física", "Responsáveis"];

      rows = filteredStudents.map(s => [
        s.registration,
        s.name,
        s.grade,
        s.shift,
        s.bookStatus,
        s.peStatus,
        `Pai: ${s.fatherName} / Mãe: ${s.motherName}`
      ]);

    } else if (view === 'attendance') {
      title = `Relatório de Frequência - ${new Date(attendanceDate).toLocaleDateString('pt-BR')}`;
      headers = ["Matrícula", "Nome", "Série", "Status", "Observação"];

      const filtered = (state.students || [])
        .filter(s => {
            const matchClass = selectedClass === "" || s.grade === selectedClass;
            const matchShift = selectedShift === "" || s.shift === selectedShift;

            const record = state.attendance.find(a => a.studentId === s.id && a.date === attendanceDate);
            const currentStatus = record ? record.status : 'Present';
            const matchStatus = filterAttendanceStatus === "" || currentStatus === filterAttendanceStatus;

            return matchClass && matchShift && matchStatus;
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

      rows = filtered.map(student => {
        const record = state.attendance.find(a => a.studentId === student.id && a.date === attendanceDate);
        const statusMap: any = { 'Present': 'Presente', 'Absent': 'Falta', 'Excused': 'Justificado' };
        const status = record ? statusMap[record.status] : 'Presente';
        return [
          student.registration,
          student.name,
          student.grade,
          status,
          record?.observation || '-'
        ];
      });

    } else if (view === 'health') {
      title = "Relatório de Documentos de Saúde";
      headers = ["Aluno", "Série", "Tipo", "Data Emissão", "Descrição"];

      const filteredDocs = (state.documents || []).filter(doc => {
        const student = (state.students || []).find(s => s.id === doc.studentId);
        if (!student) return false;
        const matchesGrade = filterDocGrade ? student.grade === filterDocGrade : true;
        const matchesShift = filterDocShift ? student.shift === filterDocShift : true;
        const matchesType = filterDocType ? doc.type === filterDocType : true;
        const isStudentVisible = getVisibleStudents.some(s => s.id === student.id);
        return matchesGrade && matchesShift && matchesType && isStudentVisible;
      });

      rows = filteredDocs.map(doc => {
        const student = state.students.find(s => s.id === doc.studentId);
        return [
          student?.name || '?',
          `${student?.grade} - ${student?.shift}`,
          doc.type,
          new Date(doc.dateIssued).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          doc.description || '-'
        ];
      });

    } else if (view === 'exams') {
      title = "Relatório de 2ª Chamada";
      headers = ["Aluno", "Série", "Matéria", "Período", "Data Original", "Status"];

      const filteredExams = (state.exams || []).filter(exam => {
        const student = (state.students || []).find(s => s.id === exam.studentId);
        if (!student) return false;
        const matchesGrade = filterExamGrade ? student.grade === filterExamGrade : true;
        const matchesShift = filterExamShift ? student.shift === filterExamShift : true;
        const isStudentVisible = getVisibleStudents.some(s => s.id === student.id);
        return matchesGrade && matchesShift && isStudentVisible;
      });

      rows = filteredExams.map(exam => {
        const student = state.students.find(s => s.id === exam.studentId);
        const statusMap: any = { 'Pending': 'Pendente', 'Completed': 'Concluída', 'Cancelled': 'Cancelada' };
        return [
          student?.name || '?',
          student?.grade || '?',
          exam.subject,
          exam.period || '-',
          new Date(exam.originalDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
          statusMap[exam.status]
        ];
      });
    } else {
      // Dashboard or other views -> Default browser print
      window.print();
      return;
    }

    // --- HTML GENERATION ---
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4; margin: 1cm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 24px; color: #4f46e5; }
            .header h2 { margin: 5px 0; font-size: 18px; font-weight: normal; }
            .header p { margin: 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f3f4f6; color: #111; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #e5e7eb; }
            td { padding: 8px 10px; border: 1px solid #e5e7eb; vertical-align: top; }
            tr:nth-child(even) { background-color: #f9fafb; }
            tr { page-break-inside: avoid; }
            .footer { margin-top: 30px; text-align: right; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${appTitle}</h1>
            <h2>${title}</h2>
            <p>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
          <div class="footer">
            ${appTitle} • Página gerada automaticamente
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        // Optional: printWindow.close();
    };
  };

  const handleExportStudents = () => {
    const headers = "Nome,Matrícula,Série,Turno,Email,Pai,Telefone Pai,Mãe,Telefone Mãe\n";
    const rows = filteredStudents.map(s =>
        `"${s.name}","${s.registration}","${s.grade}","${s.shift}","${s.email}","${s.fatherName}","${s.fatherPhone}","${s.motherName}","${s.motherPhone}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `alunos_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPhoneTemplate = () => {
      const header = "Matrícula|-GS-|Nome|Mãe|Pai|Responsável|";
      const example1 = "2024001|-GS-|João Silva|999999999|888888888||";
      const example2 = "2024002|-GS-|Maria Souza||888888888||";
      const content = [header, example1, example2].join("\n");

      const blob = new Blob(["\uFEFF" + content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "modelo_telefones.txt");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };


  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center">
            <RefreshCw size={48} className="text-indigo-600 animate-spin mb-4" />
            <h2 className="text-slate-600 dark:text-slate-400 font-medium">Carregando Gestor de Alunos...</h2>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/10">
           <div className="text-center mb-8">
              {appLogo ? (
                <img src={appLogo} alt="Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
              ) : (
                <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-inner">
                  <LayoutDashboard size={40} />
                </div>
              )}
              <h1 className="text-3xl font-bold text-white mb-2">{appTitle}</h1>
              <p className="text-slate-300">Gestão Escolar</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-6">
              <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Email</label>
                  <Input 
                    type="email" 
                    placeholder="admin@escola.com" 
                    value={loginEmail} 
                    onChange={e => setLoginEmail(e.target.value)} 
                    required 
                    autoFocus
                    className="!bg-white/5 !border-white/10 !text-white focus:!bg-white/10 placeholder:text-slate-500"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">Senha</label>
                  <Input 
                    type="password" 
                    placeholder="••••••" 
                    value={loginPass} 
                    onChange={e => setLoginPass(e.target.value)} 
                    required 
                    className="!bg-white/5 !border-white/10 !text-white focus:!bg-white/10 placeholder:text-slate-500"
                  />
              </div>
              
              {loginError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center">
                      <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                      {loginError}
                  </div>
              )}

              <Button type="submit" className="w-full py-3 text-lg shadow-lg shadow-indigo-500/30">
                  Entrar no Sistema
              </Button>
           </form>
           <p className="text-center text-xs text-slate-400 mt-6">
               Versão 2.5 • Powered by Gemini AI
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-200 font-sans text-slate-900 dark:text-slate-100 ${isDarkMode ? 'dark' : ''}`}>
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
              <div className="flex items-center space-x-3">
                  {appLogo ? (
                      <img src={appLogo} alt="App Logo" className="w-10 h-10 object-contain" />
                  ) : (
                      <div className="bg-indigo-500 p-2 rounded-lg text-white shadow-lg shadow-indigo-500/20">
                          <LayoutDashboard size={24} />
                      </div>
                  )}
                  <span className="font-bold text-xl text-white tracking-tight">{appTitle}</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                  <X size={24} />
              </button>
          </div>

          <div className="p-4 space-y-2">
              <SidebarItem icon={LayoutDashboard} label="Painel Geral" active={view === 'dashboard'} onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Users} label="Alunos" active={view === 'students'} onClick={() => { setView('students'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={CalendarCheck} label="Frequência" active={view === 'attendance'} onClick={() => { setView('attendance'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={FileText} label="Documentos Saúde" active={view === 'health'} onClick={() => { setView('health'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={ClipboardList} label="2ª Chamada" active={view === 'exams'} onClick={() => { setView('exams'); setIsSidebarOpen(false); }} />
              <SidebarItem icon={Bot} label="Relatórios IA" active={view === 'reports'} onClick={() => { setView('reports'); setIsSidebarOpen(false); }} />
              
              {(currentUser.role === 'Admin' || currentUser.role === 'Coordinator') && (
                  <SidebarItem icon={GraduationCap} label="Pedagógico" active={view === 'pedagogical'} onClick={() => { setView('pedagogical'); setIsSidebarOpen(false); }} />
              )}

              {currentUser.role === 'Admin' && (
                  <>
                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Administração</p>
                    </div>
                    <SidebarItem icon={UserCog} label="Usuários" active={view === 'users'} onClick={() => { setView('users'); setIsSidebarOpen(false); }} />
                  </>
              )}
          </div>
          
          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800 bg-slate-900">
               <button onClick={handleResetSystem} className="flex items-center space-x-2 text-xs text-red-400 hover:text-red-300 w-full px-4 py-2 hover:bg-red-900/20 rounded transition-colors mb-2">
                   <AlertTriangle size={14} />
                   <span>Resetar Sistema</span>
               </button>
               <div className="text-center text-[10px] text-slate-600">
                   Gestor de Alunos v2.5 © 2024
               </div>
          </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen relative">
          {/* Topbar */}
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center print:hidden">
              <div className="flex items-center">
                  <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-slate-600 dark:text-slate-300">
                      <Menu size={24} />
                  </button>
                  <Breadcrumbs
                    view={view}
                    setView={setView}
                    selectedStudent={selectedStudent}
                    setSelectedStudent={setSelectedStudent}
                    isEditingStudent={isEditingStudent}
                    setIsEditingStudent={setIsEditingStudent}
                    isEditingUser={isEditingUser}
                    setIsEditingUser={setIsEditingUser}
                    tempStudent={tempStudent}
                    tempUser={tempUser}
                  />
              </div>

              <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                      syncStatus === 'online' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                      syncStatus === 'offline' ? 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700' :
                      'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                  }`}>
                      {syncStatus === 'online' ? <Wifi size={14} className="mr-1.5" /> : <WifiOff size={14} className="mr-1.5" />}
                      <span className="hidden sm:inline">
                          {syncStatus === 'online' ? 'Online' : syncStatus === 'offline' ? 'Offline' : 'Erro de Sync'}
                      </span>
                  </div>

                  <button 
                    onClick={handleManualSync} 
                    className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors ${isSyncing ? 'animate-spin text-indigo-500' : ''}`}
                    title="Sincronizar Agora"
                  >
                      <RefreshCw size={20} />
                  </button>

                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                    title="Configurações do Sistema"
                  >
                      <Settings size={20} />
                  </button>

                  <button 
                    onClick={toggleTheme} 
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                  >
                      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  </button>

                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>
                  
                  <div className="flex items-center space-x-3">
                      <div className="text-right hidden sm:block">
                          <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{currentUser.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {currentUser.role === 'Admin' ? 'Administrador' : currentUser.role === 'Coordinator' ? 'Coordenador' : 'Professor'}
                          </p>
                      </div>
                      <img 
                        src={currentUser.photoUrl} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full border-2 border-indigo-100 dark:border-indigo-900 object-cover" 
                      />
                      <button 
                        onClick={handleLogout}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" 
                        title="Sair"
                      >
                          <LogOut size={20} />
                      </button>
                  </div>
              </div>
          </header>

          <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
             {view === 'dashboard' && (
                <DashboardView
                    state={state}
                    visibleStudents={getVisibleStudents}
                    handlePrint={handlePrint}
                    setView={setView}
                    onSelectStudent={setSelectedStudent}
                />
             )}

             {view === 'students' && (
                 <>
                    {isEditingStudent ? (
                        <StudentEditView
                            student={tempStudent}
                            setStudent={setTempStudent}
                            visibleGradesList={visibleGradesList}
                            isUploadingPhoto={isUploadingPhoto}
                            onPhotoUpload={handlePhotoUpload}
                            onSave={handleSaveStudent}
                            onCancel={() => setIsEditingStudent(false)}
                        />
                    ) : selectedStudent ? (
                        <StudentDetailView
                            student={selectedStudent}
                            state={state}
                            currentUser={currentUser}
                            onEdit={handleEditStudent}
                            onDelete={handleDeleteStudent}
                            onBack={() => setSelectedStudent(null)}
                            setView={setView}
                        />
                    ) : (
                        <StudentListView
                            students={filteredStudents}
                            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                            filterGrade={filterGrade} setFilterGrade={setFilterGrade}
                            filterShift={filterShift} setFilterShift={setFilterShift}
                            filterBookStatus={filterBookStatus} setFilterBookStatus={setFilterBookStatus}
                            filterPEStatus={filterPEStatus} setFilterPEStatus={setFilterPEStatus}
                            filterTurnstile={filterTurnstile} setFilterTurnstile={setFilterTurnstile}
                            visibleGradesList={visibleGradesList}
                            currentUser={currentUser}
                            onNewStudent={() => { setTempStudent(createEmptyStudent()); setIsEditingStudent(true); }}
                            onPrint={handlePrint}
                            onExport={handleExportStudents}
                            onImportCSV={handleImportCSV}
                            onImportPhotos={handleBatchPhotoImport}
                            onImportPhones={handleImportPhones}
                            onDownloadPhoneTemplate={handleDownloadPhoneTemplate}
                            isImporting={isImporting}
                            isImportingPhotos={isImportingPhotos}
                            isImportingPhones={isImportingPhones}
                            onSelectStudent={setSelectedStudent}
                            attendance={state.attendance}
                            onToggleAbsence={handleToggleAbsence}
                            onToggleBook={handleToggleBookStatus}
                            onTogglePE={handleTogglePEStatus}
                            onToggleTurnstile={handleToggleTurnstile}
                        />
                    )}
                 </>
             )}

             {view === 'attendance' && (
                 <AttendanceView
                    students={state.students}
                    attendance={state.attendance}
                    attendanceDate={attendanceDate}
                    setAttendanceDate={setAttendanceDate}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    selectedShift={selectedShift}
                    setSelectedShift={setSelectedShift}
                    filterAttendanceStatus={filterAttendanceStatus}
                    setFilterAttendanceStatus={setFilterAttendanceStatus}
                    visibleGradesList={visibleGradesList}
                    currentUser={currentUser}
                    onPrint={handlePrint}
                    onUpdateStatus={handleAttendanceUpdate}
                    onUpdateObservation={handleAttendanceObservation}
                    onImportTurnstile={handleImportTurnstile}
                    isImportingTurnstile={isImportingTurnstile}
                    onSelectStudent={setSelectedStudent}
                    setView={setView}
                 />
             )}

             {view === 'health' && (
                 <HealthView
                    students={getVisibleStudents}
                    documents={state.documents}
                    newDoc={newDoc}
                    setNewDoc={setNewDoc}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    filterDocGrade={filterDocGrade}
                    setFilterDocGrade={setFilterDocGrade}
                    filterDocShift={filterDocShift}
                    setFilterDocShift={setFilterDocShift}
                    filterDocType={filterDocType}
                    setFilterDocType={setFilterDocType}
                    visibleGradesList={visibleGradesList}
                    onSaveDocument={handleSaveDocument}
                    onDeleteDocument={handleDeleteDocument}
                    onPrint={handlePrint}
                 />
             )}

             {view === 'exams' && (
                 <ExamView
                    students={state.students}
                    exams={state.exams}
                    subjects={state.subjects}
                    newExam={newExam}
                    setNewExam={setNewExam}
                    newSubjectName={newSubjectName}
                    setNewSubjectName={setNewSubjectName}
                    filterExamGrade={filterExamGrade}
                    setFilterExamGrade={setFilterExamGrade}
                    filterExamShift={filterExamShift}
                    setFilterExamShift={setFilterExamShift}
                    showSubjectCatalog={showSubjectCatalog}
                    setShowSubjectCatalog={setShowSubjectCatalog}
                    visibleGradesList={visibleGradesList}
                    onPrint={handlePrint}
                    onAddSubject={handleAddSubject}
                    onRemoveSubject={handleRemoveSubject}
                    onSaveExam={handleSaveExam}
                    onUpdateExamStatus={handleUpdateExamStatus}
                    onDeleteExam={handleDeleteExam}
                 />
             )}

             {view === 'reports' && (
                 <ReportView state={state} />
             )}

             {view === 'pedagogical' && (
                 (currentUser.role === 'Admin' || currentUser.role === 'Coordinator') ? (
                     <PedagogicalView
                        state={state}
                        onSaveRecord={handleSavePedagogical}
                        onDeleteRecord={handleDeletePedagogical}
                     />
                 ) : (
                     <div className="p-8 text-center text-red-500">Acesso Restrito à Coordenação</div>
                 )
             )}

             {view === 'users' && (
                 currentUser?.role === 'Admin' ? (
                     isEditingUser ? (
                        <UserEditView
                            user={tempUser}
                            setUser={setTempUser}
                            onSave={handleSaveUser}
                            onCancel={() => setIsEditingUser(false)}
                            onPhotoUpload={handleUserPhotoUpload}
                        />
                     ) : (
                        <UserManagementView
                            users={state.users}
                            currentUser={currentUser}
                            onNewUser={() => { setTempUser(createEmptyUser()); setIsEditingUser(true); }}
                            onEditUser={(u) => { setTempUser({...u}); setIsEditingUser(true); }}
                            onDeleteUser={handleDeleteUser}
                        />
                     )
                 ) : (
                    <div className="p-8 text-center text-red-500">Acesso Negado</div>
                 )
             )}
          </div>
      </main>
    </div>
  );
}
