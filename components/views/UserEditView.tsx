import React from 'react';
import { ArrowLeft, Save, Camera } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { User, UserRole } from '../../types';
import { GRADE_GROUPS } from '../../constants';

interface UserEditViewProps {
    user: User;
    setUser: (u: User) => void;
    onSave: () => void;
    onCancel: () => void;
    onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const UserEditView = ({
    user, setUser,
    onSave, onCancel,
    onPhotoUpload
}: UserEditViewProps) => {

    const toggleGradeGroupAccess = (groupName: string, isChecked: boolean) => {
        const gradesInGroup = GRADE_GROUPS[groupName as keyof typeof GRADE_GROUPS];
        let currentGrades = [...(user.allowedGrades || [])];

        if (isChecked) {
          gradesInGroup.forEach(g => {
            if (!currentGrades.includes(g)) currentGrades.push(g);
          });
        } else {
          currentGrades = currentGrades.filter(g => !gradesInGroup.includes(g));
        }
        setUser({...user, allowedGrades: currentGrades});
    };

    return (
             <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center space-x-2 mb-6">
                    <Button variant="secondary" onClick={onCancel} className="!p-2">
                        <ArrowLeft size={20}/>
                    </Button>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                        {user.id ? 'Editar Usuário' : 'Novo Usuário'}
                    </h2>
                </div>

                <Card className="p-6">
                    <div className="space-y-4">
                        <div className="flex justify-center mb-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600">
                                    <img src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.name || 'User'}`} className="w-full h-full object-cover" />
                                </div>
                                <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-indigo-700">
                                    <Camera size={14} />
                                    <input type="file" className="hidden" accept="image/*" onChange={onPhotoUpload} />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <Input value={user.name} onChange={e => setUser({...user, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <Input type="email" value={user.email} onChange={e => setUser({...user, email: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha {user.id && "(deixe em branco para manter)"}</label>
                            <Input type="password" value={user.password || ''} onChange={e => setUser({...user, password: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Função</label>
                             <Select value={user.role} onChange={e => setUser({...user, role: e.target.value as UserRole})}>
                                <option value="Coordinator">Coordenador(a)</option>
                                <option value="Teacher">Professor(a)</option>
                                <option value="Admin">Administrador</option>
                             </Select>
                        </div>

                        {user.role !== 'Admin' && (
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Permissões de Acesso (Séries)</label>
                                <div className="space-y-4">
                                    {Object.entries(GRADE_GROUPS).map(([group, grades]) => (
                                        <div key={group}>
                                            <div className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                    onChange={(e) => toggleGradeGroupAccess(group, e.target.checked)}
                                                    checked={grades.every(g => user.allowedGrades?.includes(g))}
                                                />
                                                <span className="text-xs font-bold uppercase text-slate-500">{group}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-5">
                                                {grades.map(grade => (
                                                    <label key={grade} className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                                            checked={user.allowedGrades?.includes(grade)}
                                                            onChange={(e) => {
                                                                const current = user.allowedGrades || [];
                                                                if (e.target.checked) {
                                                                    setUser({...user, allowedGrades: [...current, grade]});
                                                                } else {
                                                                    setUser({...user, allowedGrades: current.filter(g => g !== grade)});
                                                                }
                                                            }}
                                                        />
                                                        <span>{grade}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 pt-6 border-t dark:border-slate-700">
                            <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                            <Button onClick={onSave}>
                                <Save size={18} />
                                <span>Salvar Usuário</span>
                            </Button>
                        </div>
                    </div>
                </Card>
             </div>
    );
};
