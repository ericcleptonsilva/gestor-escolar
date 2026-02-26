import React from 'react';
import { FileText, Plus, Filter, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PrintButton } from '../features/PrintButton';
import { AppState, Student, HealthDocument, DocType } from '../../types';
import { SHIFTS_LIST } from '../../constants';

interface HealthViewProps {
    students: Student[];
    documents: HealthDocument[];
    newDoc: HealthDocument;
    setNewDoc: (doc: HealthDocument) => void;
    filterDocGrade: string;
    setFilterDocGrade: (grade: string) => void;
    filterDocShift: string;
    setFilterDocShift: (shift: string) => void;
    filterDocType: DocType | '';
    setFilterDocType: (type: DocType | '') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    visibleGradesList: string[];
    onPrint: () => void;
    onSaveDocument: () => void;
    onDeleteDocument: (id: string) => void;
}

export const HealthView = ({
    students,
    documents,
    newDoc, setNewDoc,
    filterDocGrade, setFilterDocGrade,
    filterDocShift, setFilterDocShift,
    filterDocType, setFilterDocType,
    searchTerm, setSearchTerm,
    visibleGradesList,
    onPrint,
    onSaveDocument,
    onDeleteDocument
}: HealthViewProps) => {

    const filteredDocs = (documents || []).filter(doc => {
        const student = (students || []).find(s => s.id === doc.studentId);
        if (!student) return false;

        const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = filterDocGrade ? student.grade === filterDocGrade : true;
        const matchesShift = filterDocShift ? student.shift === filterDocShift : true;
        const matchesType = filterDocType ? doc.type === filterDocType : true;

        return matchesSearch && matchesGrade && matchesShift && matchesType;
    });

    return (
      <div className="space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
              <FileText className="mr-2 text-indigo-600 dark:text-indigo-400" />
              Documentos de Saúde
           </h2>
           <PrintButton onClick={onPrint} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card className="p-6">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Novo Documento</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Aluno</label>
                            <Select
                                value={newDoc.studentId}
                                onChange={e => setNewDoc({...newDoc, studentId: e.target.value})}
                            >
                                <option value="">Selecione o Aluno...</option>
                                {(students || []).sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                                    <option key={s.id} value={s.id}>{s.name} - {s.grade}</option>
                                ))}
                            </Select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo de Documento</label>
                             <Select
                                value={newDoc.type}
                                onChange={e => setNewDoc({...newDoc, type: e.target.value as DocType})}
                            >
                                <option value={DocType.MEDICAL_REPORT}>Laudo Médico</option>
                                <option value={DocType.PHYSICAL_EDUCATION}>Atestado Ed. Física</option>
                             </Select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data de Emissão</label>
                             <Input type="date" value={newDoc.dateIssued} onChange={e => setNewDoc({...newDoc, dateIssued: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição / Observação</label>
                             <textarea
                                className="w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 dark:text-slate-100"
                                rows={3}
                                value={newDoc.description}
                                onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                             ></textarea>
                        </div>
                        <Button className="w-full" onClick={onSaveDocument}>
                            <Plus size={18} /> Cadastrar Documento
                        </Button>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center"><Filter size={16} className="mr-2"/> Filtros</h3>
                     <div className="space-y-3">
                        <Input placeholder="Buscar aluno..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        <Select value={filterDocGrade} onChange={e => setFilterDocGrade(e.target.value)}>
                            <option value="">Todas as Turmas</option>
                            {visibleGradesList.map(g => <option key={g} value={g}>{g}</option>)}
                        </Select>
                        <Select value={filterDocShift} onChange={e => setFilterDocShift(e.target.value)}>
                            <option value="">Todos os Turnos</option>
                            {SHIFTS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Select value={filterDocType} onChange={e => setFilterDocType(e.target.value as DocType)}>
                            <option value="">Todos os Tipos</option>
                            <option value={DocType.MEDICAL_REPORT}>Laudo Médico</option>
                            <option value={DocType.PHYSICAL_EDUCATION}>Atestado Ed. Física</option>
                        </Select>
                     </div>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDocs.map(doc => {
                        const student = (students || []).find(s => s.id === doc.studentId);
                        return (
                            <Card key={doc.id} className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`p-2 rounded-full ${doc.type === DocType.MEDICAL_REPORT ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <Badge color={doc.type === DocType.MEDICAL_REPORT ? 'red' : 'blue'}>{doc.type}</Badge>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white truncate" title={student?.name}>{student?.name}</h4>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">{student?.grade} • {student?.shift}</div>

                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg min-h-[60px]">
                                        <p className="text-sm text-slate-600 dark:text-slate-300 italic line-clamp-3">
                                            "{doc.description || "Sem descrição."}"
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
                                    <span className="text-xs text-slate-400">Emissão: {new Date(doc.dateIssued).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                                    <button
                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        onClick={() => onDeleteDocument(doc.id)}
                                        title="Excluir Documento"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </Card>
                        );
                    })}
                    {filteredDocs.length === 0 && (
                         <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            <FileText size={48} className="mx-auto mb-3 opacity-20" />
                            <p>Nenhum documento encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
};
