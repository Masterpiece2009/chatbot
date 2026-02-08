import React from 'react';
import { Note } from '../types';
import { Trash2, Plus, Bookmark } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-center border-b border-[#262626]">
        <h1 className="font-bold text-lg flex items-center gap-2">
          Donia's Memory <Bookmark size={18} />
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-1">
        {/* Add Note Section - Styled like a "Create" area */}
        <div className="p-4 mb-2">
           <div className="flex gap-2">
             <input
               value={newNote}
               onChange={(e) => setNewNote(e.target.value)}
               placeholder="Add a new memory..."
               className="flex-1 bg-[#262626] rounded-lg px-4 py-2 text-sm text-white outline-none border border-transparent focus:border-[#3797f0]"
             />
             <button 
               onClick={handleAdd}
               disabled={!newNote.trim()}
               className="bg-[#3797f0] text-white px-4 rounded-lg font-semibold text-sm disabled:opacity-50"
             >
               Save
             </button>
           </div>
        </div>

        {/* Notes Grid - Instagram Style */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500 gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-gray-700 flex items-center justify-center">
               <Bookmark size={40} />
            </div>
            <p className="text-lg font-bold text-white">No Memories Yet</p>
            <p className="text-xs text-center max-w-[200px]">When you save notes or ask Donia to remember things, they will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1 px-1">
            {notes.map((note) => (
              <div key={note.id} className="relative aspect-square bg-[#121212] border border-[#262626] p-4 flex flex-col justify-between group">
                <p className="text-sm text-gray-200 line-clamp-6 leading-relaxed font-sans" dir="auto">
                  {note.content}
                </p>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-[10px] text-gray-500">
                    {new Date(note.timestamp).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => onDelete(note.id)}
                    className="text-gray-600 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
