import React, { useState } from 'react';
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
    const [showAllAttendance, setShowAllAttendance] = useState(false);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center space-x-3">
                    <Button variant="secondary" onClick={onBack} className="!p-2.5 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all" title="Voltar">
                        <ArrowLeft size={20} />
                    </Button>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Detalhes do Aluno</h2>
                </div>

                {currentUser?.role !== 'Teacher' && (
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => onEdit(student)} className="flex-1 sm:flex-none !rounded-xl !py-2.5">
                            <Edit3 size={16} className="mr-2 text-indigo-500" /> <span className="text-sm font-bold uppercase tracking-wider">Editar</span>
                        </Button>
                        <Button variant="danger" onClick={() => onDelete(student.id)} className="flex-1 sm:flex-none !rounded-xl !py-2.5">
                            <Trash2 size={16} className="mr-2" /> <span className="text-sm font-bold uppercase tracking-wider">Excluir</span>
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-1 h-fit bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-indigo-50 dark:border-indigo-900/30 shadow-2xl transition-transform hover:scale-105 duration-300">
                                <img
                                    src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                    alt={student.name}
                                    className="w-full h-full object-cover bg-slate-100 dark:bg-slate-700"
                                />
                            </div>
                            {student.turnstileRegistered && (
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-slate-800">
                                    <CreditCard size={14} />
                                </div>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{student.name}</h3>
                        <p className="text-sm text-slate-400 dark:text-slate-500 font-bold mb-6 tracking-widest uppercase">Matrícula: {student.registration}</p>

                        <div className="w-full grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/20">
                                <span className="block text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-1">Série</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{student.grade}</span>
                            </div>
                            <div className="bg-slate-100/50 dark:bg-slate-700/30 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-600/20">
                                <span className="block text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Turno</span>
                                <span className="font-bold text-slate-700 dark:text-slate-200">{student.shift}</span>
                            </div>
                        </div>

                        <div className="w-full text-left space-y-5 border-t border-slate-100 dark:border-slate-700 pt-6">
                            <div>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-2">Responsáveis</span>
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-white flex items-center justify-between">
                                            <span>Pai: {student.fatherName || '-'}</span>
                                            {student.fatherPhone && (
                                                <a href={formatWhatsAppLink(student.fatherPhone)} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:scale-110 transition-transform">
                                                    <MessageCircle size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-700 dark:text-white flex items-center justify-between">
                                            <span>Mãe: {student.motherName || '-'}</span>
                                            {student.motherPhone && (
                                                <a href={formatWhatsAppLink(student.motherPhone)} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:scale-110 transition-transform">
                                                    <MessageCircle size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-2">Informações Adicionais</span>
                                <div className="space-y-2">
                                    <div className="flex items-center text-sm font-medium">
                                        <Calendar size={14} className="mr-2 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            {student.birthDate ? new Date(student.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Data não informada'}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm font-medium">
                                        <FileText size={14} className="mr-2 text-slate-400" />
                                        <span className="text-slate-600 dark:text-slate-300 truncate" title={student.email}>
                                            {student.email || 'Email não informado'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Card className="p-4 flex flex-col items-center justify-center text-center bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 shadow-none rounded-2xl">
                            <span className="text-[10px] font-black uppercase text-indigo-400 mb-1 tracking-widest">Frequência</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-white">{frequency}%</span>
                            <span className="text-[9px] font-bold text-slate-400 mt-1">{absences} FALTAS / {total} DIAS</span>
                        </Card>

                        <Card className="p-4 flex flex-col items-center justify-center text-center bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 shadow-none rounded-2xl">
                            <span className="text-[10px] font-black uppercase text-emerald-400 mb-1 tracking-widest">Livro</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{student.bookStatus}</span>
                        </Card>

                        <Card className="p-4 flex flex-col items-center justify-center text-center bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 shadow-none rounded-2xl">
                            <span className="text-[10px] font-black uppercase text-amber-400 mb-1 tracking-widest">Atestado EF</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase leading-tight">{student.peStatus}</span>
                        </Card>

                        <Card className={`p-4 flex flex-col items-center justify-center text-center shadow-none rounded-2xl ${student.hasAgenda
                                ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20'
                                : 'bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700'
                            }`}>
                            <span className={`text-[10px] font-black uppercase mb-1 tracking-widest ${student.hasAgenda ? 'text-emerald-400' : 'text-slate-400'
                                }`}>Agenda</span>
                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase">{student.hasAgenda ? 'SIM' : 'NÃO'}</span>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center">
                                    <CalendarCheck className="mr-2 text-indigo-500" size={18} />
                                    {showAllAttendance ? 'Histórico Completo' : 'Histórico Recente'}
                                </h4>
                                {studentAttendance.length > 5 && (
                                    <button onClick={() => setShowAllAttendance(!showAllAttendance)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
                                        {showAllAttendance ? 'Ver menos' : 'Ver tudo'}
                                    </button>
                                )}
                            </div>

                            <Card className="overflow-hidden border-slate-200/60 dark:border-slate-700/60 rounded-2xl">
                                <div className="hidden sm:block">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50/50 dark:bg-slate-800 uppercase tracking-widest text-[10px] font-black text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                            <tr>
                                                <th className="p-4 whitespace-nowrap">Data</th>
                                                <th className="p-4 whitespace-nowrap text-center">Status</th>
                                                <th className="p-4 whitespace-nowrap">Observação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {[...studentAttendance]
                                                .sort((a, b) => b.date.localeCompare(a.date))
                                                .slice(0, showAllAttendance ? undefined : 5)
                                                .map(a => (
                                                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                                                        <td className="p-4 text-center">
                                                            <Badge color={a.status === 'Present' ? 'green' : a.status === 'Absent' ? 'red' : 'yellow'}>
                                                                {a.status === 'Present' ? 'Presente' : a.status === 'Absent' ? 'Falta' : 'Justificado'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-slate-500 italic max-w-xs truncate">{a.observation || '-'}</td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-700">
                                    {[...studentAttendance]
                                        .sort((a, b) => b.date.localeCompare(a.date))
                                        .slice(0, showAllAttendance ? undefined : 5)
                                        .map(a => (
                                            <div key={a.id} className="p-4 flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-slate-700 dark:text-slate-300">{new Date(a.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</div>
                                                    <div className="text-[10px] text-slate-400 italic truncate w-40">{a.observation || 'Sem observação'}</div>
                                                </div>
                                                <Badge color={a.status === 'Present' ? 'green' : a.status === 'Absent' ? 'red' : 'yellow'}>
                                                    {a.status === 'Present' ? 'P' : a.status === 'Absent' ? 'F' : 'J'}
                                                </Badge>
                                            </div>
                                        ))}
                                </div>
                                {studentAttendance.length === 0 && (
                                    <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-800 m-4 rounded-xl">
                                        <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest">Nenhum registro encontrado</p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center">
                                    <FileText className="mr-2 text-blue-500" size={18} />
                                    Saúde
                                </h4>
                                {studentDocs.length > 0 ? (
                                    <div className="space-y-3">
                                        {studentDocs.map(d => (
                                            <Card key={d.id} className="p-4 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">{d.type}</p>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(d.dateIssued).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                </div>
                                                {d.description && <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg italic">"{d.description}"</p>}
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700 uppercase tracking-widest font-bold">Nenhum documento</p>
                                )}
                            </div>

                            <div>
                                <h4 className="font-black text-sm uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4 flex items-center">
                                    <ClipboardList className="mr-2 text-amber-500" size={18} />
                                    2ª Chamada
                                </h4>
                                {studentExams.length > 0 ? (
                                    <div className="space-y-3">
                                        {studentExams.map(e => (
                                            <Card key={e.id} className="p-4 bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tight">{e.subject}</p>
                                                    <Badge size="sm" color={e.status === 'Completed' ? 'green' : e.status === 'Cancelled' ? 'red' : 'yellow'}>
                                                        {e.status === 'Pending' ? 'P' : e.status === 'Completed' ? 'C' : 'X'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
                                                    <span>{e.period}</span>
                                                    <span>{new Date(e.originalDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-50 dark:border-slate-700 pt-2 italic line-clamp-2">"{e.reason}"</p>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-700 uppercase tracking-widest font-bold">Nenhuma prova</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
