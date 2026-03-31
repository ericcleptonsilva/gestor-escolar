import React, { useState, useMemo } from 'react';
import { 
    ChevronLeft, 
    Calendar, 
    History, 
    User as UserIcon, 
    Mail, 
    Hash, 
    BookOpen,
    Clock,
    AlertCircle,
    FileText,
    CheckCircle
} from 'lucide-react';
import { AppState, User as UserType, CoordinationRecord, TeacherSchedule } from '@/types';
import { Button } from '@/components/ui/Button';

interface TeacherDetailViewProps {
    teacher: UserType;
    state: AppState;
    onBack: () => void;
}

export function TeacherDetailView({ teacher, state, onBack }: TeacherDetailViewProps) {
    const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'history'>('schedule');

    const teacherRecords = useMemo(() => {
        return (state.coordinationRecords || [])
            .filter(r => r.teacherId === teacher.id)
            .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime());
    }, [state.coordinationRecords, teacher.id]);

    const stats = useMemo(() => {
        const absences = teacherRecords.filter(r => r.type === 'TEACHER_ABSENCE').length;
        const total = teacherRecords.length;
        return { absences, total };
    }, [teacherRecords]);

    const getDayName = (day: string) => {
        const days: Record<string, string> = {
            'seg': 'Segunda-feira',
            'ter': 'Terça-feira',
            'qua': 'Quarta-feira',
            'qui': 'Quinta-feira',
            'sex': 'Sexta-feira',
            'sab': 'Sábado'
        };
        return days[day] || day;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Back Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={onBack} className="!rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={20} /> <span className="hidden sm:inline ml-1 font-bold">Voltar</span>
                </Button>
                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Detalhes do Professor</h2>
            </div>

            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="relative">
                            <img 
                                src={teacher.photoUrl} 
                                alt={teacher.name} 
                                className="w-32 h-32 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100" 
                            />
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full shadow-lg"></div>
                        </div>
                        <div className="flex gap-4 mb-2">
                            <div className="text-center px-6 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Faltas</p>
                                <p className="text-xl font-black text-red-500">{stats.absences}</p>
                            </div>
                            <div className="text-center px-6 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Registros</p>
                                <p className="text-xl font-black text-indigo-500">{stats.total}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white leading-tight mb-2">{teacher.name}</h1>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <Hash size={16} className="text-indigo-500" />
                                    <span className="font-bold">Matrícula:</span> {teacher.registration || 'Não informada'}
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <Mail size={16} className="text-indigo-500" />
                                    <span className="font-bold">E-mail:</span> {teacher.email}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col justify-end">
                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed italic">
                                    "Professor(a) vinculado(a) a {(teacher.classes || []).length} turma(s) e disciplina(s)."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex border-b border-slate-100 dark:border-slate-700 p-2 gap-2">
                    <button 
                        onClick={() => setActiveSubTab('schedule')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeSubTab === 'schedule' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    >
                        <Calendar size={18} /> Cronograma de Aulas
                    </button>
                    <button 
                        onClick={() => setActiveSubTab('history')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${activeSubTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    >
                        <History size={18} /> Histórico de Registros
                    </button>
                </div>

                <div className="p-6">
                    {activeSubTab === 'schedule' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(teacher.classes || []).length === 0 ? (
                                <div className="col-span-full py-12 text-center text-slate-400 font-medium">Nenhuma turma ou disciplina vinculada.</div>
                            ) : (
                                (teacher.classes || []).map((c, i) => (
                                    <div key={i} className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                                                <BookOpen size={20} className="text-indigo-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-700 dark:text-slate-200 leading-none mb-1">{c.subject}</h4>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.grade} • {c.shift}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            {(c.schedules || []).length > 0 ? (
                                                c.schedules.map((sch, idx) => (
                                                    <div key={idx} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{getDayName(sch.dayOfWeek)}</span>
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg">
                                                            <Clock size={10} />
                                                            {sch.startTime} - {sch.endTime}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-slate-400 italic text-center py-2">Sem horário definido</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeSubTab === 'history' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Tipo</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Observação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {teacherRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium italic">Nenhum registro encontrado para este professor.</td>
                                        </tr>
                                    ) : (
                                        teacherRecords.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                                    {new Date(r.deliveryDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`p-1.5 rounded-lg ${r.type === 'TEACHER_ABSENCE' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                            {r.type === 'TEACHER_ABSENCE' ? <AlertCircle size={14} /> : <FileText size={14} />}
                                                        </div>
                                                        <span className="font-medium">{r.type === 'TEACHER_ABSENCE' ? 'Falta' : r.type}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${
                                                        r.status.includes('Falta') || r.status === 'Em Atraso'
                                                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'
                                                            : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30'
                                                    }`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 italic max-w-xs truncate">
                                                    {(() => {
                                                        if (!r.observation) return '-';
                                                        try {
                                                            const parsed = JSON.parse(r.observation);
                                                            if (parsed && parsed.msg) {
                                                                return (
                                                                    <span>
                                                                        <span className="font-bold text-red-500">{parsed.msg}</span>
                                                                        {parsed.extraObs ? ` | ${parsed.extraObs}` : ''}
                                                                    </span>
                                                                );
                                                            }
                                                        } catch(e) {}
                                                        return r.observation;
                                                    })()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
