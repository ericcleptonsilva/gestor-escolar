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
  Save,
  CheckSquare
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PrintButton } from '@/components/features/PrintButton';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { AppState, Student, ViewState } from '@/types';
import { api } from '@/services/api';

interface DashboardViewProps {
  state: AppState;
  visibleStudents: Student[];
  handlePrint: () => void;
  setView: (view: ViewState) => void;
  onSelectStudent?: (student: Student) => void;
}

export const DashboardView = ({ state, visibleStudents, handlePrint, setView, onSelectStudent }: DashboardViewProps) => {
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [absenceThreshold, setAbsenceThreshold] = useState(3);
    const [occurrenceData, setOccurrenceData] = useState<Record<string, { obs: string, contacted: boolean, saved: boolean }>>({});

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

    const updateOccurrenceData = (studentId: string, field: 'obs' | 'contacted', value: any) => {
        setOccurrenceData(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value,
                saved: false
            }
        }));
    };

    const handleSaveOccurrence = async (student: Student) => {
        const data = occurrenceData[student.id] || { obs: '', contacted: false };

        try {
             await api.saveOccurrence({
                 id: Math.random().toString(36).substr(2, 9),
                 studentId: student.id,
                 date: new Date().toISOString().split('T')[0],
                 type: 'ConsecutiveAbsence',
                 description: data.obs || `Alerta de faltas consecutivas (${absenceThreshold}+ dias)`,
                 contactedParents: data.contacted
             });

             setOccurrenceData(prev => ({
                ...prev,
                [student.id]: { ...prev[student.id], saved: true }
             }));
        } catch (e) {
             alert("Erro ao salvar ocorrência.");
        }
    };

    return (
      <div className="space-y-6">
        <Modal 
            isOpen={showAbsenceModal} 
            onClose={() => setShowAbsenceModal(false)} 
            title={`Alunos com ${absenceThreshold}+ Faltas Consecutivas (${consecutiveAbsenceStudents.length})`}
        >
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {consecutiveAbsenceStudents.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">Nenhum aluno com faltas consecutivas nos últimos {absenceThreshold} dias.</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {consecutiveAbsenceStudents.map(student => {
                            const data = occurrenceData[student.id] || { obs: '', contacted: false, saved: false };

                            return (
                                <div key={student.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 flex flex-col space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white flex items-center">
                                                {student.name}
                                                {onSelectStudent && (
                                                    <button
                                                        onClick={() => {
                                                            onSelectStudent(student);
                                                            setView('students');
                                                        }}
                                                        className="ml-2 p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                        title="Ver Detalhes do Aluno"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {student.grade} • {student.shift} • Mat: {student.registration}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs space-y-1">
                                            {student.motherPhone && (
                                                <div className="flex items-center justify-end text-emerald-600 dark:text-emerald-400">
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
                                    </div>

                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-600 space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`contact-${student.id}`}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                                checked={data.contacted}
                                                onChange={(e) => updateOccurrenceData(student.id, 'contacted', e.target.checked)}
                                            />
                                            <label htmlFor={`contact-${student.id}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center">
                                                <CheckSquare size={14} className="mr-1.5 opacity-70"/>
                                                Contato Realizado com Responsáveis
                                            </label>
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 text-sm rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="Observação do contato..."
                                                value={data.obs}
                                                onChange={(e) => updateOccurrenceData(student.id, 'obs', e.target.value)}
                                            />
                                            <button
                                                onClick={() => handleSaveOccurrence(student)}
                                                disabled={data.saved}
                                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-colors ${
                                                    data.saved
                                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                            >
                                                {data.saved ? (
                                                    <span>Salvo</span>
                                                ) : (
                                                    <>
                                                        <Save size={14} className="mr-1" />
                                                        Salvar
                                                    </>
                                                )}
                                            </button>
                                        </div>
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
