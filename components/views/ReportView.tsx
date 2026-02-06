import React from 'react';
import { Bot, Loader2, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ReportViewProps {
    aiReport: string;
    setAiReport: (report: string) => void;
    aiReportPrompt: string;
    setAiReportPrompt: (prompt: string) => void;
    isGenerating: boolean;
    onGenerateReport: () => void;
}

export const ReportView = ({
    aiReport, setAiReport,
    aiReportPrompt, setAiReportPrompt,
    isGenerating, onGenerateReport
}: ReportViewProps) => {
    return (
    <div className="space-y-6 max-w-4xl mx-auto">
         <div className="flex items-center space-x-4 mb-4">
            <Bot size={32} className="text-indigo-600 dark:text-indigo-400" />
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Relatórios Inteligentes (Gemini AI)</h2>
                <p className="text-slate-500 dark:text-slate-400">Gere análises detalhadas e insights sobre sua escola instantaneamente.</p>
            </div>
         </div>

         <Card className="p-6 border-indigo-200 dark:border-indigo-900 shadow-lg">
             <div className="space-y-4">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">O que você gostaria de saber?</label>
                 <div className="flex gap-2">
                     <Input
                        placeholder="Ex: Resuma os principais problemas de frequência do Fundamental II..."
                        value={aiReportPrompt}
                        onChange={e => setAiReportPrompt(e.target.value)}
                        className="flex-1"
                     />
                     <Button onClick={onGenerateReport} disabled={isGenerating}>
                         {isGenerating ? <Loader2 className="animate-spin" size={20}/> : <Bot size={20} />}
                         <span className="hidden sm:inline">Gerar Análise</span>
                     </Button>
                 </div>

                 <div className="flex flex-wrap gap-2 text-xs">
                     <button onClick={() => setAiReportPrompt("Análise geral de frequência e faltas críticas")} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Frequência</button>
                     <button onClick={() => setAiReportPrompt("Resumo dos documentos de saúde entregues este mês")} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Saúde</button>
                     <button onClick={() => setAiReportPrompt("Lista de alunos pendentes de 2ª chamada")} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Provas</button>
                     <button onClick={() => setAiReportPrompt("Sugestões de gestão escolar baseadas nos dados atuais")} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Gestão</button>
                 </div>
             </div>
         </Card>

         {aiReport && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow animate-in fade-in slide-in-from-bottom-2">
                 <div className="prose dark:prose-invert max-w-none">
                     <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                            <Bot size={20} />
                            <span className="font-bold">Análise Gerada</span>
                        </div>
                        <button onClick={() => setAiReport("")} className="text-slate-400 hover:text-slate-600"><X size={16}/></button>
                     </div>
                     <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">
                        {aiReport}
                     </div>
                 </div>
             </div>
         )}
    </div>
  );
};
