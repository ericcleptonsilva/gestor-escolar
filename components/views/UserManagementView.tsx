import React from 'react';
import { UserCog, Plus, Edit3, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { User } from '../../types';

interface UserManagementViewProps {
    users: User[];
    currentUser: User | null;
    onNewUser: () => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
}

export const UserManagementView = ({
    users,
    currentUser,
    onNewUser,
    onEditUser,
    onDeleteUser
}: UserManagementViewProps) => {

    if (currentUser?.role !== 'Admin') {
        return <div className="p-8 text-center text-red-500">Acesso Negado</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
                    <UserCog className="mr-2 text-indigo-600 dark:text-indigo-400" />
                    Gestão de Usuários
                </h2>
                <Button onClick={onNewUser}>
                    <Plus size={20} /> Novo Usuário
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <Card key={user.id} className="p-6 flex items-start space-x-4">
                        <img
                            src={user.photoUrl}
                            className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700"
                            alt={user.name}
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 dark:text-white truncate">{user.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                            <div className="flex items-center mt-2 space-x-2">
                                <Badge color={user.role === 'Admin' ? 'red' : 'blue'}>
                                    {user.role === 'Admin' ? 'Administrador' : user.role === 'Coordinator' ? 'Coordenador' : 'Professor'}
                                </Badge>
                            </div>
                            {user.role !== 'Admin' && (
                                <p className="text-xs text-slate-400 mt-2">
                                    Acesso a {user.allowedGrades?.length || 0} turmas
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col space-y-2">
                             <Button variant="secondary" className="!p-2" onClick={() => onEditUser(user)}>
                                <Edit3 size={16} />
                            </Button>
                             <Button variant="danger" className="!p-2" onClick={() => onDeleteUser(user.id)}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
