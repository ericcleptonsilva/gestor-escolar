import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, BookOpen, Activity, CreditCard, Phone, MessageCircle, XCircle, CheckSquare, Calendar, SlidersHorizontal, ChevronDown, ChevronUp, FileOutput, FileInput } from 'lucide-react';
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
    filterAgenda: string;
    setFilterAgenda: (val: string) => void;
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
    filterAgenda, setFilterAgenda,
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

    const [showFilters, setShowFilters] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [activeFilterType, setActiveFilterType] = useState<string>('');

    useEffect(() => {
        if (filterBookStatus) setActiveFilterType('book');
        else if (filterPEStatus) setActiveFilterType('pe');
        else if (filterTurnstile) setActiveFilterType('turnstile');
        else if (filterAgenda) setActiveFilterType('agenda');
    }, []);

    const handleFilterTypeChange = (type: string) => {
        setActiveFilterType(type);
        setFilterBookStatus('');
        setFilterPEStatus('');
        setFilterTurnstile('');
        setFilterAgenda('');
    };

    const formatWhatsAppLink = (phone: string) => {
        if (!phone) return '#';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length < 10) return '#';
        return `https://wa.me/55${cleaned}`;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                {/* Header Area */}
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                        <Users className="mr-3 text-indigo-600 dark:text-indigo-400" size={28} />
                        Alunos
                    </h2>

                    <div className="flex items-center gap-2">
                        {currentUser?.role !== 'Teacher' && (
                            <Button onClick={onNewStudent} className="!px-3 sm:!px-4">
                                <Plus size={20} />
                                <span className="hidden sm:inline ml-2">Novo Aluno</span>
                            </Button>
                        )}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`md:hidden p-2 rounded-lg border transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800' : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700'}`}
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* Filters & Actions Bar */}
                <div className="flex flex-col md:flex-row gap-3 no-print">
                    {/* Search */}
                    <div className="w-full md:w-64 lg:w-80 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                placeholder="Nome ou matrícula..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filters Container */}
                    <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-1 flex-col md:flex-row gap-3 items-start md:items-center`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 w-full">
                            <Select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="!w-full h-11">
                                <option value="">Série...</option>
                                {visibleGradesList.map(g => <option key={g} value={g}>{g}</option>)}
                            </Select>

                            <Select value={filterShift} onChange={e => setFilterShift(e.target.value)} className="!w-full h-11">
                                <option value="">Turno...</option>
                                {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>

                            <Select
                                className="!w-full h-11"
                                value={activeFilterType}
                                onChange={e => handleFilterTypeChange(e.target.value)}
                            >
                                <option value="">Filtro Adicional...</option>
                                <option value="book">Status Livro</option>
                                <option value="pe">Status Ed. Física</option>
                                <option value="turnstile">Status Catraca</option>
                                <option value="agenda">Status Agenda</option>
                            </Select>

                            {activeFilterType && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    {activeFilterType === 'book' && (
                                        <Select className="!w-full h-11" value={filterBookStatus} onChange={e => setFilterBookStatus(e.target.value as BookStatus)}>
                                            <option value="">Todos Status</option>
                                            <option value="Comprou">Comprou</option>
                                            <option value="Nao Comprou">Não Comprou</option>
                                            <option value="Copia">Cópia</option>
                                            <option value="Livro Antigo">Livro Antigo</option>
                                        </Select>
                                    )}
                                    {activeFilterType === 'pe' && (
                                        <Select className="!w-full h-11" value={filterPEStatus} onChange={e => setFilterPEStatus(e.target.value as PEStatus)}>
                                            <option value="">Todos Status</option>
                                            <option value="Pendente">Pendente</option>
                                            <option value="Em Análise">Em Análise</option>
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Reprovado">Reprovado</option>
                                        </Select>
                                    )}
                                    {activeFilterType === 'turnstile' && (
                                        <Select className="!w-full h-11" value={filterTurnstile} onChange={e => setFilterTurnstile(e.target.value)}>
                                            <option value="">Todos</option>
                                            <option value="true">Com Cadastro</option>
                                            <option value="false">Sem Cadastro</option>
                                        </Select>
                                    )}
                                    {activeFilterType === 'agenda' && (
                                        <Select className="!w-full h-11" value={filterAgenda} onChange={e => setFilterAgenda(e.target.value)}>
                                            <option value="">Todos</option>
                                            <option value="true">Com Agenda</option>
                                            <option value="false">Sem Agenda</option>
                                        </Select>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions Group */}
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden xl:flex items-center gap-2">
                                <PrintButton onClick={onPrint} />
                                <ExportButton onClick={onExport} label="CSV" />
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setShowActions(!showActions)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-500"
                                >
                                    <FileOutput size={18} />
                                    <span className="hidden sm:inline">Ações</span>
                                    {showActions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {showActions && (
                                    <>
                                        {/* Overlay to close on click-outside */}
                                        <div className="fixed inset-0 z-40" onClick={() => setShowActions(false)} />

                                        {/* Bottom sheet on mobile, dropdown on sm+ */}
                                        <div className="
                                            fixed sm:absolute
                                            bottom-0 sm:bottom-auto
                                            left-0 sm:left-auto
                                            right-0 sm:right-0
                                            top-auto sm:top-full
                                            sm:mt-2
                                            w-full sm:w-72
                                            rounded-t-2xl sm:rounded-2xl
                                            bg-white dark:bg-slate-800
                                            shadow-2xl sm:shadow-2xl
                                            border-t sm:border
                                            border-slate-200 dark:border-slate-700
                                            z-50 p-4 sm:p-3
                                            space-y-3
                                            animate-in slide-in-from-bottom sm:zoom-in-95
                                            duration-200
                                            sm:origin-top-right
                                        ">
                                            {/* Mobile handle */}
                                            <div className="sm:hidden w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mx-auto mb-2" />

                                            <div className="xl:hidden space-y-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                                <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relatórios</p>
                                                <div className="grid grid-cols-1 gap-1">
                                                    <button onClick={() => { onPrint(); setShowActions(false); }} className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                            <Calendar size={18} />
                                                        </div>
                                                        Gerar PDF
                                                    </button>
                                                    <button onClick={() => { onExport(); setShowActions(false); }} className="flex items-center gap-3 w-full p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm font-semibold text-slate-700 dark:text-slate-200">
                                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                            <FileOutput size={18} />
                                                        </div>
                                                        Exportar CSV
                                                    </button>
                                                </div>
                                            </div>

                                            {currentUser?.role !== 'Teacher' && (
                                                <div className="space-y-2">
                                                    <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ferramentas de Importação</p>
                                                    <div className="space-y-1">
                                                        <div onClick={() => setShowActions(false)} className="w-full">
                                                            <ImportButton onFileSelect={onImportCSV} isLoading={isImporting} />
                                                        </div>
                                                        <div onClick={() => setShowActions(false)} className="w-full">
                                                            <PhotoImportButton onFileSelect={onImportPhotos} isLoading={isImportingPhotos} />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <div onClick={() => setShowActions(false)} className="flex-1">
                                                                <PhoneImportButton onFileSelect={onImportPhones} isLoading={isImportingPhones} />
                                                            </div>
                                                            <button
                                                                onClick={() => { onDownloadPhoneTemplate(); setShowActions(false); }}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95"
                                                                title="Baixar Modelo de Telefones"
                                                            >
                                                                Modelo
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                    </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:hidden">
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
                        <Card key={student.id} className={`hover:shadow-lg transition-all duration-300 flex flex-col group relative ${isAbsentToday ? 'ring-2 ring-red-500/50 bg-red-50/10' : ''}`} onClick={() => onSelectStudent(student)}>
                            <div className="p-3 flex-1 cursor-pointer">
                                <div className="flex items-start space-x-3">
                                    <div className="relative shrink-0">
                                        <img
                                            src={student.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.id}`}
                                            alt={student.name}
                                            className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 shadow-sm transition-transform group-hover:scale-105"
                                        />
                                        {isAbsentToday ? (
                                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-[10px] text-white font-bold">!</div>
                                        ) : student.turnstileRegistered && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm text-slate-800 dark:text-white truncate uppercase mb-0.5" title={student.name}>{student.name}</h3>
                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mb-1.5 flex items-center gap-2">
                                            <span>Mat: {student.registration}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                            <span className="text-indigo-500 dark:text-indigo-400 font-bold">{student.grade}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge size="sm" color={student.shift === 'Manhã' ? 'yellow' : 'slate'}>{student.shift}</Badge>
                                            {isAbsentToday && <Badge size="sm" color="red">Faltou Hoje</Badge>}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-y-2.5 gap-x-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between min-w-0">
                                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate mr-1">
                                            <BookOpen size={12} className="mr-1 shrink-0 opacity-50" /> Livro
                                        </div>
                                        <Badge size="sm" color={bookBadge.color as any} onClick={(e) => onToggleBook(student, e)} className="shrink-0">{bookBadge.label}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between min-w-0">
                                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate mr-1">
                                            <Activity size={12} className="mr-1 shrink-0 opacity-50" /> Ed.Fís
                                        </div>
                                        <Badge size="sm" color={peBadge.color as any} onClick={(e) => onTogglePE(student, e)} className="shrink-0">{peBadge.label}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between min-w-0">
                                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate mr-1">
                                            <CreditCard size={12} className="mr-1 shrink-0 opacity-50" /> Catraca
                                        </div>
                                        <Badge size="sm" color={student.turnstileRegistered ? 'green' : 'slate'} onClick={(e) => onToggleTurnstile(student, e)} className="shrink-0">{student.turnstileRegistered ? 'Sim' : 'Não'}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between min-w-0">
                                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate mr-1">
                                            <Calendar size={12} className="mr-1 shrink-0 opacity-50" /> Agenda
                                        </div>
                                        <Badge size="sm" color={student.hasAgenda ? 'green' : 'slate'} onClick={(e) => onToggleAgenda(student, e)} className="shrink-0">{student.hasAgenda ? 'Sim' : 'Não'}</Badge>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-2">
                                        {student.motherPhone && (
                                            <a
                                                href={formatWhatsAppLink(student.motherPhone)}
                                                onClick={(e) => e.stopPropagation()}
                                                target="_blank" rel="noopener noreferrer"
                                                className="w-8 h-8 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-800 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                title="WhatsApp Mãe"
                                            >
                                                <MessageCircle size={16} />
                                            </a>
                                        )}
                                        {student.fatherPhone && (
                                            <a
                                                href={formatWhatsAppLink(student.fatherPhone)}
                                                onClick={(e) => e.stopPropagation()}
                                                target="_blank" rel="noopener noreferrer"
                                                className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-800 transition-all hover:scale-110 active:scale-95 shadow-sm"
                                                title="WhatsApp Pai"
                                            >
                                                <Phone size={16} />
                                            </a>
                                        )}
                                    </div>

                                    {currentUser?.role !== 'Teacher' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleAbsence(student, isAbsentToday); }}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all active:scale-95 ${isAbsentToday
                                                ? 'bg-slate-100 dark:bg-slate-700 text-slate-100 hover:bg-slate-200'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'
                                                }`}
                                        >
                                            {isAbsentToday ? (
                                                <>Remover Falta</>
                                            ) : (
                                                <><XCircle size={14} /> Marcar Falta</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {
                students.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                        <p>Nenhum aluno encontrado com os filtros atuais.</p>
                    </div>
                )
            }
        </div>
    );
};
