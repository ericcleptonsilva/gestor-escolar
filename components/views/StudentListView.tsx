import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, BookOpen, Activity, CreditCard, Phone, MessageCircle, XCircle, CheckSquare, Calendar } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { PrintButton } from '../features/PrintButton';
import { ExportButton, ImportButton, PhotoImportButton, PhoneImportButton } from '../features/ImportButtons';
import { Student, User, BookStatus, PEStatus, AttendanceRecord } from '../../types';
import { SHIFTS_LIST } from '../../constants';

interface StudentListViewProps {
    students: Student[]; // The filtered list
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterGrade: string;
    setFilterGrade: (grade: string) => void;
    filterShift: string;
    setFilterShift: (shift: string) => void;
    filterBookStatus: BookStatus | '';
    setFilterBookStatus: (status: BookStatus | '') => void;
    filterPEStatus: PEStatus | '';
    setFilterPEStatus: (status: PEStatus | '') => void;
    filterTurnstile: string;
    setFilterTurnstile: (val: string) => void;
    visibleGradesList: string[];
    currentUser: User | null;
    onNewStudent: () => void;
    onPrint: () => void;
    onExport: () => void;
    onImportCSV: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImportPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onImportPhones: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDownloadPhoneTemplate: () => void;
    isImporting: boolean;
    isImportingPhotos: boolean;
    isImportingPhones: boolean;
    onSelectStudent: (student: Student) => void;
    attendance: AttendanceRecord[];
    onToggleAbsence: (student: Student, isAbsentToday: boolean) => void;
    onToggleBook: (student: Student, e: React.MouseEvent) => void;
    onTogglePE: (student: Student, e: React.MouseEvent) => void;
    onToggleTurnstile: (student: Student, e: React.MouseEvent) => void;
    onToggleAgenda: (student: Student, e: React.MouseEvent) => void;
}

