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
import { TeacherDetailView } from './TeacherDetailView';
import { GRADES_LIST } from '@/constants';

interface CoordinationViewProps {
    state: AppState;
    currentUser: UserType;
    onRefresh: () => void;
    onSelectTeacher: (teacher: UserType | null) => void;
    selectedTeacher: UserType | null;
}

export function CoordinationView({ state, currentUser, onRefresh, onSelectTeacher, selectedTeacher }: CoordinationViewProps) {
    const [activeTab, setActiveTab] = useState<'config' | 'teachers' | 'absences' | 'drives'>('drives');

    // --- STATE: Config ---
    const [newGrade, setNewGrade] = useState('');
    const [newSubject, setNewSubject] = useState('');

    // --- STATE: Teachers ---
    const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<UserType | null>(null);
    const [teacherForm, setTeacherForm] = useState<Partial<UserType>>({
        name: '', email: '', password: '', role: 'Teacher', registration: '', photoUrl: '', classes: []
    });
    const [newTeacherClass, setNewTeacherClass] = useState<{ grade: string, subject: string, shift: Shift }>({ grade: '', subject: '', shift: 'Manhã' });
    const [teacherGradesChecked, setTeacherGradesChecked] = useState<string[]>([]);
    const [teacherSubjectsChecked, setTeacherSubjectsChecked] = useState<string[]>([]);
    const [teacherShiftsChecked, setTeacherShiftsChecked] = useState<Shift[]>([]);
    const [teacherDaysChecked, setTeacherDaysChecked] = useState<string[]>([]);
    const [teacherStartTime, setTeacherStartTime] = useState('07:30');
    const [teacherEndTime, setTeacherEndTime] = useState('12:00');

    // --- STATE: Drives ---
    const [expandedSection, setExpandedSection] = useState<CoordinationType | null>(null);
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<CoordinationRecord | null>(null);
    const [recordForm, setRecordForm] = useState<Partial<CoordinationRecord>>({
        status: 'No Prazo'
    });
    // Checklist state for multi-discipline / multi-grade form
    const [checkedSubjects, setCheckedSubjects] = useState<Record<string, string>>({}); // subject -> date
    const [checkedDocTypes, setCheckedDocTypes] = useState<string[]>([]);
    const [checkedGrades, setCheckedGrades] = useState<string[]>([]);
    const [checkedShifts, setCheckedShifts] = useState<Shift[]>([]);
    const [checkedTeachers, setCheckedTeachers] = useState<string[]>([]);
    const [checkedPeriods, setCheckedPeriods] = useState<string[]>([]);
    const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
    const [groupBy, setGroupBy] = useState<'teacher' | 'grade' | 'none'>('none');

    // --- HANDLERS: Config ---
    const handleAddGrade = async () => {
        if (!newGrade) return;
        const currentGrades = state.grades.length > 0 ? state.grades : GRADES_LIST;
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
        setTeacherGradesChecked([]);
        setTeacherSubjectsChecked([]);
        setTeacherShiftsChecked([]);
        setIsTeacherModalOpen(true);
    };

    const handleAddTeacherClass = () => {
        if (teacherGradesChecked.length > 0 && teacherSubjectsChecked.length > 0 && teacherShiftsChecked.length > 0) {
            const newClasses: TeacherClass[] = [];
            teacherGradesChecked.forEach(grade => {
                teacherSubjectsChecked.forEach(subject => {
                    teacherShiftsChecked.forEach(shift => {
                        newClasses.push({
                            id: Math.random().toString(36).substr(2, 9),
                            grade,
                            subject,
                            shift,
                            schedules: teacherDaysChecked.map(day => ({
                                dayOfWeek: day as any,
                                startTime: teacherStartTime,
                                endTime: teacherEndTime
                            }))
                        });
                    });
                });
            });
            setTeacherForm(prev => ({
                ...prev,
                classes: [...(prev.classes || []), ...newClasses]
            }));
            // Clear selections after adding
            setTeacherGradesChecked([]);
            setTeacherSubjectsChecked([]);
            setTeacherShiftsChecked([]);
            setTeacherDaysChecked([]);
            setTeacherStartTime('07:00');
            setTeacherEndTime('12:00');
        }
    };

    const handleRemoveTeacherClass = (id: string) => {
        setTeacherForm(prev => ({
            ...prev,
            classes: (prev.classes || []).filter(c => c.id !== id)
        }));
    };

    const handleEditTeacherClass = (c: TeacherClass) => {
        setTeacherGradesChecked([c.grade]);
        setTeacherSubjectsChecked([c.subject]);
        setTeacherShiftsChecked([c.shift || 'Manhã']);
        
        if (c.schedules && c.schedules.length > 0) {
            setTeacherDaysChecked(c.schedules.map(s => s.dayOfWeek));
            setTeacherStartTime(c.schedules[0].startTime);
            setTeacherEndTime(c.schedules[0].endTime);
        } else {
            setTeacherDaysChecked([]);
            setTeacherStartTime('07:00');
            setTeacherEndTime('12:00');
        }
        
        // Remove from list so it can be updated when user clicks "Vincular" again
        handleRemoveTeacherClass(c.id);
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
            } catch (err) {
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
            setRecordForm({
                id: Math.random().toString(36).substr(2, 9),
                type,
                teacherId: '',
                teacherName: '',
                grade: '',
                shift: 'Manhã',
                subject: '',
                deadline: '',
                deliveryDate: type === 'TEACHER_ABSENCE' ? new Date().toISOString().split('T')[0] : '',
                status: type === 'TEACHER_ABSENCE' ? 'Falta Injustificada' : 'No Prazo',
                fileUrl: '',
                observation: '',
                period: '',
                weekDate: '',
                isCompleted: false
            });
            setCheckedSubjects({});
            setCheckedDocTypes([]);
            setCheckedGrades([]);
            setCheckedShifts([]);
            setCheckedTeachers([]);
            setCheckedPeriods([]);
            setEditingRecord(null);
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

        if (isChecklist && !editingRecord) {
            // Save multiple records based on selection
            const teachersToUse = checkedTeachers.length > 0 ? checkedTeachers : [recordForm.teacherId!];
            const gradesToUse = checkedGrades.length > 0 ? checkedGrades : [recordForm.grade || ''];
            const shiftsToUse = checkedShifts.length > 0 ? checkedShifts : [recordForm.shift as Shift || 'Manhã'];
            const periodsToUse = checkedPeriods.length > 0 ? checkedPeriods : [recordForm.period || ''];
            const subjectEntries = Object.entries(checkedSubjects);
            
            // For Exam/Roadmap/Plan, we MUST have subjects. For others, we use the single subject field.
            const subjectsToUse = (recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'ROADMAP_DELIVERY' || recordForm.type === 'PLAN_DELIVERY')
                ? subjectEntries
                : [[recordForm.subject || '', recordForm.deliveryDate || '']];

            if (teachersToUse.filter(t => t).length === 0) {
                alert("Selecione ao menos um professor.");
                return;
            }
            if (gradesToUse.filter(g => g).length === 0) {
                alert("Selecione ao menos uma série.");
                return;
            }
            if (shiftsToUse.filter(s => s).length === 0) {
                alert("Selecione ao menos um turno.");
                return;
            }
            if ((recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'ROADMAP_DELIVERY' || recordForm.type === 'PLAN_DELIVERY') && subjectEntries.length === 0) {
                alert("Selecione ao menos uma disciplina.");
                return;
            }

            const obs = checkedDocTypes.length > 0
                ? `[${checkedDocTypes.join(', ')}] ${recordForm.observation || ''}`.trim()
                : recordForm.observation;

            for (const tId of teachersToUse) {
                const teacherObj = state.users.find(u => u.id === tId);
                for (const grade of gradesToUse) {
                    for (const shift of shiftsToUse) {
                        for (const p of (recordForm.type === 'REPORT_MONITORING' ? periodsToUse : [recordForm.period])) {
                            for (const [subject, deliveryDate] of subjectsToUse) {
                                const record: CoordinationRecord = {
                                    id: Math.random().toString(36).substr(2, 9),
                                    type: recordForm.type!,
                                    teacherId: tId,
                                    teacherName: teacherObj?.name || '?',
                                    status: recordForm.status || 'No Prazo',
                                    grade,
                                    shift,
                                    subject: subject as string,
                                    deadline: recordForm.deadline,
                                    deliveryDate: (deliveryDate as string) || recordForm.deliveryDate,
                                    fileUrl: recordForm.fileUrl,
                                    observation: obs,
                                    period: p as string,
                                    weekDate: recordForm.weekDate,
                                    isCompleted: recordForm.isCompleted
                                };
                                await api.saveCoordinationRecord(record);
                            }
                        }
                    }
                }
            }
        } else {
            const teacherObj = state.users.find(u => u.id === recordForm.teacherId);
            const recordToSave: CoordinationRecord = {
                id: editingRecord?.id || Math.random().toString(36).substr(2, 9),
                type: recordForm.type!,
                teacherId: recordForm.teacherId,
                teacherName: teacherObj?.name || recordForm.teacherName || '?',
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
        }

        setIsRecordModalOpen(false);
        onRefresh();
    };

    const handleDeleteRecord = async (id: string) => {
        if (confirm("Excluir registro?")) {
            await api.deleteCoordinationRecord(id);
            onRefresh();
        }
    };

    const handleBulkDelete = async () => {
        if (selectedRecords.length === 0) return;
        if (confirm(`Excluir ${selectedRecords.length} registros selecionados?`)) {
            for (const id of selectedRecords) {
                await api.deleteCoordinationRecord(id);
            }
            setSelectedRecords([]);
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
              ${records.map(r => {
                  let obsStr = r.observation || '';
                  if (type === 'TEACHER_ABSENCE') {
                      try {
                          const parsed = JSON.parse(obsStr);
                          if (parsed && parsed.msg) obsStr = parsed.msg + (parsed.extraObs ? ` | ${parsed.extraObs}` : '');
                      } catch(e) {}
                  }
                  return `
                <tr>
                  <td>${r.teacherName}</td>
                  ${type === 'DRIVE_UPDATE'
                ? `<td>${r.grade || '-'} / ${r.shift || '-'}</td><td>${r.weekDate ? new Date(r.weekDate).toLocaleDateString('pt-BR') : '-'}</td><td>${r.isCompleted ? 'Sim' : 'Não'}</td>`
                : `<td>${r.deadline ? new Date(r.deadline).toLocaleDateString('pt-BR') : '-'}</td><td>${r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString('pt-BR') : '-'}</td>`
            }
                  ${type === 'REPORT_MONITORING' ? `<td>${r.period || '-'}</td>` : ''}
                  ${type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY' ? `<td>${r.grade || '-'}</td><td>${r.subject || '-'}</td>` : ''}
                  <td>${r.status}</td>
                  <td>${obsStr}</td>
                </tr>
              `;
            }).join('')}
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
    const isChecklist = recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'ROADMAP_DELIVERY' || recordForm.type === 'PLAN_DELIVERY' || recordForm.type === 'DRIVE_UPDATE' || recordForm.type === 'REPORT_MONITORING';

    // Helper to get available grades for selected teachers in form
    const getTeachersGrades = () => {
        if (checkedTeachers.length === 0 && !recordForm.teacherId) return activeGrades;
        const selectedIds = checkedTeachers.length > 0 ? checkedTeachers : [recordForm.teacherId!];
        const selectedTeachers = state.users.filter(u => selectedIds.includes(u.id));
        
        let allGrades = new Set<string>();
        selectedTeachers.forEach(t => {
            if (t.classes && t.classes.length > 0) {
                t.classes.forEach(c => allGrades.add(c.grade));
            }
        });

        return allGrades.size > 0 ? Array.from(allGrades) : activeGrades;
    };

    // Helper to get available shifts for selected teachers AND grade in form
    const getTeachersShifts = () => {
        if (checkedTeachers.length === 0 && !recordForm.teacherId) return ['Manhã', 'Tarde'];
        const selectedIds = checkedTeachers.length > 0 ? checkedTeachers : [recordForm.teacherId!];
        const selectedTeachers = state.users.filter(u => selectedIds.includes(u.id));

        let allShifts = new Set<Shift>();
        selectedTeachers.forEach(t => {
            if (t.classes && t.classes.length > 0) {
                let classes = t.classes;
                if (recordForm.grade) {
                    classes = classes.filter(c => c.grade === recordForm.grade);
                }
                classes.forEach(c => allShifts.add(c.shift || 'Manhã'));
            }
        });

        return allShifts.size > 0 ? Array.from(allShifts) : ['Manhã', 'Tarde'];
    };

    // Helper to get available subjects for selected teachers AND grade in form
    const getTeachersSubjects = () => {
        if (checkedTeachers.length === 0 && !recordForm.teacherId) return state.subjects;
        const selectedIds = checkedTeachers.length > 0 ? checkedTeachers : [recordForm.teacherId!];
        const selectedTeachers = state.users.filter(u => selectedIds.includes(u.id));

        let allSubjects = new Set<string>();
        selectedTeachers.forEach(t => {
            if (t.classes && t.classes.length > 0) {
                let classes = t.classes;
                if (recordForm.grade) {
                    classes = classes.filter(c => c.grade === recordForm.grade);
                }
                classes.forEach(c => allSubjects.add(c.subject));
            }
        });

        return allSubjects.size > 0 ? Array.from(allSubjects) : state.subjects;
    };

    const renderRecordTable = (type: CoordinationType, title: string) => {
        const records = (state.coordinationRecords || []).filter(r => r.type === type);

        // Sorting & Grouping Logic
        let displayRecords = [...records];
        if (groupBy === 'teacher') {
            displayRecords.sort((a, b) => a.teacherName.localeCompare(b.teacherName));
        } else if (groupBy === 'grade') {
            displayRecords.sort((a, b) => (a.grade || '').localeCompare(b.grade || ''));
        }

        const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.checked) {
                setSelectedRecords(records.map(r => r.id));
            } else {
                setSelectedRecords([]);
            }
        };

        const toggleSelect = (id: string) => {
            setSelectedRecords(prev =>
                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
            );
        };

        return (
            <div className="overflow-x-auto">
                <div className="flex justify-between mb-4 items-center">
                    <div className="flex items-center gap-4">
                        <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wide pt-2">Registros</h4>
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setGroupBy('none')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${groupBy === 'none' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >Original</button>
                            <button
                                onClick={() => setGroupBy('teacher')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${groupBy === 'teacher' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >Por Professor</button>
                            <button
                                onClick={() => setGroupBy('grade')}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${groupBy === 'grade' ? 'bg-white dark:bg-slate-800 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                            >Por Série</button>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {selectedRecords.length > 0 && (
                            <Button variant="outline" size="sm" onClick={handleBulkDelete} className="text-red-500 border-red-200 bg-red-50 hover:bg-red-100 !rounded-xl">
                                <Trash2 size={16} className="mr-2" /> Excluir ({selectedRecords.length})
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handlePrintSection(type, title)} className="text-slate-500 !rounded-xl">
                            <Printer size={16} className="mr-2" /> Imprimir Relatório
                        </Button>
                    </div>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={records.length > 0 && selectedRecords.length === records.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th className="px-4 py-3">Professor</th>
                            {type === 'DRIVE_UPDATE' ? (
                                <>
                                    <th className="px-4 py-3">Série/Turno</th>
                                    <th className="px-4 py-3">Período</th>
                                    <th className="px-4 py-3">Concluído</th>
                                </>
                            ) : type === 'TEACHER_ABSENCE' ? (
                                <th className="px-4 py-3">Data da Falta</th>
                            ) : (
                                <>
                                    <th className="px-4 py-3">Prazo</th>
                                    <th className="px-4 py-3">Entrega</th>
                                    {type === 'REPORT_MONITORING' && <th className="px-4 py-3">Bimestre</th>}
                                </>
                            )}
                            {(type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY' || type === 'ROADMAP_DELIVERY') && (
                                <>
                                    <th className="px-4 py-3">Série</th>
                                    <th className="px-4 py-3">Disciplina</th>
                                </>
                            ) /* Final touch: added ROADMAP_DELIVERY to grades display */}
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Arquivo</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {displayRecords.length === 0 ? (
                            <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Nenhum registro.</td></tr>
                        ) : (
                            displayRecords.map((r, idx) => {
                                // Group Header Logic
                                let showGroupHeader = false;
                                if (groupBy !== 'none') {
                                    if (idx === 0) showGroupHeader = true;
                                    else {
                                        const prev = displayRecords[idx - 1];
                                        if (groupBy === 'teacher' && prev.teacherName !== r.teacherName) showGroupHeader = true;
                                        if (groupBy === 'grade' && prev.grade !== r.grade) showGroupHeader = true;
                                    }
                                }

                                return (
                                    <React.Fragment key={r.id}>
                                        {showGroupHeader && (
                                            <tr className="bg-slate-100/30 dark:bg-slate-800/20">
                                                <td colSpan={10} className="px-4 py-2 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                                    {groupBy === 'teacher' ? r.teacherName : (r.grade || 'Sem Série')}
                                                </td>
                                            </tr>
                                        )}
                                        <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedRecords.includes(r.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRecords.includes(r.id)}
                                                    onChange={() => toggleSelect(r.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{r.teacherName}</td>
                                            {type === 'DRIVE_UPDATE' ? (
                                                <>
                                                    <td className="px-4 py-3 text-slate-500">{r.grade} - {r.shift}</td>
                                                    <td className="px-4 py-3 text-[10px] text-slate-500">
                                                        {r.deadline ? new Date(r.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                                        {r.deadline && r.deliveryDate ? ' → ' : ''}
                                                        {r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {r.isCompleted ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-300" />}
                                                    </td>
                                                </>
                                            ) : type === 'TEACHER_ABSENCE' ? (
                                                <td className="px-4 py-3 text-slate-700 font-bold">
                                                    {r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-3 text-slate-500">{r.deadline ? new Date(r.deadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                                                    <td className="px-4 py-3 text-slate-500">{r.deliveryDate ? new Date(r.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</td>
                                                    {type === 'REPORT_MONITORING' && <td className="px-4 py-3 text-slate-500 font-medium">{r.period}</td>}
                                                </>
                                            )}
                                            {(type === 'EXAM_DELIVERY' || type === 'PLAN_DELIVERY' || type === 'ROADMAP_DELIVERY') && (
                                                <>
                                                    <td className="px-4 py-3 text-slate-500">{r.grade || '-'}</td>
                                                    <td className="px-4 py-3 text-slate-500 font-medium">{r.subject || '-'}</td>
                                                </>
                                            )}
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${r.status === 'No Prazo' || r.status === 'Em Dias' || r.status === 'Antecipado'
                                                    ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                                                    : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                                    }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.fileUrl ? (
                                                    <a href={r.fileUrl} target="_blank" className="text-indigo-500 dark:text-indigo-400 hover:underline flex items-center gap-1 text-[11px] font-bold">
                                                        <FileText size={14} /> Ver
                                                    </a>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleOpenRecordModal(type, r)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit size={16} /></button>
                                                    <button onClick={() => handleDeleteRecord(r.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })
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
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Coordenação</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestão de professores, séries e entregas.</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('drives')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'drives' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Entregas
                    </button>
                    <button
                        onClick={() => setActiveTab('teachers')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'teachers' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Professores
                    </button>
                    <button
                        onClick={() => setActiveTab('absences')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'absences' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Faltas
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex-1 md:flex-none px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'config' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    >
                        Config
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
                                <GraduationCap className="text-indigo-500" /> Séries
                            </h3>
                            {state.grades.length === 0 && (
                                <button onClick={handleImportDefaultGrades} className="text-xs text-indigo-500 hover:underline">Importar Padrão</button>
                            )}
                        </div>

                        <div className="flex gap-2 mb-4">
                            <Input placeholder="Nova Série (ex: 3º Ano)" value={newGrade} onChange={e => setNewGrade(e.target.value)} className="h-9" />
                            <Button size="sm" onClick={handleAddGrade} disabled={!newGrade}><Plus size={16} /></Button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {activeGrades.map(g => (
                                <div key={g} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="text-sm">{g}</span>
                                    <button onClick={() => handleDeleteGrade(g)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Subjects */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                            <BookOpen className="text-indigo-500" /> Disciplinas
                        </h3>

                        <div className="flex gap-2 mb-4">
                            <Input placeholder="Nova Disciplina" value={newSubject} onChange={e => setNewSubject(e.target.value)} className="h-9" />
                            <Button size="sm" onClick={handleAddSubject} disabled={!newSubject}><Plus size={16} /></Button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {state.subjects.map(s => (
                                <div key={s} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="text-sm">{s}</span>
                                    <button onClick={() => handleDeleteSubject(s)} className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: TEACHERS --- */}
            {activeTab === 'teachers' && (
                selectedTeacher ? (
                    <TeacherDetailView 
                        teacher={selectedTeacher} 
                        state={state} 
                        onBack={() => onSelectTeacher(null)} 
                    />
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">Cadastro de Professores</h3>
                        <Button onClick={() => handleOpenTeacherModal()} size="sm" className="flex items-center gap-2 !rounded-xl !px-4">
                            <Plus size={16} /> <span className="hidden sm:inline">Novo Professor</span>
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-slate-50/50 dark:bg-slate-900/20">
                        {teachers.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-400 font-medium">Nenhum professor cadastrado.</div>
                        ) : (
                            teachers.map(t => (
                                <div 
                                    key={t.id} 
                                    onClick={() => onSelectTeacher(t)}
                                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-all group flex flex-col h-full cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-900"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="relative">
                                            <img 
                                                src={t.photoUrl} 
                                                alt="" 
                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm bg-slate-100 ring-2 ring-slate-100 dark:ring-slate-700" 
                                            />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight mb-0.5">{t.name}</h4>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                                <User size={10} /> {t.registration || 'SEM MATRÍCULA'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-slate-400 mb-1.5 block tracking-tighter">Turmas & Disciplinas</label>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(t.classes || []).length > 0
                                                    ? (t.classes || []).slice(0, 4).map((c, i) => (
                                                        <div key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-[9px] font-black rounded-lg border border-slate-200 dark:border-slate-600 flex items-center gap-1">
                                                            <span className="text-indigo-600 dark:text-indigo-400">{c.grade.split(' ')[0]}</span>
                                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                            <span className="truncate max-w-[60px]">{c.subject}</span>
                                                        </div>
                                                    ))
                                                    : <span className="text-slate-400 italic text-[10px]">Nenhuma turma vinculada</span>
                                                }
                                                {(t.classes || []).length > 4 && (
                                                    <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                        +{t.classes.length - 4}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenTeacherModal(t); }} 
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold"
                                            >
                                                <Edit size={14} /> Editar
                                            </button>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTeacher(t.id); }} 
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                )
            )}

            {/* --- TAB: DRIVES --- */}
            {activeTab === 'drives' && (
                <div className="space-y-4">
                    {[
                        { type: 'EXAM_DELIVERY' as const, label: 'Entrega de Provas' },
                        { type: 'ROADMAP_DELIVERY' as const, label: 'Entrega de Roteiros' },
                        { type: 'PLAN_DELIVERY' as const, label: 'Entrega planos de aula' },
                        { type: 'REPORT_MONITORING' as const, label: 'Acompanhamento Bimestral' },
                        { type: 'DRIVE_UPDATE' as const, label: 'Atualização do Driver' },
                    ].map(section => (
                        <div key={section.type} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <button
                                onClick={() => setExpandedSection(expandedSection === section.type ? null : section.type)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    {expandedSection === section.type ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
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
                                            <Plus size={16} /> Novo Registro
                                        </Button>
                                    </div>
                                    {renderRecordTable(section.type, section.label)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* --- TAB: ABSENCES --- */}
            {activeTab === 'absences' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Faltas de Professores</h3>
                                <p className="text-xs text-slate-500">Registre e monitore as ausências do corpo docente.</p>
                            </div>
                            <Button onClick={() => handleOpenRecordModal('TEACHER_ABSENCE')} className="flex items-center gap-2">
                                <Plus size={16} /> Novo Registro
                            </Button>
                        </div>
                        {renderRecordTable('TEACHER_ABSENCE', 'Faltas de Professores')}
                    </div>
                </div>
            )}

            {/* --- MODAL: TEACHER --- */}
            {isTeacherModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h3>
                            <button onClick={() => setIsTeacherModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-center mb-4">
                                <label className="cursor-pointer relative group">
                                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                                        {teacherForm.photoUrl ? <img src={teacherForm.photoUrl} alt="" className="w-full h-full object-cover" /> : <User size={32} className="text-slate-400" />}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload size={20} className="text-white" />
                                    </div>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleTeacherPhotoUpload} />
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="Nome Completo" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} />
                                <Input placeholder="Matrícula" value={teacherForm.registration} onChange={e => setTeacherForm({ ...teacherForm, registration: e.target.value })} />
                            </div>

                            {/* Class/Subject Linker */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400 mb-3">Vincular Turmas e Disciplinas</h4>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Séries</label>
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                                {activeGrades.map(g => (
                                                    <label key={g} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={teacherGradesChecked.includes(g)}
                                                            onChange={e => {
                                                                if (e.target.checked) setTeacherGradesChecked(prev => [...prev, g]);
                                                                else setTeacherGradesChecked(prev => prev.filter(item => item !== g));
                                                            }}
                                                        />
                                                        {g}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Disciplinas</label>
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                                {state.subjects.map(s => (
                                                    <label key={s} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={teacherSubjectsChecked.includes(s)}
                                                            onChange={e => {
                                                                if (e.target.checked) setTeacherSubjectsChecked(prev => [...prev, s]);
                                                                else setTeacherSubjectsChecked(prev => prev.filter(item => item !== s));
                                                            }}
                                                        />
                                                        {s}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Turnos</label>
                                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                                {(['Manhã', 'Tarde'] as Shift[]).map(sh => (
                                                    <label key={sh} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer transition-colors text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                            checked={teacherShiftsChecked.includes(sh)}
                                                            onChange={e => {
                                                                if (e.target.checked) setTeacherShiftsChecked(prev => [...prev, sh]);
                                                                else setTeacherShiftsChecked(prev => prev.filter(item => item !== sh));
                                                            }}
                                                        />
                                                        {sh}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Adicionar Dias da Semana e Horários */}
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Dias da Semana</label>
                                            <div className="flex flex-wrap gap-1">
                                                {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => {
                                                    const isChecked = teacherDaysChecked.includes(day);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => setTeacherDaysChecked(prev => 
                                                                prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                                                            )}
                                                            className={`px-2 py-1 text-[9px] font-bold border rounded-lg transition-all ${isChecked 
                                                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                                                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200'}`}
                                                        >
                                                            {day.substring(0, 3)}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Início</label>
                                                <input 
                                                    type="time" 
                                                    className="w-full text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    value={teacherStartTime}
                                                    onChange={e => setTeacherStartTime(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Fim</label>
                                                <input 
                                                    type="time" 
                                                    className="w-full text-xs p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                                                    value={teacherEndTime}
                                                    onChange={e => setTeacherEndTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-4">
                                        <Button 
                                            size="sm" 
                                            onClick={handleAddTeacherClass} 
                                            disabled={teacherGradesChecked.length === 0 || teacherSubjectsChecked.length === 0 || teacherShiftsChecked.length === 0}
                                            className="h-[38px] px-6 !rounded-lg w-full"
                                        >
                                            <Plus size={16} className="mr-2" /> Vincular Selecionados
                                        </Button>
                                    </div>

                                <div className="space-y-2 max-h-32 overflow-y-auto mt-4">
                                    {(teacherForm.classes || []).length === 0 && <p className="text-xs text-slate-400 italic text-center py-2">Nenhuma turma vinculada</p>}
                                    {(teacherForm.classes || []).map(c => (
                                        <div key={c.id} className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center text-xs mb-1">
                                                <span>{c.grade} ({c.shift || 'Manhã'}) - <strong>{c.subject}</strong></span>
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => handleEditTeacherClass(c)} className="text-indigo-400 hover:text-indigo-600" title="Editar vinculo"><Edit size={14} /></button>
                                                    <button type="button" onClick={() => handleRemoveTeacherClass(c.id)} className="text-red-400 hover:text-red-600" title="Excluir vinculo"><Trash2 size={14} /></button>
                                                </div>
                                            </div>
                                            {c.schedules && c.schedules.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {c.schedules.map((s, idx) => (
                                                        <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 rounded text-slate-500">
                                                            {s.dayOfWeek.substring(0, 3)}: {s.startTime}-{s.endTime}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
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
                            <button onClick={() => setIsRecordModalOpen(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Professores</label>
                                {!editingRecord ? (
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                        {teachers.map(t => (
                                            <label key={t.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors group">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                    checked={checkedTeachers.includes(t.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) setCheckedTeachers(prev => [...prev, t.id]);
                                                        else setCheckedTeachers(prev => prev.filter(id => id !== t.id));
                                                    }}
                                                />
                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{t.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <select
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                        value={recordForm.teacherId}
                                        onChange={e => handleTeacherSelect(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                )}
                            </div>

                            {/* Série checklist + Turno dropdown (Hidden for Absences) */}
                            {recordForm.type !== 'TEACHER_ABSENCE' && (
                                <>
                                    {isChecklist && !editingRecord ? (
                                        <div className="space-y-3">
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Séries</label>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const all = getTeachersGrades();
                                                            setCheckedGrades(checkedGrades.length === all.length ? [] : all);
                                                        }}
                                                        className="text-[10px] font-bold text-indigo-500 hover:underline"
                                                    >
                                                        {checkedGrades.length === getTeachersGrades().length ? 'Desmarcar tudo' : 'Marcar tudo'}
                                                    </button>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {getTeachersGrades().map(grade => {
                                                        const isChecked = checkedGrades.includes(grade);
                                                        return (
                                                            <button
                                                                key={grade}
                                                                type="button"
                                                                onClick={() => setCheckedGrades(prev =>
                                                                    prev.includes(grade) ? prev.filter(g => g !== grade) : [...prev, grade]
                                                                )}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isChecked
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                                                    }`}
                                                            >
                                                                {isChecked && '✓ '}{grade}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Turnos</label>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {getTeachersShifts().map(shift => {
                                                        const isChecked = checkedShifts.includes(shift as Shift);
                                                        return (
                                                            <button
                                                                key={shift}
                                                                type="button"
                                                                onClick={() => setCheckedShifts(prev =>
                                                                    prev.includes(shift as Shift) ? prev.filter(s => s !== shift) : [...prev, shift as Shift]
                                                                )}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isChecked
                                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                                                    }`}
                                                            >
                                                                {isChecked && '✓ '}{shift}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Série</label>
                                                <select
                                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                                    value={recordForm.grade}
                                                    onChange={e => setRecordForm({ ...recordForm, grade: e.target.value })}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {getTeachersGrades().map(g => <option key={g} value={g}>{g}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Turno</label>
                                                <select
                                                    className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                                    value={recordForm.shift}
                                                    onChange={e => setRecordForm({ ...recordForm, shift: e.target.value as Shift })}
                                                >
                                                    {getTeachersShifts().map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Dynamic Fields based on Type */}
                            {(recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'ROADMAP_DELIVERY' || recordForm.type === 'PLAN_DELIVERY') && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Prazo</label>
                                        <Input type="date" value={recordForm.deadline} onChange={e => setRecordForm({ ...recordForm, deadline: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Data Entrega</label>
                                        <Input type="date" value={recordForm.deliveryDate} onChange={e => setRecordForm({ ...recordForm, deliveryDate: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {/* Multi-Discipline Checklist */}
                            {(recordForm.teacherId || checkedTeachers.length > 0) && (recordForm.type === 'EXAM_DELIVERY' || recordForm.type === 'ROADMAP_DELIVERY' || recordForm.type === 'PLAN_DELIVERY') && !editingRecord && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Disciplinas</label>
                                    </div>
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                                        {getTeachersSubjects().map(subject => {
                                            const isChecked = subject in checkedSubjects;
                                            return (
                                                <div key={subject} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${isChecked ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-700'}`}>
                                                    <input type="checkbox" checked={isChecked} onChange={e => {
                                                        setCheckedSubjects(prev => {
                                                            const next = { ...prev };
                                                            if (e.target.checked) next[subject] = '';
                                                            else delete next[subject];
                                                            return next;
                                                        });
                                                    }} className="w-4 h-4 rounded text-indigo-600" />
                                                    <span className="text-xs font-bold flex-1">{subject}</span>
                                                    {isChecked && (
                                                        <input type="date" value={checkedSubjects[subject] || ''} onChange={e => setCheckedSubjects(prev => ({ ...prev, [subject]: e.target.value }))} className="text-[11px] p-1 border rounded" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {recordForm.type === 'REPORT_MONITORING' && (
                                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Bimestre / Período</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'].map(p => {
                                            const isChecked = checkedPeriods.includes(p);
                                            return (
                                                <button key={p} type="button" onClick={() => setCheckedPeriods(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p])} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${isChecked ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>
                                                    {isChecked && '✓ '}{p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {recordForm.type === 'DRIVE_UPDATE' && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Início</label>
                                            <Input type="date" value={recordForm.deadline || ''} onChange={e => setRecordForm({ ...recordForm, deadline: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Fim</label>
                                            <Input type="date" value={recordForm.deliveryDate || ''} onChange={e => setRecordForm({ ...recordForm, deliveryDate: e.target.value })} />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={recordForm.isCompleted} onChange={e => setRecordForm({ ...recordForm, isCompleted: e.target.checked })} />
                                        <span className="text-sm">Concluído</span>
                                    </label>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                                    <select
                                        className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1"
                                        value={recordForm.status}
                                        onChange={e => setRecordForm({ ...recordForm, status: e.target.value })}
                                    >
                                        {recordForm.type === 'TEACHER_ABSENCE' ? (
                                            <>
                                                <option value="Falta Injustificada">Falta Injustificada</option>
                                                <option value="Falta Justificada">Falta Justificada</option>
                                                <option value="Atestado Médico">Atestado Médico</option>
                                                <option value="Licença">Licença</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="No Prazo">No Prazo</option>
                                                <option value="Antecipado">Antecipado</option>
                                                <option value="Fora do prazo">Fora do Prazo</option>
                                                <option value="Em Dias">Em Dias</option>
                                                <option value="Atrasado">Atrasado</option>
                                            </>
                                        )}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">{recordForm.type === 'TEACHER_ABSENCE' ? 'Data da Falta' : 'Link do Arquivo'}</label>
                                    {recordForm.type === 'TEACHER_ABSENCE' ? (
                                        <Input type="date" value={recordForm.deliveryDate} onChange={e => setRecordForm({ ...recordForm, deliveryDate: e.target.value })} />
                                    ) : (
                                        <Input placeholder="URL do PDF/Excel" value={recordForm.fileUrl} onChange={e => setRecordForm({ ...recordForm, fileUrl: e.target.value })} />
                                    )}
                                </div>
                            </div>

                            {(() => {
                                let isJson = false;
                                let obsObj: any = null;
                                let textObs = recordForm.observation || '';
                                
                                if (recordForm.type === 'TEACHER_ABSENCE') {
                                    try {
                                        const parsed = JSON.parse(textObs);
                                        if (parsed && typeof parsed.scheduled !== 'undefined') {
                                            isJson = true;
                                            obsObj = parsed;
                                            textObs = parsed.extraObs || '';
                                        }
                                    } catch(e) {}
                                }

                                return (
                                    <>
                                        {isJson && (
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                                                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-3 block">Controle de Aulas do Dia (Catraca)</h4>
                                                <p className="text-[10px] text-slate-500 italic mb-3 leading-tight block">Use os campos abaixo para editar ou desmarcar aulas dadas se o sistema calculou incorretamente.</p>
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase">Aulas Previstas</label>
                                                        <input type="number" min="0" className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1" value={obsObj.scheduled} onChange={e => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const missed = val - obsObj.given;
                                                            const newObj = { ...obsObj, scheduled: val, missed: missed, manualOverride: true, msg: `Faltou ${missed} aula(s) de ${val} previstas.` };
                                                            setRecordForm({ ...recordForm, observation: JSON.stringify(newObj) });
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase">Aulas Dadas</label>
                                                        <input type="number" min="0" className="w-full text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1" value={obsObj.given} onChange={e => {
                                                            const val = parseInt(e.target.value) || 0;
                                                            const missed = obsObj.scheduled - val;
                                                            const newObj = { ...obsObj, given: val, missed: missed, manualOverride: true, msg: `Faltou ${missed} aula(s) de ${obsObj.scheduled} previstas.` };
                                                            const newStatus = missed === obsObj.scheduled ? "Falta Injustificada" : (missed > 0 ? "Falta Parcial" : "Presente");
                                                            setRecordForm({ ...recordForm, status: newStatus, observation: JSON.stringify(newObj) });
                                                        }} />
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold block text-center">Aulas Perdidas: {obsObj.missed}</p>
                                                </div>
                                            </div>
                                        )}
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase">{isJson ? "Observações Adicionais" : "Observações"}</label>
                                            <textarea
                                                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 mt-1 resize-none h-24"
                                                value={textObs}
                                                onChange={e => {
                                                    if (isJson) {
                                                        const newObj = { ...obsObj, extraObs: e.target.value };
                                                        setRecordForm({ ...recordForm, observation: JSON.stringify(newObj) });
                                                    } else {
                                                        setRecordForm({ ...recordForm, observation: e.target.value });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </>
                                );
                            })()}

                            <Button className="w-full" onClick={handleSaveRecord}>Salvar Registro</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
