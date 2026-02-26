import React from 'react';
import { ClipboardList, Plus, Filter, Trash2, Clock, CheckCircle2, XCircle, ArrowLeft, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PrintButton } from '../features/PrintButton';
import { AppState, Student, MakeUpExam, AcademicPeriod } from '../../types';
import { SHIFTS_LIST, ACADEMIC_PERIODS } from '../../constants';

interface ExamViewProps {
    students: Student[];
    exams: MakeUpExam[];
    subjects: string[];
    newExam: MakeUpExam;
    setNewExam: (exam: MakeUpExam) => void;
    newSubjectName: string;
    setNewSubjectName: (name: string) => void;
    filterExamGrade: string;
    setFilterExamGrade: (grade: string) => void;
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
    onDeleteExam: (id: string) => void;
}

export const ExamView = ({
    students,
    exams,
    subjects,
    newExam, setNewExam,
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
    onDeleteExam
}: ExamViewProps) => {

    if (showSubjectCatalog) {
        return (
            <div className="space-y-6">
                 <div className="flex items-center space-x-2 mb-6">
                    <Button variant="secondary" onClick={() => setShowSubjectCatalog(false)} className="!p-2">
                        <ArrowLeft size={20}/>
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

        const matchesGrade = filterExamGrade ? student.grade === filterExamGrade : true;
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
                            <Select
                                value={newExam.studentId}
                                onChange={e => setNewExam({...newExam, studentId: e.target.value})}
                            >
                                <option value="">Selecione o Aluno...</option>
                                {(students || []).sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.grade}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matéria</label>
                             <Select
                                value={newExam.subject}
                                onChange={e => setNewExam({...newExam, subject: e.target.value})}
                            >
                                <option value="">Selecione a Matéria...</option>
                                {(subjects || []).sort().map(s => <option key={s} value={s}>{s}</option>)}
                             </Select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Período/Etapa</label>
                             <Select
                                value={newExam.period}
                                onChange={e => setNewExam({...newExam, period: e.target.value as AcademicPeriod})}
                            >
                                {ACADEMIC_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                             </Select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data Original da Prova</label>
                             <Input type="date" value={newExam.originalDate} onChange={e => setNewExam({...newExam, originalDate: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Motivo</label>
                             <Input placeholder="Ex: Doença, Viagem..." value={newExam.reason} onChange={e => setNewExam({...newExam, reason: e.target.value})} />
                        </div>
                        <Button className="w-full" onClick={onSaveExam}>
                            <Plus size={18} /> Agendar
                        </Button>
                    </div>
                </Card>

                 <Card className="p-6">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><Filter size={16} className="mr-2"/> Filtros</h3>
                     <div className="space-y-3">
                        <Select value={filterExamGrade} onChange={e => setFilterExamGrade(e.target.value)}>
                            <option value="">Todas as Turmas</option>
                            {visibleGradesList.map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                        <Select value={filterExamShift} onChange={e => setFilterExamShift(e.target.value)}>
                            <option value="">Todos os Turnos</option>
                            {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                     </div>
                </Card>
            </div>

            <div className="lg:col-span-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredExams.map(exam => {
                        const student = (students || []).find(s => s.id === exam.studentId);
                        return (
                            <Card key={exam.id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                <img
                                                    src={student?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.id}`}
                                                    alt={student?.name}
                                                    className="w-full h-full rounded-full object-cover border border-slate-200 dark:border-slate-600 bg-white"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate" title={student?.name}>{student?.name}</h4>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">{student?.grade} • {student?.shift}</div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 items-end flex-shrink-0 ml-2">
                                            <Badge color="blue">{exam.subject}</Badge>
                                            <Badge color="slate">{exam.period}</Badge>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        <p className="text-sm text-slate-600 dark:text-slate-300">
                                            <span className="font-bold text-xs uppercase text-slate-400 block mb-1">Motivo</span>
                                            {exam.reason}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-400">Data: {new Date(exam.originalDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                        <Button variant="danger" className="!p-1.5 !text-xs" onClick={() => onDeleteExam(exam.id)} title="Remover">
                                            <Trash2 size={14}/>
                                        </Button>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                                        <button
                                            title="Pendente"
                                            onClick={() => onUpdateExamStatus(exam.id, 'Pending')}
                                            className={`flex-1 p-1 rounded text-center transition-colors ${exam.status === 'Pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <Clock size={16} className="mx-auto"/>
                                        </button>
                                         <button
                                            title="Concluída"
                                            onClick={() => onUpdateExamStatus(exam.id, 'Completed')}
                                            className={`flex-1 p-1 rounded text-center transition-colors ${exam.status === 'Completed' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <CheckCircle2 size={16} className="mx-auto"/>
                                        </button>
                                         <button
                                            title="Cancelada"
                                            onClick={() => onUpdateExamStatus(exam.id, 'Cancelled')}
                                            className={`flex-1 p-1 rounded text-center transition-colors ${exam.status === 'Cancelled' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            <XCircle size={16} className="mx-auto"/>
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                     {filteredExams.length === 0 && (
                         <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <ClipboardList size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Nenhum agendamento encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
};