export const StudentListView = ({
    students,
    searchTerm, setSearchTerm,
    filterGrade, setFilterGrade,
    filterShift, setFilterShift,
    filterBookStatus, setFilterBookStatus,
    filterPEStatus, setFilterPEStatus,
    filterTurnstile, setFilterTurnstile,
    visibleGradesList,
    currentUser,
    onNewStudent,
    onPrint,
    onExport,
    onImportCSV, onImportPhotos, onImportPhones, onDownloadPhoneTemplate,
    isImporting, isImportingPhotos, isImportingPhones,
    onSelectStudent,
    attendance,
    onToggleAbsence,
    onToggleBook,
    onTogglePE,
    onToggleTurnstile,
    onToggleAgenda
}: StudentListViewProps) => {

    const [activeFilterType, setActiveFilterType] = useState<string>('');

    useEffect(() => {
        if (filterBookStatus) setActiveFilterType('book');
        else if (filterPEStatus) setActiveFilterType('pe');
        else if (filterTurnstile) setActiveFilterType('turnstile');
    }, []);

    const handleFilterTypeChange = (type: string) => {
        setActiveFilterType(type);
        setFilterBookStatus('');
        setFilterPEStatus('');
        setFilterTurnstile('');
    };

    const formatWhatsAppLink = (phone: string) => {
        if (!phone) return '#';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) return '#';
        return `https://wa.me/55${cleaned}`;
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between flex-wrap items-center gap-4">
          <div className="flex items-center w-full md:w-auto gap-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                <Users className="mr-2 text-indigo-600 dark:text-indigo-400" />
                Alunos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 w-full no-print items-center">
             <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                className="w-full pl-10 pr-9 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Nome ou matrícula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

             <Select className="!w-full md:!w-full" value={filterGrade} onChange={e => setFilterGrade(e.target.value)}>
                <option value="">Todas Séries</option>
                {visibleGradesList.map(g => <option key={g} value={g}>{g}</option>)}
             </Select>

             <Select className="!w-full md:!w-full" value={filterShift} onChange={e => setFilterShift(e.target.value)}>
                <option value="">Todos Turnos</option>
                {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
             </Select>

             <Select
                className="!w-full md:!w-full"
                value={activeFilterType}
                onChange={e => handleFilterTypeChange(e.target.value)}
             >
                <option value="">Outros Filtros...</option>
                <option value="book">Status Livro</option>
                <option value="pe">Status Ed. Física</option>
                <option value="turnstile">Status Catraca</option>
             </Select>

             {activeFilterType === 'book' && (
                 <Select className="!w-full md:!w-full" value={filterBookStatus} onChange={e => setFilterBookStatus(e.target.value as BookStatus)}>
                    <option value="">Todos Status</option>
                    <option value="Comprou">Comprou</option>
                    <option value="Nao Comprou">Não Comprou</option>
                    <option value="Copia">Cópia</option>
                    <option value="Livro Antigo">Livro Antigo</option>
                 </Select>
             )}

             {activeFilterType === 'pe' && (
                 <Select className="!w-full md:!w-full" value={filterPEStatus} onChange={e => setFilterPEStatus(e.target.value as PEStatus)}>
                    <option value="">Todos Status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Em Análise">Em Análise</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Reprovado">Reprovado</option>
                 </Select>
             )}

             {activeFilterType === 'turnstile' && (
                 <Select className="!w-full md:!w-full" value={filterTurnstile} onChange={e => setFilterTurnstile(e.target.value)}>
                    <option value="">Todos</option>
                    <option value="true">Com Cadastro</option>
                    <option value="false">Sem Cadastro</option>
                 </Select>
             )}

             {activeFilterType === '' && (
                 <Select className="!w-full md:!w-full" disabled value="">
                     <option>Selecione um filtro...</option>
                 </Select>
             )}

             {currentUser?.role !== 'Teacher' && (
                <>
                  <Button onClick={onNewStudent}>
                      <Plus size={20} />
                      <span className="hidden md:inline">Novo Aluno</span>
                  </Button>
                </>
             )}
             <PrintButton onClick={onPrint} />
             <ExportButton onClick={onExport} label="CSV" />
             {currentUser?.role !== 'Teacher' && (
                <>
                    <ImportButton onFileSelect={onImportCSV} isLoading={isImporting} />
                    <PhotoImportButton onFileSelect={onImportPhotos} isLoading={isImportingPhotos} />
                    <div className="flex gap-1">
                        <PhoneImportButton onFileSelect={onImportPhones} isLoading={isImportingPhones} />
                        <button
                            onClick={onDownloadPhoneTemplate}
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-2 py-2 shadow-sm transition-colors"
                            title="Baixar Modelo de Telefones"
                        >
                            <span className="text-xs font-bold">Modelo</span>
                        </button>
                    </div>
                </>
             )}
          </div>
        </div>

        <div className="hidden print:block mt-6">
            <h3 className="text-xl font-bold mb-4">Relatório de Alunos</h3>
            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="border-b-2 border-slate-300">
                        <th className="py-2 pr-4">Nome</th>
                        <th className="py-2 pr-4">Matrícula</th>
                        <th className="py-2 pr-4">Série</th>
                        <th className="py-2 pr-4">Turno</th>
                        <th className="py-2 pr-4">Livro</th>
                        <th className="py-2 pr-4">Ed. Física</th>
                        <th className="py-2">Responsáveis</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s.id} className="border-b border-slate-200">
                            <td className="py-2 pr-4">{s.name}</td>
                            <td className="py-2 pr-4">{s.registration}</td>
                            <td className="py-2 pr-4">{s.grade}</td>
                            <td className="py-2 pr-4">{s.shift}</td>
                            <td className="py-2 pr-4">{s.bookStatus}</td>
                            <td className="py-2 pr-4">{s.peStatus}</td>
                            <td className="py-2">
                                <div className="text-xs">
                                    <div>Pai: {s.fatherName}</div>
                                    <div>Mãe: {s.motherName}</div>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 print:hidden">
            {students.map(student => {
                if (!student) return null;
                const isAbsentToday = attendance.some(a =>
                    a.studentId === student.id &&
                    a.date === new Date().toISOString().split('T')[0] &&
                    a.status === 'Absent'
                );

                const bookBadge = {
                    'Comprou': { color: 'green', label: 'Comprou' },
                    'Nao Comprou': { color: 'red', label: 'Não Comprou' },
                    'Copia': { color: 'blue', label: 'Cópia' },
                    'Livro Antigo': { color: 'yellow', label: 'Livro Antigo' }
                }[student.bookStatus] || { color: 'slate', label: student.bookStatus };

                const peBadge = {
                    'Aprovado': { color: 'green', label: 'Aprovado' },
                    'Reprovado': { color: 'red', label: 'Reprovado' },
                    'Em Análise': { color: 'yellow', label: 'Em Análise' },
                    'Pendente': { color: 'slate', label: 'Pendente' }
                }[student.peStatus] || { color: 'slate', label: student.peStatus };

                return (
                    <Card key={student.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col" onClick={() => onSelectStudent(student)}>
                        <div className="p-2 flex-1 cursor-pointer">
                            <div className="flex items-center space-x-2 mb-2">
                                <img
                                    src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                    alt={student.name}
                                    className="w-16 h-16 rounded-full object-cover bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow"
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base text-slate-800 dark:text-white truncate" title={student.name}>{student.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Mat: {student.registration}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <Badge color="blue">{student.grade}</Badge>
                                        <Badge color={student.shift === 'Manhã' ? 'yellow' : 'slate'}>{student.shift}</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                                        <BookOpen size={14} className="mr-2 opacity-70" /> Livro Didático
                                    </span>
                                    <Badge
                                        color={bookBadge.color as any}
                                        onClick={(e) => onToggleBook(student, e)}
                                        className="cursor-pointer hover:opacity-80 hover:scale-105 transition-transform"
                                    >
                                        {bookBadge.label}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                     <span className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                                        <Activity size={14} className="mr-2 opacity-70" /> Ed. Física
                                    </span>
                                    <Badge
                                        color={peBadge.color as any}
                                        onClick={(e) => onTogglePE(student, e)}
                                        className="cursor-pointer hover:opacity-80 hover:scale-105 transition-transform"
                                    >
                                        {peBadge.label}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                     <span className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                                        <CreditCard size={14} className="mr-2 opacity-70" /> Catraca
                                    </span>
                                    <Badge
                                        color={student.turnstileRegistered ? 'green' : 'slate'}
                                        onClick={(e) => onToggleTurnstile(student, e)}
                                        className="cursor-pointer hover:opacity-80 hover:scale-105 transition-transform"
                                    >
                                        {student.turnstileRegistered ? 'Sim' : 'Não'}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                     <span className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                                        <Calendar size={14} className="mr-2 opacity-70" /> Agenda
                                    </span>
                                    <Badge
                                        color={student.hasAgenda ? 'green' : 'slate'}
                                        onClick={(e) => onToggleAgenda(student, e)}
                                        className="cursor-pointer hover:opacity-80 hover:scale-105 transition-transform"
                                    >
                                        {student.hasAgenda ? 'Sim' : 'Não'}
                                    </Badge>
                                </div>
                                {student.motherPhone && (
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                                            <Phone size={14} className="mr-2 opacity-70" /> Mãe
                                        </span>
                                        <a href={formatWhatsAppLink(student.motherPhone)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline transition-colors font-bold flex items-center space-x-1">
                                            <MessageCircle size={12} />
                                            <span>WhatsApp</span>
                                        </a>
                                    </div>
                                )}
                                {student.fatherPhone && (
                                    <div className="flex justify-between items-center">
                                        <span className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                                            <Phone size={14} className="mr-2 opacity-70" /> Pai
                                        </span>
                                        <a href={formatWhatsAppLink(student.fatherPhone)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline transition-colors font-bold flex items-center space-x-1">
                                            <MessageCircle size={12} />
                                            <span>WhatsApp</span>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleAbsence(student, isAbsentToday);
                            }}
                            className={`w-full py-2 flex items-center justify-center space-x-2 font-bold transition-colors text-sm no-print rounded-b-xl ${
                                isAbsentToday
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                             {isAbsentToday ? (
                                <>
                                    <XCircle size={16} />
                                    <span>Marcar Presença</span>
                                </>
                             ) : (
                                <>
                                    <CheckSquare size={16} />
                                    <span>Marcar Falta Hoje</span>
                                </>
                             )}
                        </button>
                    </Card>
                );
            })}
        </div>
        {students.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p>Nenhum aluno encontrado com os filtros atuais.</p>
            </div>
        )}
      </div>
    );
};
