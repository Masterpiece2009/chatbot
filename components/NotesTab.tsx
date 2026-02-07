import React from 'react';
import { Note } from '../types';
import { Trash2, Terminal } from 'lucide-react';

interface NotesTabProps {
  notes: Note[];
  onDelete: (id: string) => void;
  onAdd: (content: string) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ notes, onDelete, onAdd }) => {
  const [newNote, setNewNote] = React.useState('');

  const handleAdd = () => {
    if (newNote.trim()) {
      onAdd(newNote);
      setNewNote('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-primary-500/30 bg-black/40 backdrop-blur sticky top-0 z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
           <Terminal className="text-accent-500" size={20} />
           <h1 className="text-xl font-bold text-white tracking-widest font-mono">
             ملاحظات <span className="text-primary-500 text-sm">/ NOTES</span>
           </h1>
        </div>
        <div className="text-[10px] text-primary-700 font-mono">DB: CONNECTED</div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* Add Note Input */}
        <div className="bg-primary-950/40 border border-primary-500/30 rounded-lg p-3 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="أضف ملاحظة يدوياً..."
            className="w-full bg-transparent border-none outline-none text-white placeholder-primary-700 font-mono text-sm mb-2 text-right"
            dir="auto"
          />
          <button 
            onClick={handleAdd}
            className="w-full py-2 bg-primary-900/50 hover:bg-primary-800/50 text-accent-400 border border-accent-500/30 rounded uppercase text-xs font-bold tracking-widest transition-all"
          >
            حفظ في النظام
          </button>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center mt-20 opacity-50">
            <p className="text-primary-800 font-mono text-sm">مفيش ملاحظات متسجلة</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="group relative bg-slate-900/60 border-r-2 border-primary-500 p-4 rounded-l-lg hover:bg-slate-800/60 transition-all text-right">
              <p className="text-white text-sm font-sans leading-relaxed" dir="auto">{note.content}</p>
              <div className="mt-2 flex justify-between items-center flex-row-reverse">
                <span className="text-[10px] text-primary-600 font-mono">
                  {new Date(note.timestamp).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => onDelete(note.id)}
                  className="text-primary-700 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};