import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, AlertCircle, Loader2, UploadCloud, RefreshCw, ChevronDown, Check, Search, BarChart2, Calendar, X, Edit2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { PrintButton } from '@/components/features/PrintButton';
import { AppState, Student, AttendanceStatus, AttendanceRecord, User } from '@/types';
import { SHIFTS_LIST } from '@/constants';

interface AttendanceViewProps {
    students: Student[]; // All visible students
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    attendance: AppState['attendance'];
    attendanceDate: string;
    setAttendanceDate: (date: string) => void;
    selectedClass: string[];
    setSelectedClass: (cls: string[]) => void;
    selectedShift: string[];
    setSelectedShift: (shift: string[]) => void;
    filterAttendanceStatus: string[];
    setFilterAttendanceStatus: (status: string[]) => void;
    visibleGradesList: string[];
    onPrint: () => void;
    onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
    onUpdateStatusByDate: (studentId: string, date: string, status: AttendanceStatus) => void;
    onUpdateObservation: (studentId: string, obs: string) => void;
    onImportTurnstile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImportTurnstileLocal: () => void;
    isImportingTurnstile: boolean;
    importMorningStart: string;
    setImportMorningStart: (time: string) => void;
    importMorningEnd: string;
    setImportMorningEnd: (time: string) => void;
    importAfternoonStart: string;
    setImportAfternoonStart: (time: string) => void;
    importAfternoonEnd: string;
    setImportAfternoonEnd: (time: string) => void;
    currentUser: User | null;
}

