import React from 'react';
import { Note } from '../types';
import { Trash2, FileText, Plus } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 bg-background/80 backdrop-blur sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-accent-500" />
          Notes
        </h1>
        <p className="text-slate-400 text-xs mt-1">Donia's Memory Bank</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
        {/* Add Note Input */}
        <div className="bg-[#1e293b] rounded-2xl p-4 shadow-sm border border-white/5">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write something to remember..."
            className="w-full bg-transparent border-none outline-none text-white placeholder-slate-500 text-base resize-none mb-3 text-right font-sans"
            rows={2}
            dir="auto"
          />
          <button 
            onClick={handleAdd}
            disabled={!newNote.trim()}
            className="w-full py-3 bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Add Note
          </button>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-12 text-slate-600 gap-3">
            <FileText size={48} className="opacity-20" />
            <p className="text-sm">No notes saved yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="group bg-[#1e293b]/50 border border-white/5 p-4 rounded-xl hover:bg-[#1e293b] transition-all text-right">
                <p className="text-gray-100 text-base leading-relaxed whitespace-pre-wrap font-sans" dir="auto">
                  {note.content}
                </p>
                <div className="mt-3 flex justify-between items-center border-t border-white/5 pt-3">
                   <button 
                    onClick={() => onDelete(note.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-2 -ml-2 rounded-full hover:bg-white/5"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span className="text-xs text-slate-500">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};