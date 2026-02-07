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
      <div className="px-6 py-4 border-b border-cyan-500/30 bg-black/40 backdrop-blur sticky top-0 z-10 flex items-center gap-2">
        <Terminal className="text-cyan-400" size={20} />
        <h1 className="text-xl font-bold text-cyan-400 tracking-widest font-mono">
          MEMORY BANKS
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
        {/* Add Note Input */}
        <div className="bg-slate-900/80 border border-cyan-500/50 rounded-lg p-3 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Manual entry..."
            className="w-full bg-transparent border-none outline-none text-cyan-100 placeholder-cyan-700 font-mono text-sm mb-2"
          />
          <button 
            onClick={handleAdd}
            className="w-full py-2 bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-400 border border-cyan-500/30 rounded uppercase text-xs font-bold tracking-widest transition-all"
          >
            Encrypt & Save
          </button>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center mt-20 opacity-50">
            <p className="text-cyan-800 font-mono text-sm">NO DATA FOUND</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="group relative bg-slate-900/60 border-l-2 border-cyan-500 p-4 rounded-r-lg hover:bg-slate-800/60 transition-all">
              <p className="text-cyan-100 text-sm font-sans leading-relaxed">{note.content}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-[10px] text-cyan-700 font-mono">
                  {new Date(note.timestamp).toLocaleDateString()} • {new Date(note.timestamp).toLocaleTimeString()}
                </span>
                <button 
                  onClick={() => onDelete(note.id)}
                  className="text-cyan-700 hover:text-red-400 transition-colors"
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