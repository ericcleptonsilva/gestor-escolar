import React from 'react';
import { ArrowLeft, Save, UserCircle, Loader2, Camera } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Student, BookStatus, PEStatus, Shift } from '../../types';
import { SHIFTS_LIST } from '../../constants';

interface StudentEditViewProps {
    student: Student;
    setStudent: (s: Student) => void;
    onSave: () => void;
    onCancel: () => void;
    onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isUploadingPhoto: boolean;
    visibleGradesList: string[];
}

export const StudentEditView = ({
    student,
    setStudent,
    onSave,
    onCancel,
    onPhotoUpload,
    isUploadingPhoto,
    visibleGradesList
}: StudentEditViewProps) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
           <div className="flex items-center space-x-2 mb-6">
                <Button variant="secondary" onClick={onCancel} className="!p-2">
                    <ArrowLeft size={20}/>
                </Button>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {student.id ? 'Editar Aluno' : 'Novo Aluno'}
                </h2>
           </div>

           <Card className="p-4 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-3 flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 dark:border-indigo-900 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={64} className="text-slate-300 dark:text-slate-500" />
                      )}
                    </div>
                    <label className={`absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 shadow-lg transition-transform hover:scale-105 ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isUploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <input type="file" className="hidden" accept="image/*" onChange={onPhotoUpload} disabled={isUploadingPhoto} />
                    </label>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                      {isUploadingPhoto ? "Enviando foto..." : "Clique na câmera para alterar a foto"}
                  </p>
                </div>

                <div className="md:col-span-9 space-y-6">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-400 border-b dark:border-slate-700 pb-2">Dados Pessoais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                            <Input placeholder="Ex: João da Silva" value={student.name} onChange={e => setStudent({...student, name: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                             <Input placeholder="Ex: 2024001" value={student.registration} onChange={e => setStudent({...student, registration: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Nascimento</label>
                            <Input type="date" value={student.birthDate} onChange={e => setStudent({...student, birthDate: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número de Sequência</label>
                             <Input placeholder="Ex: 05" value={student.sequenceNumber} onChange={e => setStudent({...student, sequenceNumber: e.target.value})} />
                        </div>
                    </div>

                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-400 border-b dark:border-slate-700 pb-2 pt-4">Escolaridade</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Série / Turma</label>
                            <Select value={student.grade} onChange={e => setStudent({...student, grade: e.target.value})}>
                                {visibleGradesList.map(g => <option key={g} value={g}>{g}</option>)}
                            </Select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Turno</label>
                            <Select value={student.shift} onChange={e => setStudent({...student, shift: e.target.value as Shift})}>
                                {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </Select>
                        </div>
                    </div>

                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-400 border-b dark:border-slate-700 pb-2 pt-4">Filiação e Contato</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do Pai</label>
                            <Input value={student.fatherName} onChange={e => setStudent({...student, fatherName: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp do Pai</label>
                            <Input placeholder="(00) 00000-0000" value={student.fatherPhone} onChange={e => setStudent({...student, fatherPhone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da Mãe</label>
                            <Input value={student.motherName} onChange={e => setStudent({...student, motherName: e.target.value})} />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp da Mãe</label>
                            <Input placeholder="(00) 00000-0000" value={student.motherPhone} onChange={e => setStudent({...student, motherPhone: e.target.value})} />
                        </div>
                    </div>

                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-400 border-b dark:border-slate-700 pb-2 pt-4">Status Administrativo</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Situação do Livro</label>
                            <Select value={student.bookStatus} onChange={e => setStudent({...student, bookStatus: e.target.value as BookStatus})}>
                                <option value="Comprou">Comprou Livro</option>
                                <option value="Nao Comprou">Não Comprou</option>
                                <option value="Copia">Cópia do Livro</option>
                                <option value="Livro Antigo">Livro Antigo</option>
                            </Select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Atestado Ed. Física</label>
                            <Select value={student.peStatus} onChange={e => setStudent({...student, peStatus: e.target.value as PEStatus})}>
                                <option value="Pendente">Pendente</option>
                                <option value="Em Análise">Em Análise</option>
                                <option value="Aprovado">Aprovado</option>
                                <option value="Reprovado">Reprovado</option>
                            </Select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Possui Cadastro na Catraca?</label>
                            <div className="flex items-center space-x-4 mt-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="turnstile"
                                        checked={student.turnstileRegistered}
                                        onChange={() => setStudent({...student, turnstileRegistered: true})}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-slate-700 dark:text-slate-300">Sim</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="turnstile"
                                        checked={!student.turnstileRegistered}
                                        onChange={() => setStudent({...student, turnstileRegistered: false})}
                                        className="text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-slate-700 dark:text-slate-300">Não</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t dark:border-slate-700">
                        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                        <Button onClick={onSave}>
                            <Save size={18} />
                            <span>Salvar Aluno</span>
                        </Button>
                    </div>
                </div>
              </div>
           </Card>
        </div>
    );
};
