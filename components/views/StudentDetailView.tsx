import React from 'react';
import { ArrowLeft, Edit3, Trash2, MessageCircle, CalendarCheck, FileText, ClipboardList, Activity, BookOpen, CreditCard, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Student, AppState, User, ViewState } from '../../types';

interface StudentDetailViewProps {
    student: Student;
    state: AppState;
    currentUser: User | null;
    onEdit: (student: Student) => void;
    onDelete: (id: string) => void;
    onBack: () => void;
    setView: (view: ViewState) => void;
}

export const StudentDetailView = ({
    student,
    state,
    currentUser,
    onEdit,
    onDelete,
    onBack,
    setView
}: StudentDetailViewProps) => {
    const studentAttendance = state.attendance.filter(a => a.studentId === student.id);
    const absences = studentAttendance.filter(a => a.status === 'Absent').length;
    const presents = studentAttendance.filter(a => a.status === 'Present').length;
    const excused = studentAttendance.filter(a => a.status === 'Excused').length;
    const total = studentAttendance.length;
    const frequency = total > 0 ? ((presents + excused) / total * 100).toFixed(1) : '100';

    const studentDocs = state.documents.filter(d => d.studentId === student.id);
    const studentExams = state.exams.filter(e => e.studentId === student.id);

    const formatWhatsAppLink = (phone: string) => {
        if (!phone) return '#';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) return '#';
        return `https://wa.me/55${cleaned}`;
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center space-x-4 mb-2">
            <Button variant="secondary" onClick={onBack} className="!p-2" title="Voltar">
                <ArrowLeft size={20}/>
            </Button>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Detalhes do Aluno</h2>
            <div className="flex-1"></div>
            {currentUser?.role !== 'Teacher' && (
                <>
                    <Button variant="outline" onClick={() => onEdit(student)}>
                        <Edit3 size={16} className="mr-2"/> <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button variant="danger" onClick={() => onDelete(student.id)}>
                        <Trash2 size={16} className="mr-2"/> <span className="hidden sm:inline">Excluir</span>
                    </Button>
                </>
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-1 h-fit">
                <div className="flex flex-col items-center text-center">
                    <div className="relative w-32 h-32 mb-4">
                         <img
                            src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                            alt={student.name}
                            className="w-full h-full rounded-full object-cover border-4 border-indigo-50 dark:border-indigo-900/50 bg-white dark:bg-slate-700"
                        />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{student.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">Matrícula: {student.registration}</p>

                    <div className="w-full grid grid-cols-2 gap-2 mb-6">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                            <span className="block text-xs text-slate-500 uppercase font-bold">Série</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{student.grade}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-2 rounded-lg">
                            <span className="block text-xs text-slate-500 uppercase font-bold">Turno</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">{student.shift}</span>
                        </div>
                    </div>

                    <div className="w-full text-left space-y-3 border-t border-slate-100 dark:border-slate-700 pt-4">
                        <div>
                            <span className="text-xs text-slate-400 block mb-1">Responsáveis</span>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Pai: {student.fatherName || '-'}</div>
                             {student.fatherPhone && (
                                <a href={formatWhatsAppLink(student.fatherPhone)} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1 hover:underline">
                                    <MessageCircle size={12} className="mr-1"/> {student.fatherPhone}
                                </a>
                            )}
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">Mãe: {student.motherName || '-'}</div>
                             {student.motherPhone && (
                                <a href={formatWhatsAppLink(student.motherPhone)} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1 hover:underline">
                                    <MessageCircle size={12} className="mr-1"/> {student.motherPhone}
                                </a>
                            )}
                        </div>

                        <div>
                            <span className="text-xs text-slate-400 block mb-1">Nascimento</span>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : '-'}
                            </div>
                        </div>

                        <div>
                            <span className="text-xs text-slate-400 block mb-1">Email</span>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={student.email}>{student.email || '-'}</div>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Card className="p-4 flex flex-col items-center justify-center text-center bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 shadow-none">
                        <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400 mb-1">Frequência Global</span>
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">{frequency}%</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{absences} faltas em {total} dias</span>
                     </Card>

                     <Card className="p-4 flex flex-col items-center justify-center text-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 shadow-none">
                        <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">Livro Didático</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{student.bookStatus}</span>
                     </Card>

                     <Card className="p-4 flex flex-col items-center justify-center text-center bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 shadow-none">
                        <span className="text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">Atestado Ed. Física</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{student.peStatus}</span>
                     </Card>

                     <Card className={`p-4 flex flex-col items-center justify-center text-center shadow-none ${
                        student.hasAgenda
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700'
                     }`}>
                        <span className={`text-xs font-bold uppercase mb-1 ${
                            student.hasAgenda ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                        }`}>Agenda</span>
                        <span className="text-lg font-bold text-slate-800 dark:text-white">{student.hasAgenda ? 'Sim' : 'Não'}</span>
                     </Card>
                </div>

                <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-3 flex items-center">
                            <CalendarCheck className="mr-2 text-indigo-500" size={20}/>
                            Histórico de Frequência (Últimos 5 registros)
                        </h4>
                        <Card className="overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 uppercase tracking-wider text-xs font-bold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="p-3 whitespace-nowrap">Data</th>
                                        <th className="p-3 whitespace-nowrap">Status</th>
                                        <th className="p-3 whitespace-nowrap">Obs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {[...studentAttendance]
                                        .sort((a, b) => b.date.localeCompare(a.date))
                                        .slice(0, 5)
                                        .map(a => (
                                        <tr key={a.id}>
                                            <td className="p-3 text-slate-700 dark:text-slate-300">{new Date(a.date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</td>
                                            <td className="p-3">
                                                <Badge color={a.status === 'Present' ? 'green' : a.status === 'Absent' ? 'red' : 'yellow'}>
                                                    {a.status === 'Present' ? 'Presente' : a.status === 'Absent' ? 'Falta' : 'Justificado'}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-slate-500 italic">{a.observation || '-'}</td>
                                        </tr>
                                    ))}
                                    {studentAttendance.length === 0 && (
                                        <tr><td colSpan={3} className="p-4 text-center text-slate-400">Nenhum registro de frequência.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            {studentAttendance.length > 5 && (
                                <div className="p-2 text-center border-t border-slate-100 dark:border-slate-700">
                                    <button onClick={() => setView('attendance')} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline">Ver Histórico Completo na Frequência</button>
                                </div>
                            )}
                        </Card>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-3 flex items-center">
                            <FileText className="mr-2 text-blue-500" size={20}/>
                            Documentos de Saúde
                        </h4>
                        {studentDocs.length > 0 ? (
                            <div className="space-y-2">
                                {studentDocs.map(d => (
                                    <div key={d.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{d.type}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Emitido em: {new Date(d.dateIssued).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                            {d.description && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">"{d.description}"</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Nenhum documento cadastrado.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-3 flex items-center">
                            <ClipboardList className="mr-2 text-amber-500" size={20}/>
                            Provas de 2ª Chamada
                        </h4>
                         {studentExams.length > 0 ? (
                            <div className="space-y-2">
                                {studentExams.map(e => (
                                    <div key={e.id} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white">{e.subject} <span className="text-xs font-normal text-slate-500">({e.period})</span></p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Data Original: {new Date(e.originalDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Motivo: {e.reason}</p>
                                        </div>
                                        <Badge color={e.status === 'Completed' ? 'green' : e.status === 'Cancelled' ? 'red' : 'yellow'}>
                                            {e.status === 'Pending' ? 'Pendente' : e.status === 'Completed' ? 'Concluída' : 'Cancelada'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Nenhuma prova agendada.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
};
