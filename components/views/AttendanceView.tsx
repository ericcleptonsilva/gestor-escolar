import React, { useState, useEffect, useRef } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, AlertCircle, Loader2, UploadCloud, RefreshCw, ChevronDown, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { PrintButton } from '@/components/features/PrintButton';
import { AppState, Student, AttendanceStatus, User } from '@/types';
import { SHIFTS_LIST } from '@/constants';

interface AttendanceViewProps {
    students: Student[]; // All visible students
    attendance: AppState['attendance'];
    attendanceDate: string;
    setAttendanceDate: (date: string) => void;
    selectedClass: string[];
    setSelectedClass: (cls: string[]) => void;
    selectedShift: string;
    setSelectedShift: (shift: string) => void;
    filterAttendanceStatus: AttendanceStatus | '';
    setFilterAttendanceStatus: (status: AttendanceStatus | '') => void;
    visibleGradesList: string[];
    onPrint: () => void;
    onUpdateStatus: (studentId: string, status: AttendanceStatus) => void;
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
    attendance,
    attendanceDate, setAttendanceDate,
    selectedClass, setSelectedClass,
    selectedShift, setSelectedShift,
    filterAttendanceStatus, setFilterAttendanceStatus,
    visibleGradesList,
    onPrint,
    onUpdateStatus,
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

    const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);
    const gradeDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target as Node)) {
                setIsGradeDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleGradeFilter = (grade: string) => {
        if (selectedClass.includes(grade)) {
            setSelectedClass(selectedClass.filter(g => g !== grade));
        } else {
            setSelectedClass([...selectedClass, grade]);
        }
    };

    const toggleAllGrades = () => {
        if (selectedClass.length === visibleGradesList.length) {
            setSelectedClass([]);
        } else {
            setSelectedClass([...visibleGradesList]);
        }
    };

    const filteredStudents = (students || [])
        .filter(s => {
            const matchClass = selectedClass.length > 0 ? selectedClass.includes(s.grade) : true;
            const matchShift = selectedShift === "" || s.shift === selectedShift;

            const record = (attendance || []).find(a => a.studentId === s.id && a.date === attendanceDate);
            const currentStatus = record ? record.status : 'Present';
            const matchStatus = filterAttendanceStatus === "" || currentStatus === filterAttendanceStatus;

            return matchClass && matchShift && matchStatus;
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

    const [showSyncSettings, setShowSyncSettings] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                {/* Header Area */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                        <CalendarCheck className="mr-3 text-indigo-600 dark:text-indigo-400" size={28} />
                        Frequência
                    </h2>
                    <div className="flex items-center gap-2 no-print">
                        <input
                            type="date"
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={attendanceDate}
                            onChange={e => setAttendanceDate(e.target.value)}
                        />
                        <PrintButton onClick={onPrint} />
                    </div>
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

            <div className="no-print relative z-20">
                <Card className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1 relative z-50" ref={gradeDropdownRef}>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Turma</label>

                            <div
                                className="h-11 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 flex items-center justify-between cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
                            >
                                <span className={`text-sm truncate ${selectedClass.length === 0 ? 'text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {selectedClass.length === 0 ? 'Todas as Turmas' : `${selectedClass.length} turma(s) selecionada(s)`}
                                </span>
                                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isGradeDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isGradeDropdownOpen && (
                                <div className="absolute z-50 top-[70px] left-0 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto no-print">
                                    <div className="p-2 sticky top-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-700">
                                        <button
                                            onClick={toggleAllGrades}
                                            className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors"
                                        >
                                            {selectedClass.length === visibleGradesList.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                                        </button>
                                    </div>
                                    <div className="p-1">
                                        {visibleGradesList.map(g => (
                                            <label key={g} className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md cursor-pointer group">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${selectedClass.includes(g)
                                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                                    : 'border-slate-300 dark:border-slate-600 group-hover:border-indigo-400'
                                                    }`}>
                                                    {selectedClass.includes(g) && <Check size={12} strokeWidth={3} />}
                                                </div>
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{g}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Turno</label>
                            <Select value={selectedShift} onChange={e => setSelectedShift(e.target.value)} className="h-11">
                                <option value="">Todos os Turnos</option>
                                {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                        <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Status</label>
                            <Select value={filterAttendanceStatus} onChange={e => setFilterAttendanceStatus(e.target.value as AttendanceStatus | '')} className="h-11">
                                <option value="">Todos os Status</option>
                                <option value="Present">Presente</option>
                                <option value="Absent">Falta</option>
                                <option value="Excused">Justificado</option>
                            </Select>
                        </div>
                    </div>
                </Card>
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
        </div>
    );
};

interface AttendanceCardProps {
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
