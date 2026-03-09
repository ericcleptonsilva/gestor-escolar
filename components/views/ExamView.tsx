import React from 'react';
import { ClipboardList, Plus, Filter, Trash2, Clock, CheckCircle2, XCircle, ArrowLeft, X, Edit, ChevronDown, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { SearchableSelect } from '../ui/SearchableSelect';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { PrintButton } from '../features/PrintButton';
import { AppState, Student, MakeUpExam, AcademicPeriod } from '../../types';
import { SHIFTS_LIST, ACADEMIC_PERIODS } from '../../constants';

interface ExamViewProps {
    students: Student[];
    exams: MakeUpExam[];
    subjects: string[];
    examForm: {
        studentId: string;
        period: AcademicPeriod;
        reason: string;
        items: { subject: string; date: string }[];
    };
    setExamForm: React.Dispatch<React.SetStateAction<{
        studentId: string;
        period: AcademicPeriod;
        reason: string;
        items: { subject: string; date: string }[];
    }>>;
    editingExam: MakeUpExam | null;
    setEditingExam: React.Dispatch<React.SetStateAction<MakeUpExam | null>>;
    newSubjectName: string;
    setNewSubjectName: (name: string) => void;
    filterExamGrade: string[];
    setFilterExamGrade: (grade: string[]) => void;
    filterExamShift: string;
    setFilterExamShift: (shift: string) => void;
    showSubjectCatalog: boolean;
    setShowSubjectCatalog: (show: boolean) => void;
    visibleGradesList: string[];
    onPrint: () => void;
    onAddSubject: () => void;
    onRemoveSubject: (subject: string) => void;
    onSaveExam: () => void;
    onUpdateExamStatus: (id: string, status: 'Pending' | 'Completed' | 'Cancelled') => void;
    onUpdateExamDetails: (exam: MakeUpExam) => void;
    onDeleteExam: (id: string) => void;
}

export const ExamView = ({
    students,
    exams,
    subjects,
    examForm, setExamForm,
    editingExam, setEditingExam,
    newSubjectName, setNewSubjectName,
    filterExamGrade, setFilterExamGrade,
    filterExamShift, setFilterExamShift,
    showSubjectCatalog, setShowSubjectCatalog,
    visibleGradesList,
    onPrint,
    onAddSubject,
    onRemoveSubject,
    onSaveExam,
    onUpdateExamStatus,
    onUpdateExamDetails,
    onDeleteExam
}: ExamViewProps) => {

    const [tempDate, setTempDate] = React.useState('');
    const [tempSubjects, setTempSubjects] = React.useState<string[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);

    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = React.useState(false);
    const gradeDropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target as Node)) {
                setIsGradeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleGradeFilter = (grade: string) => {
        if (filterExamGrade.includes(grade)) {
            setFilterExamGrade(filterExamGrade.filter(g => g !== grade));
        } else {
            setFilterExamGrade([...filterExamGrade, grade]);
        }
    };

    const toggleAllGrades = () => {
        if (filterExamGrade.length === visibleGradesList.length) {
            setFilterExamGrade([]);
        } else {
            setFilterExamGrade([...visibleGradesList]);
        }
    };

    // Open Edit Modal with the selected exam
    const handleOpenEditModal = (exam: MakeUpExam) => {
        setEditingExam({ ...exam });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (editingExam) {
            onUpdateExamDetails(editingExam);
            setIsEditModalOpen(false);
        }
    };

    const handleCloseEdit = () => {
        setIsEditModalOpen(false);
        setEditingExam(null);
    };

    const handleAddItem = () => {
        if (!tempDate) {
            alert("Selecione uma data primeiro.");
            return;
        }
        if (tempSubjects.length === 0) {
            alert("Selecione ao menos uma matéria.");
            return;
        }

        const newItems = tempSubjects.map(sub => ({ subject: sub, date: tempDate }));

        // Prevent exact duplicates
        const filteredNewItems = newItems.filter(nuevo =>
            !examForm.items.some(exist => exist.subject === nuevo.subject && exist.date === nuevo.date)
        );

        setExamForm({ ...examForm, items: [...examForm.items, ...filteredNewItems] });
        setTempSubjects([]); // clear selection after adding
        // keeping tempDate might be useful if they want to add more on the same day, or clearing it is also fine.
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setExamForm({
            ...examForm,
            items: examForm.items.filter((_, i) => i !== indexToRemove)
        });
    };

    const toggleSubjectSelection = (subject: string) => {
        if (tempSubjects.includes(subject)) {
            setTempSubjects(tempSubjects.filter(s => s !== subject));
        } else {
            setTempSubjects([...tempSubjects, subject]);
        }
    };

    if (showSubjectCatalog) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                    <Button variant="secondary" onClick={() => setShowSubjectCatalog(false)} className="!p-2">
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Catálogo de Matérias</h2>
                </div>

                <Card className="p-6 max-w-2xl mx-auto">
                    <div className="flex space-x-2 mb-6">
                        <Input
                            placeholder="Nova matéria..."
                            value={newSubjectName}
                            onChange={e => setNewSubjectName(e.target.value)}
                        />
                        <Button onClick={onAddSubject}>
                            <Plus size={18} /> Adicionar
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {subjects.map(sub => (
                            <div key={sub} className="flex items-center bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600">
                                <span className="mr-2">{sub}</span>
                                <button onClick={() => onRemoveSubject(sub)} className="text-red-500 hover:text-red-700">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    const filteredExams = (exams || []).filter(exam => {
        const student = (students || []).find(s => s.id === exam.studentId);
        if (!student) return false;

        const matchesGrade = filterExamGrade.length > 0 ? filterExamGrade.includes(student.grade) : true;
        const matchesShift = filterExamShift ? student.shift === filterExamShift : true;

        return matchesGrade && matchesShift;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                    <ClipboardList className="mr-2 text-indigo-600 dark:text-indigo-400" />
                    Agendamento de 2ª Chamada
                </h2>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowSubjectCatalog(true)}>
                        Gerenciar Matérias
                    </Button>
                    <PrintButton onClick={onPrint} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Novo Agendamento</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aluno</label>
                                <SearchableSelect
                                    value={examForm.studentId}
                                    onChange={value => setExamForm({ ...examForm, studentId: value })}
                                    options={(students || [])
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(s => ({ value: s.id, label: `${s.name} - ${s.grade} - ${s.shift}` }))}
                                    placeholder="Selecione o Aluno..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Período/Etapa</label>
                                <Select
                                    value={examForm.period}
                                    onChange={e => setExamForm({ ...examForm, period: e.target.value as AcademicPeriod })}
                                >
                                    {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo Padrão</label>
                                <Input placeholder="Ex: Doença, Viagem..." value={examForm.reason} onChange={e => setExamForm({ ...examForm, reason: e.target.value })} />
                            </div>

                            {/* Multiple Subject/Date Builder */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-4">
                                <h4 className="font-bold text-sm text-slate-600 dark:text-slate-400 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                                    Adicionar Matérias e Datas
                                </h4>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Data da Prova</label>
                                        <Input type="date" value={tempDate} onChange={e => setTempDate(e.target.value)} />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Matérias</label>
                                        <div className="max-h-40 overflow-y-auto pr-2 grid grid-cols-2 gap-2">
                                            {(subjects || []).sort().map(s => (
                                                <label key={s} className={`flex items-start space-x-2 p-2 rounded cursor-pointer border transition-colors ${tempSubjects.includes(s) ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 flex-shrink-0"
                                                        checked={tempSubjects.includes(s)}
                                                        onChange={() => toggleSubjectSelection(s)}
                                                    />
                                                    <span className="text-sm font-medium leading-tight text-slate-700 dark:text-slate-300">{s}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <Button type="button" variant="secondary" className="w-full mt-2" onClick={handleAddItem}>
                                        <Plus size={16} className="mr-2" /> Adicionar à Lista
                                    </Button>
                                </div>
                            </div>

                            {/* Added Items List */}
                            {examForm.items.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    <h5 className="text-xs font-bold text-slate-500 uppercase">Lista de Provas ({examForm.items.length})</h5>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                        {examForm.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm">
                                                <div>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{item.subject}</span>
                                                    <span className="text-slate-500 text-xs ml-2">({new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })})</span>
                                                </div>
                                                <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-1" title="Remover da lista">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Button className="w-full mt-6" onClick={onSaveExam} disabled={examForm.items.length === 0}>
                                <Plus size={18} className="mr-2" /> Agendar Todas ({examForm.items.length})
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><Filter size={16} className="mr-2" /> Filtros</h3>
                        <div className="space-y-3">
                            <div className="relative" ref={gradeDropdownRef}>
                                <div
                                    className="h-10 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                    onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                                >
                                    <span className={`text-sm truncate ${filterExamGrade.length === 0 ? 'text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                        {filterExamGrade.length === 0 ? 'Todas as Turmas' : `${filterExamGrade.length} turma(s) selecionada(s)`}
                                    </span>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isGradeDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isGradeDropdownOpen && (
                                    <div className="absolute z-50 top-12 left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto no-print">
                                        <div className="p-2 sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={toggleAllGrades}
                                                className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                                            >
                                                {filterExamGrade.length === visibleGradesList.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                                            </button>
                                        </div>
                                        <div className="p-1">
                                            {visibleGradesList.map(g => (
                                                <label key={g} className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${filterExamGrade.includes(g)
                                                            ? 'bg-indigo-500 border-indigo-500 text-white'
                                                            : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                                                        }`}>
                                                        {filterExamGrade.includes(g) && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                    <span className="text-sm text-slate-700 dark:text-slate-300">{g}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Select value={filterExamShift} onChange={e => setFilterExamShift(e.target.value)}>
                                <option value="">Todos os Turnos</option>
                                {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <div className="grid grid-cols-1 gap-4">
                        {(() => {
                            // Group exams by studentId + originalDate
                            const grouped = filteredExams.reduce((acc, exam) => {
                                const key = `${exam.studentId}_${exam.originalDate}_${exam.period}_${exam.reason}`;
                                if (!acc[key]) {
                                    acc[key] = {
                                        studentId: exam.studentId,
                                        originalDate: exam.originalDate,
                                        period: exam.period,
                                        reason: exam.reason,
                                        exams: []
                                    };
                                }
                                acc[key].exams.push(exam);
                                return acc;
                            }, {} as Record<string, { studentId: string, originalDate: string, period: string, reason: string, exams: MakeUpExam[] }>);

                            const groupedArray = Object.values(grouped).sort((groupA, groupB) => {
                                // 1. Reverse Chronological Date
                                const dateA = new Date(groupA.originalDate).getTime();
                                const dateB = new Date(groupB.originalDate).getTime();
                                if (dateA !== dateB) return dateB - dateA;

                                const studentA = (students || []).find(s => s.id === groupA.studentId);
                                const studentB = (students || []).find(s => s.id === groupB.studentId);
                                if (!studentA || !studentB) return 0;

                                // 2. Class / Grade
                                const gradeCompare = studentA.grade.localeCompare(studentB.grade);
                                if (gradeCompare !== 0) return gradeCompare;

                                // 3. Shift
                                const shiftCompare = studentA.shift.localeCompare(studentB.shift);
                                if (shiftCompare !== 0) return shiftCompare;

                                // 4. Sequence Number
                                const seqA = parseInt(studentA.sequenceNumber);
                                const seqB = parseInt(studentB.sequenceNumber);
                                const hasSeqA = !isNaN(seqA);
                                const hasSeqB = !isNaN(seqB);

                                if (hasSeqA && hasSeqB) {
                                    if (seqA !== seqB) return seqA - seqB;
                                } else if (hasSeqA) {
                                    return -1;
                                } else if (hasSeqB) {
                                    return 1;
                                }

                                // 5. Name
                                return studentA.name.localeCompare(studentB.name);
                            });

                            if (groupedArray.length === 0) {
                                return (
                                    <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                        <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                                        <p>Nenhum agendamento encontrado.</p>
                                    </div>
                                );
                            }

                            return groupedArray.map((group, idx) => {
                                const student = (students || []).find(s => s.id === group.studentId);
                                return (
                                    <Card key={idx} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div>
                                            <div className="flex items-start justify-between mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="relative w-12 h-12 flex-shrink-0">
                                                        <img
                                                            src={student?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.id}`}
                                                            alt={student?.name}
                                                            className="w-full h-full rounded-full object-cover border-2 border-slate-200 dark:border-slate-600 bg-white"
                                                        />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={student?.name}>
                                                            {student?.name}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 gap-2 mt-0.5">
                                                            <span>Mat: {student?.registration}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                            <span>{student?.grade}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                            <span>{student?.shift}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 items-end flex-shrink-0 ml-2">
                                                    <Badge color="slate">{group.period}</Badge>
                                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                                                        {new Date(group.originalDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                    </div>
                                                </div>
                                            </div>

                                            {group.reason && (
                                                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4">
                                                    <p className="text-sm text-slate-600 dark:text-slate-300">
                                                        <span className="font-bold text-xs uppercase text-slate-400 block mb-1">Motivo / Obs</span>
                                                        {group.reason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Disciplinas Agendadas ({group.exams.length})</h5>
                                            {group.exams.map(exam => (
                                                <div key={exam.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 rounded-lg gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge color="blue" className="w-24 justify-center">{exam.subject}</Badge>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${exam.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                            exam.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            }`}>
                                                            {exam.status === 'Completed' ? 'Concluída' : exam.status === 'Cancelled' ? 'Cancelada' : 'Pendente'}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-md ml-auto">
                                                        <button
                                                            title="Pendente"
                                                            onClick={() => onUpdateExamStatus(exam.id, 'Pending')}
                                                            className={`p-1.5 rounded transition-colors ${exam.status === 'Pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            <Clock size={16} />
                                                        </button>
                                                        <button
                                                            title="Concluída"
                                                            onClick={() => onUpdateExamStatus(exam.id, 'Completed')}
                                                            className={`p-1.5 rounded transition-colors ${exam.status === 'Completed' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                        <button
                                                            title="Cancelada"
                                                            onClick={() => onUpdateExamStatus(exam.id, 'Cancelled')}
                                                            className={`p-1.5 rounded transition-colors ${exam.status === 'Cancelled' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                        <button
                                                            title="Editar"
                                                            onClick={() => handleOpenEditModal(exam)}
                                                            className="p-1.5 rounded text-blue-500 hover:text-blue-700 transition-colors"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            title="Remover"
                                                            onClick={() => onDeleteExam(exam.id)}
                                                            className="p-1.5 rounded text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            {/* EDIT MODAL */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={handleCloseEdit}
                title="Editar Agendamento de Prova"
            >
                {editingExam && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matéria</label>
                            <Select
                                value={editingExam.subject}
                                onChange={e => setEditingExam({ ...editingExam, subject: e.target.value })}
                            >
                                {(subjects || []).sort().map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Período/Etapa</label>
                            <Select
                                value={editingExam.period || '1ª Bi'}
                                onChange={e => setEditingExam({ ...editingExam, period: e.target.value as AcademicPeriod })}
                            >
                                {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                            </Select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Prova</label>
                            <Input
                                type="date"
                                value={editingExam.originalDate}
                                onChange={e => setEditingExam({ ...editingExam, originalDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo / Observação</label>
                            <Input
                                placeholder="Ex: Doença, Viagem..."
                                value={editingExam.reason}
                                onChange={e => setEditingExam({ ...editingExam, reason: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                            <Button variant="secondary" onClick={handleCloseEdit}>Cancelar</Button>
                            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};
