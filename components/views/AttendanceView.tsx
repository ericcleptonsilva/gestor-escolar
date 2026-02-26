import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, AlertCircle, Loader2, UploadCloud, RefreshCw } from 'lucide-react';
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
    selectedClass: string;
    setSelectedClass: (cls: string) => void;
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

    const filteredStudents = (students || [])
      .filter(s => {
         const matchClass = selectedClass === "" || s.grade === selectedClass;
         const matchShift = selectedShift === "" || s.shift === selectedShift;

         const record = (attendance || []).find(a => a.studentId === s.id && a.date === attendanceDate);
         const currentStatus = record ? record.status : 'Present';
         const matchStatus = filterAttendanceStatus === "" || currentStatus === filterAttendanceStatus;

         // Permission check (redundant if 'students' is already filtered by visible, but safe to keep logic consistent)
         // Assuming 'students' passed here are already 'getVisibleStudents'
         return matchClass && matchShift && matchStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
              <CalendarCheck className="mr-2 text-indigo-600 dark:text-indigo-400" />
              Controle de Frequência
           </h2>
           <div className="flex items-center space-x-2 no-print">
               <input
                 type="date"
                 className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                 value={attendanceDate}
                 onChange={e => setAttendanceDate(e.target.value)}
               />
               
               <div className="flex space-x-2">
                   <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                       <span className="text-[10px] text-slate-500 font-bold uppercase w-10 text-right">Manhã</span>
                       <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                       <input
                         type="time"
                         title="Início Manhã"
                         className="bg-transparent border-none p-0 text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 w-16"
                         value={importMorningStart}
                         onChange={e => setImportMorningStart(e.target.value)}
                       />
                       <span className="text-slate-400 text-xs">-</span>
                       <input
                         type="time"
                         title="Fim Manhã"
                         className="bg-transparent border-none p-0 text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 w-16"
                         value={importMorningEnd}
                         onChange={e => setImportMorningEnd(e.target.value)}
                       />
                   </div>

                   <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                       <span className="text-[10px] text-slate-500 font-bold uppercase w-10 text-right">Tarde</span>
                       <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>
                       <input
                         type="time"
                         title="Início Tarde"
                         className="bg-transparent border-none p-0 text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 w-16"
                         value={importAfternoonStart}
                         onChange={e => setImportAfternoonStart(e.target.value)}
                       />
                       <span className="text-slate-400 text-xs">-</span>
                       <input
                         type="time"
                         title="Fim Tarde"
                         className="bg-transparent border-none p-0 text-xs font-medium text-slate-700 dark:text-slate-300 focus:ring-0 w-16"
                         value={importAfternoonEnd}
                         onChange={e => setImportAfternoonEnd(e.target.value)}
                       />
                   </div>
               </div>

               <button
                  onClick={onImportTurnstileLocal}
                  disabled={isImportingTurnstile}
                  className={`
                    flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md
                    ${isImportingTurnstile ? 'opacity-70 cursor-wait' : ''}
                  `}
                  title="Ler arquivo direto de C:\SIETEX\Portaria\TopData.txt"
               >
                   {isImportingTurnstile ? <Loader2 size={20} className="animate-spin mr-2" /> : <RefreshCw size={20} className="mr-2" />}
                   <span className="text-sm font-medium">Sincronizar (C:)</span>
               </button>

               <label className={`
                   flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer shadow-md
                   ${isImportingTurnstile ? 'opacity-70 cursor-wait' : ''}
               `}>
                   <UploadCloud size={20} className="mr-2" />
                   <span className="text-sm font-medium">Upload</span>
                   <input 
                       type="file" 
                       accept=".txt"
                       className="hidden"
                       onChange={onImportTurnstile}
                       disabled={isImportingTurnstile}
                   />
               </label>

               <PrintButton onClick={onPrint} />
           </div>
        </div>

        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecione a Turma</label>
                    <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                        <option value="">Todas as Turmas</option>
                        {visibleGradesList.map(g => <option key={g} value={g}>{g}</option>)}
                    </Select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecione o Turno</label>
                    <Select value={selectedShift} onChange={e => setSelectedShift(e.target.value)}>
                        <option value="">Todos os Turnos</option>
                        {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Selecione o Status</label>
                    <Select value={filterAttendanceStatus} onChange={e => setFilterAttendanceStatus(e.target.value as AttendanceStatus | '')}>
                        <option value="">Todos os Status</option>
                        <option value="Present">Presente</option>
                        <option value="Absent">Falta</option>
                        <option value="Excused">Justificado</option>
                    </Select>
                </div>
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => {
                const record = (attendance || []).find(a => a.studentId === student.id && a.date === attendanceDate);
                const currentStatus = record ? record.status : 'Present'; // Default is Present if no record
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
                 <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <CalendarCheck size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Nenhum aluno encontrado nesta turma/turno.</p>
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

    useEffect(() => {
        setLocalObs(observation);
    }, [observation]);

    const handleBlur = () => {
        if (localObs !== observation) {
            onUpdateObservation(student.id, localObs);
        }
    };

    return (
        <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
                 <img
                    src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                    alt={student.name}
                    className="w-12 h-12 rounded-full object-cover bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"
                />
                <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-white truncate" title={student.name}>{student.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{student.grade} • {student.shift}</div>
                </div>
            </div>

            <div className="flex justify-around items-center bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 mb-3">
                <button
                    onClick={() => onUpdateStatus(student.id, 'Present')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${status === 'Present' ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    title="Presente"
                >
                    <CheckCircle2 size={24} />
                    <span className="text-[10px] font-bold mt-1">Presente</span>
                </button>
                <button
                    onClick={() => onUpdateStatus(student.id, 'Absent')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${status === 'Absent' ? 'text-red-600 dark:text-red-400 bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    title="Falta"
                >
                    <XCircle size={24} />
                    <span className="text-[10px] font-bold mt-1">Falta</span>
                </button>
                <button
                    onClick={() => onUpdateStatus(student.id, 'Excused')}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${status === 'Excused' ? 'text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    title="Justificado"
                >
                    <AlertCircle size={24} />
                    <span className="text-[10px] font-bold mt-1">Justif.</span>
                </button>
            </div>

            <input
                type="text"
                placeholder="Adicionar observação..."
                className="w-full bg-transparent border-b border-slate-200 dark:border-slate-600 focus:border-indigo-500 outline-none text-slate-600 dark:text-slate-300 py-1 text-sm transition-colors"
                value={localObs}
                onChange={(e) => setLocalObs(e.target.value)}
                onBlur={handleBlur}
            />
        </Card>
    );
};
