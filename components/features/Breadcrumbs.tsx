import React from 'react';
import { Home, ChevronRight } from 'lucide-react';
import { ViewState, Student, User } from '../../types';

interface BreadcrumbsProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    selectedStudent: Student | null;
    setSelectedStudent: (s: Student | null) => void;
    isEditingStudent: boolean;
    setIsEditingStudent: (v: boolean) => void;
    isEditingUser: boolean;
    setIsEditingUser: (v: boolean) => void;
    tempStudent: Student;
    tempUser: User;
}

export const Breadcrumbs = ({
    view, setView,
    selectedStudent, setSelectedStudent,
    isEditingStudent, setIsEditingStudent,
    isEditingUser, setIsEditingUser,
    tempStudent, tempUser
}: BreadcrumbsProps) => {
    if (view === 'dashboard') return null;

    const viewLabels: Record<string, string> = {
        students: 'Alunos',
        attendance: 'Frequência',
        health: 'Documentos',
        exams: 'Segunda Chamada',
        reports: 'Relatórios IA',
        users: 'Usuários',
        pedagogical: 'Pedagógico',
        network: 'Diagnóstico de Rede'
    };

    return (
        <nav className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-6 no-print overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                    <button
                        onClick={() => { setView('dashboard'); setSelectedStudent(null); setIsEditingStudent(false); }}
                        className="inline-flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <Home size={14} className="mr-2" />
                        Painel Geral
                    </button>
                </li>
                <li>
                    <div className="flex items-center">
                        <ChevronRight size={16} className="text-slate-400" />
                        <button
                            onClick={() => { setSelectedStudent(null); setIsEditingStudent(false); setIsEditingUser(false); }}
                            className={`ml-1 md:ml-2 font-medium ${selectedStudent || isEditingStudent || isEditingUser ? 'hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer' : 'text-slate-800 dark:text-white cursor-default'}`}
                            disabled={!selectedStudent && !isEditingStudent && !isEditingUser}
                        >
                            {viewLabels[view]}
                        </button>
                    </div>
                </li>
                {(selectedStudent || isEditingStudent || isEditingUser) && (
                     <li>
                        <div className="flex items-center">
                            <ChevronRight size={16} className="text-slate-400" />
                            <span className="ml-1 md:ml-2 font-medium text-slate-800 dark:text-white truncate max-w-[150px] md:max-w-[200px]">
                                {isEditingStudent
                                    ? (tempStudent.id ? 'Editar Aluno' : 'Novo Aluno')
                                    : isEditingUser
                                    ? (tempUser.id ? 'Editar Usuário' : 'Novo Usuário')
                                    : selectedStudent?.name}
                            </span>
                        </div>
                    </li>
                )}
            </ol>
        </nav>
    );
};