export const AttendanceView = ({
    students,
    searchTerm, setSearchTerm,
    attendance,
    attendanceDate, setAttendanceDate,
    selectedClass, setSelectedClass,
    selectedShift, setSelectedShift,
    filterAttendanceStatus, setFilterAttendanceStatus,
    visibleGradesList,
    onPrint,
    onUpdateStatus,
    onUpdateStatusByDate,
    onUpdateObservation,
    onImportTurnstile,
    onImportTurnstileLocal,
    isImportingTurnstile,
    importMorningStart, setImportMorningStart,
    importMorningEnd, setImportMorningEnd,
    importAfternoonStart, setImportAfternoonStart,
    importAfternoonEnd, setImportAfternoonEnd,
    currentUser
}: AttendanceViewProps) => {

    const [showSyncSettings, setShowSyncSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<'daily' | 'period'>('daily');

    // --- Modal de edição de falta por período ---
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [editingRecords, setEditingRecords] = useState<AttendanceRecord[]>([]);

    // --- Estados do Relatório por Período ---
    const today = new Date().toISOString().split('T')[0];
    const firstOfMonth = today.slice(0, 8) + '01';
    const [periodStart, setPeriodStart] = useState(firstOfMonth);
    const [periodEnd, setPeriodEnd] = useState(today);
    const [periodSearch, setPeriodSearch] = useState('');
    const [periodClass, setPeriodClass] = useState<string[]>([]);
    const [periodShift, setPeriodShift] = useState<string[]>([]);
    const [periodStatus, setPeriodStatus] = useState<string[]>([]);

    // Relatório por período: agrupa registros de attendance no intervalo
    const periodReport = useMemo(() => {
        if (!periodStart || !periodEnd) return [];
        const start = periodStart;
        const end = periodEnd;

        return (students || [])
            .filter(s => {
                const matchSearch = periodSearch === '' ||
                    s.name.toLowerCase().includes(periodSearch.toLowerCase()) ||
                    s.registration.includes(periodSearch);
                const matchClass = periodClass.length === 0 || periodClass.includes(s.grade);
                const matchShift = periodShift.length === 0 || periodShift.includes(s.shift);
                return matchSearch && matchClass && matchShift;
            })
            .map(s => {
                const records = (attendance || []).filter(
                    a => a.studentId === s.id && a.date >= start && a.date <= end
                );
                const absences = records.filter(r => r.status === 'Absent');
                const excused = records.filter(r => r.status === 'Excused');
                const present = records.filter(r => r.status === 'Present');
                // Observação mais recente do aluno no período
                const latestObs = records
                    .filter(r => r.observation && r.observation.trim() !== '')
                    .sort((a, b) => b.date.localeCompare(a.date))[0]?.observation || '';
                return {
                    student: s,
                    totalDays: records.length,
                    absences: absences.length,
                    excused: excused.length,
                    present: present.length,
                    absenceRecords: absences,
                    excusedRecords: excused,
                    observation: latestObs,
                };
            })
            .filter(r => {
                if (periodStatus.length === 0) return true;
                if (periodStatus.includes('Absent') && r.absences > 0) return true;
                if (periodStatus.includes('Excused') && r.excused > 0) return true;
                if (periodStatus.includes('Present') && r.present > 0) return true;
                return false;
            })
            .sort((a, b) => {
                const gradeCompare = a.student.grade.localeCompare(b.student.grade);
                if (gradeCompare !== 0) return gradeCompare;

                const shiftCompare = a.student.shift.localeCompare(b.student.shift);
                if (shiftCompare !== 0) return shiftCompare;

                const seqA = parseInt(a.student.sequenceNumber);
                const seqB = parseInt(b.student.sequenceNumber);
                const hasA = !isNaN(seqA);
                const hasB = !isNaN(seqB);
                if (hasA && hasB && seqA !== seqB) return seqA - seqB;
                if (hasA) return -1;
                if (hasB) return 1;

                return a.student.name.localeCompare(b.student.name);
            });
    }, [students, attendance, periodStart, periodEnd, periodSearch, periodClass, periodShift, periodStatus]);

    const filteredStudents = (students || [])
        .filter(s => {
            const matchSearch = searchTerm === "" || 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.registration.includes(searchTerm);
            const matchClass = selectedClass.length > 0 ? selectedClass.includes(s.grade) : true;
            const matchShift = selectedShift.length === 0 || selectedShift.includes(s.shift);

            const record = (attendance || []).find(a => a.studentId === s.id && a.date === attendanceDate);
            const currentStatus = record ? record.status : 'Present';
            const matchStatus = filterAttendanceStatus.length === 0 || filterAttendanceStatus.includes(currentStatus);

            return matchSearch && matchClass && matchShift && matchStatus;
        })
        .sort((a, b) => {
            const gradeCompare = a.grade.localeCompare(b.grade);
            if (gradeCompare !== 0) return gradeCompare;

            const shiftCompare = a.shift.localeCompare(b.shift);
            if (shiftCompare !== 0) return shiftCompare;

            const seqA = parseInt(a.sequenceNumber);
            const seqB = parseInt(b.sequenceNumber);
            const hasSeqA = !isNaN(seqA);
            const hasSeqB = !isNaN(seqB);

            if (hasSeqA && hasSeqB) {
                if (seqA !== seqB) return seqA - seqB;
            } else if (hasSeqA) {
                return -1;
            } else if (hasSeqB) {
                return 1;
            }

            return a.name.localeCompare(b.name);
        });

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                {/* Header Area */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                        <CalendarCheck className="mr-3 text-indigo-600 dark:text-indigo-400" size={28} />
                        Frequência
                    </h2>
                    {activeTab === 'daily' && (
                        <div className="flex items-center gap-2 no-print">
                            <input
                                type="date"
                                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={attendanceDate}
                                onChange={e => setAttendanceDate(e.target.value)}
                            />
                            <PrintButton onClick={onPrint} />
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit no-print">
                    <button
                        onClick={() => setActiveTab('daily')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === 'daily'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <Calendar size={15} /> Diário
                    </button>
                    <button
                        onClick={() => setActiveTab('period')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            activeTab === 'period'
                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <BarChart2 size={15} /> Relatório por Período
                    </button>
                </div>

                {/* Sync Controls Bar */}
                <div className="flex flex-col md:flex-row gap-3 no-print items-stretch md:items-center">
                    <div className="flex flex-wrap gap-2 flex-1">
                        <button
                            onClick={onImportTurnstileLocal}
                            disabled={isImportingTurnstile}
                            className={`
                            flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-sm active:scale-95
                            ${isImportingTurnstile ? 'opacity-70 cursor-wait' : ''}
                        `}
                        >
                            {isImportingTurnstile ? <Loader2 size={18} className="animate-spin mr-2" /> : <RefreshCw size={18} className="mr-2" />}
                            <span className="text-sm font-semibold">Sincronizar (C:)</span>
                        </button>

                        <label className={`
                        flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all cursor-pointer shadow-sm active:scale-95
                        ${isImportingTurnstile ? 'opacity-70 cursor-wait' : ''}
                    `}>
                            <UploadCloud size={18} className="mr-2" />
                            <span className="text-sm font-semibold">Upload TXT</span>
                            <input
                                type="file"
                                accept=".txt"
                                className="hidden"
                                onChange={onImportTurnstile}
                                disabled={isImportingTurnstile}
                            />
                        </label>

                        <button
                            onClick={() => setShowSyncSettings(!showSyncSettings)}
                            className={`p-2.5 rounded-xl border transition-colors ${showSyncSettings ? 'bg-slate-200 border-slate-300 dark:bg-slate-700 dark:border-slate-600' : 'bg-slate-100 border-transparent dark:bg-slate-800'} text-slate-600 dark:text-slate-300`}
                            title="Configurações de Horário"
                        >
                            <RefreshCw size={18} className={showSyncSettings ? 'rotate-180 transition-transform' : ''} />
                        </button>
                    </div>
                </div>

                {/* Time Settings Panel */}
                {showSyncSettings && (
                    <Card className="p-4 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div> Turno Manhã
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 mb-1 block">Início</label>
                                        <input type="time" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm" value={importMorningStart} onChange={e => setImportMorningStart(e.target.value)} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 mb-1 block">Fim</label>
                                        <input type="time" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm" value={importMorningEnd} onChange={e => setImportMorningEnd(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div> Turno Tarde
                                </h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 mb-1 block">Início</label>
                                        <input type="time" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm" value={importAfternoonStart} onChange={e => setImportAfternoonStart(e.target.value)} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-500 mb-1 block">Fim</label>
                                        <input type="time" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm" value={importAfternoonEnd} onChange={e => setImportAfternoonEnd(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {activeTab === 'daily' && (
            <div className="no-print relative z-20">
                <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 overflow-visible">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Busca</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className="w-full pl-9 pr-3 h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                                    placeholder="Nome ou matrícula..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1 relative z-50">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Turma</label>
                            <MultiSelect 
                                options={visibleGradesList.map(g => ({ label: g, value: g }))}
                                selectedValues={selectedClass} 
                                onChange={setSelectedClass} 
                                placeholder="Turma..."
                                className="!w-full h-11"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Turno</label>
                            <MultiSelect 
                                options={SHIFTS_LIST.map(s => ({ label: s, value: s }))}
                                selectedValues={selectedShift} 
                                onChange={setSelectedShift} 
                                placeholder="Todos os Turnos"
                                className="!w-full h-11"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                            <MultiSelect 
                                options={[
                                    { label: 'Presente', value: 'Present' },
                                    { label: 'Falta', value: 'Absent' },
                                    { label: 'Justificado', value: 'Excused' }
                                ]}
                                selectedValues={filterAttendanceStatus} 
                                onChange={setFilterAttendanceStatus}
                                placeholder="Todos os Status"
                                className="!w-full h-11"
                            />
                        </div>
                    </div>
                </Card>
            </div>
            )}

            {activeTab === 'daily' && (
                <>
                    <div className="flex items-center px-1">
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            Listando <span className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredStudents.length}</span> {filteredStudents.length === 1 ? 'aluno' : 'alunos'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredStudents.map(student => {
                            const record = (attendance || []).find(a => a.studentId === student.id && a.date === attendanceDate);
                            const currentStatus = record ? record.status : 'Present';
                            const obs = record ? record.observation || '' : '';
                            return (
                                <AttendanceCard
                                    key={student.id}
                                    student={student}
                                    status={currentStatus}
                                    observation={obs}
                                    onUpdateStatus={onUpdateStatus}
                                    onUpdateObservation={onUpdateObservation}
                                />
                            );
                        })}
                        {filteredStudents.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                <CalendarCheck size={48} className="mx-auto mb-3 opacity-20 text-indigo-500" />
                                <p className="font-medium text-slate-500">Nenhum aluno encontrado para os filtros selecionados.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'period' && (
                <div className="space-y-4">
                    {/* Filtros do Período */}
                    <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20 overflow-visible no-print">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            {/* Data Início */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Data Início</label>
                                <input
                                    type="date"
                                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={periodStart}
                                    onChange={e => setPeriodStart(e.target.value)}
                                />
                            </div>
                            {/* Data Fim */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Data Fim</label>
                                <input
                                    type="date"
                                    className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    value={periodEnd}
                                    onChange={e => setPeriodEnd(e.target.value)}
                                />
                            </div>
                            {/* Busca */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Busca</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        className="w-full pl-9 pr-3 h-11 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                        placeholder="Nome ou matrícula..."
                                        value={periodSearch}
                                        onChange={e => setPeriodSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/* Turma */}
                            <div className="space-y-1 relative z-50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Turma</label>
                                <MultiSelect
                                    options={visibleGradesList.map(g => ({ label: g, value: g }))}
                                    selectedValues={periodClass}
                                    onChange={setPeriodClass}
                                    placeholder="Todas as Turmas"
                                    className="!w-full h-11"
                                />
                            </div>
                            {/* Turno */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Turno</label>
                                <MultiSelect
                                    options={SHIFTS_LIST.map(s => ({ label: s, value: s }))}
                                    selectedValues={periodShift}
                                    onChange={setPeriodShift}
                                    placeholder="Todos os Turnos"
                                    className="!w-full h-11"
                                />
                            </div>
                            {/* Mostrar apenas com */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Exibir</label>
                                <MultiSelect
                                    options={[
                                        { label: 'Com Falta', value: 'Absent' },
                                        { label: 'Justificado', value: 'Excused' },
                                        { label: 'Com Presença', value: 'Present' },
                                    ]}
                                    selectedValues={periodStatus}
                                    onChange={setPeriodStatus}
                                    placeholder="Todos"
                                    className="!w-full h-11"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Resumo */}
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="p-3 text-center border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10">
                            <div className="text-2xl font-black text-red-500">{periodReport.reduce((s, r) => s + r.absences, 0)}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total de Faltas</div>
                        </Card>
                        <Card className="p-3 text-center border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10">
                            <div className="text-2xl font-black text-amber-500">{periodReport.reduce((s, r) => s + r.excused, 0)}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Justificadas</div>
                        </Card>
                        <Card className="p-3 text-center border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10">
                            <div className="text-2xl font-black text-indigo-500">{periodReport.filter(r => r.absences > 0).length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Alunos com Falta</div>
                        </Card>
                    </div>

                    {/* Tabela de Resultados */}
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700">
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aluno</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turma</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Turno</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black text-red-400 uppercase tracking-widest">Faltas</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black text-amber-400 uppercase tracking-widest">Justif.</th>
                                        <th className="text-center px-4 py-3 text-[10px] font-black text-emerald-400 uppercase tracking-widest">Presenças</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Datas das Faltas</th>
                                        <th className="text-left px-4 py-3 text-[10px] font-black text-violet-400 uppercase tracking-widest">Obs.</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    {periodReport.map(({ student, absences, excused, present, absenceRecords, excusedRecords, observation }) => (
                                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                                        alt={student.name}
                                                        className="w-7 h-7 rounded-lg object-cover bg-slate-100 dark:bg-slate-700"
                                                    />
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white text-xs uppercase">{student.name}</div>
                                                        <div className="text-[10px] text-slate-400">Mat: {student.registration}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">{student.grade}</td>
                                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{student.shift}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                                                    absences > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                                }`}>{absences}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black ${
                                                    excused > 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'
                                                }`}>{excused}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-black bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">{present}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {absenceRecords.map(r => (
                                                        <button
                                                            key={r.id}
                                                            title="Clique para editar esta falta"
                                                            onClick={() => { setEditingStudent(student); setEditingRecords([...absenceRecords, ...excusedRecords]); }}
                                                            className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            <Edit2 size={9} /> {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                        </button>
                                                    ))}
                                                    {excusedRecords.map(r => (
                                                        <button
                                                            key={r.id}
                                                            title="Clique para editar esta justificativa"
                                                            onClick={() => { setEditingStudent(student); setEditingRecords([...absenceRecords, ...excusedRecords]); }}
                                                            className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            <Edit2 size={9} /> {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} (J)
                                                        </button>
                                                    ))}
                                                    {absenceRecords.length === 0 && excusedRecords.length === 0 && (
                                                        <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 min-w-[120px]">
                                                {observation ? (
                                                    <span
                                                        className="block text-[11px] text-violet-600 dark:text-violet-400 font-medium italic break-words whitespace-normal"
                                                    >
                                                        {observation}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {periodReport.length === 0 && (
                                        <tr>
                                            <td colSpan={8} className="py-16 text-center text-slate-400">
                                                <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
                                                <p className="font-medium">Nenhum registro encontrado no período selecionado.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

            {/* ===== MODAL DE EDIÇÃO DE FALTAS ===== */}
            {editingStudent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-800">
                            <img
                                src={editingStudent.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${editingStudent.id}`}
                                alt={editingStudent.name}
                                className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-700"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-800 dark:text-white text-sm uppercase truncate">{editingStudent.name}</h3>
                                <p className="text-[11px] text-slate-400">{editingStudent.grade} • {editingStudent.shift} • Mat: {editingStudent.registration}</p>
                            </div>
                            <button
                                onClick={() => { setEditingStudent(null); setEditingRecords([]); }}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros no Período — clique para alterar o status</p>
                            {editingRecords.length === 0 && (
                                <p className="text-sm text-slate-400 text-center py-4">Nenhum registro de falta ou justificativa no período.</p>
                            )}
                            {editingRecords
                                .sort((a, b) => a.date.localeCompare(b.date))
                                .map(record => {
                                    // Get current status from live attendance state
                                    const liveRecord = (attendance || []).find(a => a.id === record.id || (a.studentId === record.studentId && a.date === record.date));
                                    const currentStatus: AttendanceStatus = (liveRecord?.status || record.status) as AttendanceStatus;
                                    const dateLabel = new Date(record.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
                                    return (
                                        <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{dateLabel}</p>
                                            </div>
                                            {/* Status Buttons */}
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-100 dark:border-slate-700">
                                                <button
                                                    onClick={() => onUpdateStatusByDate(editingStudent.id, record.date, 'Present')}
                                                    className={`flex flex-col items-center px-2 py-1.5 rounded-md transition-all text-[9px] font-black uppercase ${
                                                        currentStatus === 'Present'
                                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                            : 'text-slate-300 hover:text-emerald-500'
                                                    }`}
                                                >
                                                    <CheckCircle2 size={14} />
                                                    <span className="mt-0.5">Pres.</span>
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatusByDate(editingStudent.id, record.date, 'Absent')}
                                                    className={`flex flex-col items-center px-2 py-1.5 rounded-md transition-all text-[9px] font-black uppercase ${
                                                        currentStatus === 'Absent'
                                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
                                                            : 'text-slate-300 hover:text-red-500'
                                                    }`}
                                                >
                                                    <XCircle size={14} />
                                                    <span className="mt-0.5">Falta</span>
                                                </button>
                                                <button
                                                    onClick={() => onUpdateStatusByDate(editingStudent.id, record.date, 'Excused')}
                                                    className={`flex flex-col items-center px-2 py-1.5 rounded-md transition-all text-[9px] font-black uppercase ${
                                                        currentStatus === 'Excused'
                                                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                                                            : 'text-slate-300 hover:text-amber-500'
                                                    }`}
                                                >
                                                    <AlertCircle size={14} />
                                                    <span className="mt-0.5">Justif.</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>

                        {/* Modal Footer */}
                        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={() => { setEditingStudent(null); setEditingRecords([]); }}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors"
                            >
                                Concluído
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface AttendanceCardProps {
    key?: React.Key;
    student: Student;
    status: AttendanceStatus;
    observation: string;
    onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
    onUpdateObservation: (studentId: string, obs: string) => void;
}

const AttendanceCard = ({ student, status, observation, onUpdateStatus, onUpdateObservation }: AttendanceCardProps) => {
    const [localObs, setLocalObs] = useState(observation);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalObs(observation);
        }
    }, [observation]);

    const handleBlur = () => {
        if (localObs !== observation) {
            onUpdateObservation(student.id, localObs);
        }
    };

    return (
        <Card className={`p-3 flex flex-col justify-between hover:shadow-lg transition-all border-l-4 ${status === 'Present' ? 'border-l-emerald-500 bg-emerald-50/5' :
            status === 'Absent' ? 'border-l-red-500 bg-red-50/5' :
                'border-l-amber-500 bg-amber-50/5'
            }`}>
            <div className="flex items-center space-x-3 mb-3">
                <img
                    src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                    alt={student.name}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm"
                />
                <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-800 dark:text-white truncate uppercase" title={student.name}>{student.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                        <span>Mat: {student.registration}</span> • <span className="text-indigo-500 dark:text-indigo-400">{student.grade}</span> • {student.shift}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white dark:bg-slate-800 rounded-xl p-1.5 mb-3 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <button
                    onClick={() => onUpdateStatus(student.id, 'Present')}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all ${status === 'Present' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'text-slate-300 hover:text-slate-400 dark:hover:text-slate-500'}`}
                >
                    <CheckCircle2 size={18} />
                    <span className="text-[8px] font-black mt-1 uppercase">PRESENTE</span>
                </button>
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-700"></div>
                <button
                    onClick={() => onUpdateStatus(student.id, 'Absent')}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all ${status === 'Absent' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30' : 'text-slate-300 hover:text-slate-400 dark:hover:text-slate-500'}`}
                >
                    <XCircle size={18} />
                    <span className="text-[8px] font-black mt-1 uppercase">FALTA</span>
                </button>
                <div className="w-px h-6 bg-slate-100 dark:bg-slate-700"></div>
                <button
                    onClick={() => onUpdateStatus(student.id, 'Excused')}
                    className={`flex-1 flex flex-col items-center py-2 px-1 rounded-lg transition-all ${status === 'Excused' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30' : 'text-slate-300 hover:text-slate-400 dark:hover:text-slate-500'}`}
                >
                    <AlertCircle size={18} />
                    <span className="text-[8px] font-black mt-1 uppercase">JUSTIF.</span>
                </button>
            </div>

            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Obs..."
                    className="w-full bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-600 dark:text-slate-400"
                    value={localObs}
                    onChange={(e) => setLocalObs(e.target.value)}
                    onBlur={handleBlur}
                />
            </div>
        </Card>
    );
};
