import React, { useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { AppState, SchoolCalendarEvent } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/services/api';

interface CalendarViewProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

export function CalendarView({ state, setState }: CalendarViewProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<SchoolCalendarEvent>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Feriado',
    description: ''
  });

  const handleSave = async () => {
    if (!newEvent.date || !newEvent.type) {
      alert("A data e o tipo são obrigatórios.");
      return;
    }
    try {
      const eventToSave: SchoolCalendarEvent = {
        id: newEvent.id || Math.random().toString(36).substr(2, 9),
        date: newEvent.date,
        type: newEvent.type,
        description: newEvent.description || ''
      };
      const saved = await api.saveCalendarEvent(eventToSave);
      setState(prev => {
        const events = prev.calendarEvents || [];
        const exists = events.findIndex(e => e.id === saved.id);
        if (exists >= 0) {
          const updated = [...events];
          updated[exists] = saved;
          return { ...prev, calendarEvents: updated.sort((a,b) => a.date.localeCompare(b.date)) };
        }
        return { ...prev, calendarEvents: [...events, saved].sort((a,b) => a.date.localeCompare(b.date)) };
      });
      setIsAdding(false);
      setNewEvent({ date: new Date().toISOString().split('T')[0], type: 'Feriado', description: '' });
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este evento? As faltas poderão ser recalculadas para esse dia futuramente.")) {
      try {
        await api.deleteCalendarEvent(id);
        setState(prev => ({
          ...prev,
          calendarEvents: (prev.calendarEvents || []).filter(e => e.id !== id)
        }));
      } catch (e: any) {
        alert("Erro ao remover: " + e.message);
      }
    }
  };

  const events = state.calendarEvents || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Calendário Escolar
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gerencie feriados, dias imprensados e recessos que bloqueiam faltas automáticas.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Adicionar Evento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data</label>
              <Input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={newEvent.type}
                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
              >
                <option value="Feriado">Feriado</option>
                <option value="Imprensado">Imprensado (Ponte)</option>
                <option value="Recesso Escolar">Recesso Escolar</option>
                <option value="Sábado Letivo">Sábado Letivo</option>
                <option value="Conselho de Classe">Conselho de Classe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <Input
                type="text"
                placeholder="Ex: Feriado de Tiradentes"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhum evento acadêmico cadastrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-750">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {events.map((evt) => {
                  const [y, m, d] = evt.date.split('-');
                  const formattedDate = `${d}/${m}/${y}`;
                  
                  let typeColor = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
                  if (evt.type === 'Feriado') typeColor = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
                  if (evt.type === 'Imprensado') typeColor = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
                  if (evt.type === 'Recesso Escolar') typeColor = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
                  if (evt.type === 'Sábado Letivo') typeColor = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";

                  return (
                    <tr key={evt.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${typeColor}`}>
                          {evt.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 w-full">
                        {evt.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleDelete(evt.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          title="Remover Evento"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
