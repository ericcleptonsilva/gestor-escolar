import React, { useState } from 'react';
import {
  Users,
  CalendarCheck,
  FileText,
  ClipboardList,
  BarChart3,
  ShieldAlert,
  Phone,
  Eye,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PrintButton } from '@/components/features/PrintButton';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { AppState, Student, ViewState, Occurrence } from '@/types';

interface DashboardViewProps {
  state: AppState;
  visibleStudents: Student[];
  handlePrint: () => void;
  setView: (view: ViewState) => void;
  onSelectStudent: (student: Student) => void;
  onSaveOccurrence: (occurrence: Occurrence) => Promise<void>;
}

export const DashboardView = ({ state, visibleStudents, handlePrint, setView, onSelectStudent, onSaveOccurrence }: DashboardViewProps) => {
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [absenceThreshold, setAbsenceThreshold] = useState(3);
    const [pendingUpdates, setPendingUpdates] = useState<Record<string, { status: string, date: string }>>({});
    const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

    const handlePendingChange = (studentId: string, field: 'status' | 'date', value: string) => {
        setPendingUpdates(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSaveRow = async (student: Student) => {
        const pending = pendingUpdates[student.id];
        // If no pending changes, but we want to save (maybe just to confirm contact without changing fields if they were pre-filled?)
        // But if there are no pending changes, pending is undefined.
        // We should allow saving if there is an existing record or if pending is set.

        const existing = (state.occurrences || []).find(o => o.studentId === student.id && o.type === 'ConsecutiveAbsence');

        // If nothing changed and nothing exists, and we click save, we probably want to save defaults?
        // Let's assume user must select something if it's new.
        const statusToSave = pending?.status || existing?.status;
        if (!statusToSave) {
            // User didn't select status
            return;
        }

        const occurrence: Occurrence = {
            id: existing?.id || Math.random().toString(36).substr(2, 9),
            studentId: student.id,
            type: 'ConsecutiveAbsence',
            status: statusToSave,
            date: pending?.date || existing?.date || new Date().toISOString().split('T')[0],
            observation: existing?.observation || ''
        };

        setIsSaving(prev => ({ ...prev, [student.id]: true }));
        try {
            await onSaveOccurrence(occurrence);

            const newPending = { ...pendingUpdates };
            delete newPending[student.id];
            setPendingUpdates(newPending);
        } finally {
            setIsSaving(prev => {
                const newState = { ...prev };
                delete newState[student.id];
                return newState;
            });
        }
    };

    const totalStudents = visibleStudents.length;
    const presentToday = state.attendance.filter(a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Present').length;

    const consecutiveAbsenceStudents = visibleStudents.filter(student => {
        // Get all attendance records for this student
        const studentRecords = state.attendance
            .filter(a => a.studentId === student.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort descending (newest first)

        // If not enough records, can't determine consecutive absence
        if (studentRecords.length < absenceThreshold) return false;

        // Take the latest N records
        const recentRecords = studentRecords.slice(0, absenceThreshold);

        // Check if ALL of them are 'Absent'
        return recentRecords.every(r => r.status === 'Absent');
    });

    return (
      <div className="space-y-6">
        <Modal 
            isOpen={showAbsenceModal} 
            onClose={() => setShowAbsenceModal(false)} 
            title={`Alunos com ${absenceThreshold}+ Faltas Consecutivas (${consecutiveAbsenceStudents.length})`}
        >
            <div className="space-y-4">
                {consecutiveAbsenceStudents.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Nenhum aluno com faltas consecutivas nos últimos {absenceThreshold} dias.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {consecutiveAbsenceStudents.map(student => {
                            const existing = (state.occurrences || [])
                                .filter(o => o.studentId === student.id && o.type === 'ConsecutiveAbsence')
                                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                            const pending = pendingUpdates[student.id];
                            const currentStatus = pending?.status ?? existing?.status ?? '';
                            const currentDate = pending?.date ?? existing?.date ?? new Date().toISOString().split('T')[0];

                            return (
                                <div key={student.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex flex-col gap-3">
                                    <div className="flex justify-between items-center w-full">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 flex-shrink-0">
                                                 <img
                                                    src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                                    alt={student.name}
                                                    className="w-full h-full rounded-full object-cover border border-slate-200 dark:border-slate-600 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-white">{student.name}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {student.grade} • {student.shift} • Mat: {student.registration}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right text-xs hidden sm:block">
                                                 {student.motherPhone && (
                                                    <div className="flex items-center justify-end text-emerald-600 dark:text-emerald-400 mb-1">
                                                        <Phone size={12} className="mr-1" />
                                                        <span>Mãe: {student.motherPhone}</span>
                                                    </div>
                                                 )}
                                                 {student.fatherPhone && (
                                                    <div className="flex items-center justify-end text-blue-600 dark:text-blue-400">
                                                        <Phone size={12} className="mr-1" />
                                                        <span>Pai: {student.fatherPhone}</span>
                                                    </div>
                                                 )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    onSelectStudent(student);
                                                    setView('students');
                                                    setShowAbsenceModal(false);
                                                }}
                                                className="ml-1 p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full transition-colors"
                                                title="Ver Detalhes do Aluno"
                                            >
                                                <Eye size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-12">
                                        <Select
                                            value={currentStatus}
                                            onChange={(e) => handlePendingChange(student.id, 'status', e.target.value)}
                                            className="!w-48 !py-1 !text-xs"
                                        >
                                            <option value="">Status do Contato...</option>
                                            <option value="Obteve contato">Obteve contato</option>
                                            <option value="Não obteve contato">Não obteve contato</option>
                                        </Select>

                                        {currentStatus === 'Obteve contato' && (
                                            <Input
                                                type="date"
                                                value={currentDate}
                                                onChange={(e) => handlePendingChange(student.id, 'date', e.target.value)}
                                                className="!w-36 !py-1 !text-xs"
                                            />
                                        )}

                                        <button
                                            onClick={() => handleSaveRow(student)}
                                            disabled={isSaving[student.id] || !currentStatus || (currentStatus === existing?.status && currentDate === existing?.date)}
                                            className={`p-1.5 rounded transition-colors ${
                                                isSaving[student.id] || !currentStatus || (currentStatus === existing?.status && currentDate === existing?.date)
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600'
                                                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                            }`}
                                            title="Salvar Registro de Contato"
                                        >
                                            {isSaving[student.id] ? (
                                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Check size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-right">
                    <button 
                        onClick={() => setShowAbsenceModal(false)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </Modal>
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Painel Geral</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Bem-vindo ao Gestor de Alunos</p>
          </div>
          <PrintButton onClick={handlePrint} />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="p-6 border-l-4 border-l-indigo-500 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Alunos</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{totalStudents}</h3>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Users size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Presenças Hoje</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{presentToday}</h3>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <CalendarCheck size={24} />
              </div>
            </div>
          </Card>

           <Card className="p-6 border-l-4 border-l-amber-500 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Provas Pendentes</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{state.exams.filter(e => e.status === 'Pending').length}</h3>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <ClipboardList size={24} />
              </div>
            </div>
          </Card>

           <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Documentos</p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{state.documents.length}</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <FileText size={24} />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card className="p-6 border-l-4 border-l-red-500 hover:shadow-md transition-all">
                <div className="flex justify-between items-start cursor-pointer" onClick={() => setShowAbsenceModal(true)}>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Faltas Consecutivas</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{consecutiveAbsenceStudents.length}</h3>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                        <ShieldAlert size={24} />
                    </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-400">Considerar últimos:</span>
                    <Select 
                        value={absenceThreshold} 
                        onChange={(e) => setAbsenceThreshold(Number(e.target.value))}
                        className="!w-auto !py-1 !px-2 !text-xs"
                    >
                        <option value={3}>3 Dias</option>
                        <option value={5}>5 Dias (1 Sem)</option>
                        <option value={7}>7 Dias</option>
                        <option value={10}>10 Dias</option>
                        <option value={15}>15 Dias</option>
                    </Select>
                </div>
            </Card>

             <Card className="p-6 lg:col-span-2">
                <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center">
                    <BarChart3 className="mr-2 text-indigo-600 dark:text-indigo-400" size={20}/>
                    Distribuição por Série
                </h3>
                <div className="space-y-3">
                    {Object.entries(
                        visibleStudents.reduce((acc: Record<string, number>, curr) => {
                            const currentCount = acc[curr.grade] || 0;
                            acc[curr.grade] = currentCount + 1;
                            return acc;
                        }, {} as Record<string, number>)
                    ).map(([grade, count]) => (
                        <div key={grade}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">{grade}</span>
                                <span className="text-slate-900 dark:text-white font-bold">{count}</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(Number(count) / totalStudents) * 100}%` }}></div>
                            </div>
                        </div>
                    ))}
                    {totalStudents === 0 && <p className="text-slate-400 italic">Nenhum aluno cadastrado.</p>}
                </div>
             </Card>
        </div>
      </div>
    );
};
