import React, { useRef } from 'react';
import { Note } from '../types';
import { Trash2, Plus, Bookmark, Camera } from 'lucide-react';

interface NotesTabProps {
  notes: Note[];
  onDelete: (id: string) => void;
  onAdd: (content: string) => void;
  userAvatar: string;
  botAvatar: string;
  onUpdateUserAvatar: (url: string) => void;
  onUpdateBotAvatar: (url: string) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ 
  notes, onDelete, onAdd,
  userAvatar, botAvatar, onUpdateUserAvatar, onUpdateBotAvatar
}) => {
  const [newNote, setNewNote] = React.useState('');
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const botFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (newNote.trim()) {
      onAdd(newNote);
      setNewNote('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, isBot: boolean) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Compress for avatar (smaller size)
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // JPEG 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          if (isBot) onUpdateBotAvatar(dataUrl);
          else onUpdateUserAvatar(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-center border-b border-[#262626]">
        <h1 className="font-bold text-lg flex items-center gap-2">
          Profile & Memories <Bookmark size={18} />
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-1">
        
        {/* PROFILE SETTINGS SECTION */}
        <div className="p-6 mb-4 border-b border-[#262626]">
          <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest text-center">Identity Setup</h2>
          <div className="flex justify-center gap-12 items-center">
            
            {/* User Avatar */}
            <div className="flex flex-col items-center gap-3">
               <div 
                 className="relative w-20 h-20 rounded-full group cursor-pointer ring-2 ring-[#3797f0] p-1" 
                 onClick={() => userFileInputRef.current?.click()}
               >
                  <img src={userAvatar} className="w-full h-full rounded-full object-cover bg-gray-800" alt="You" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={24} className="text-white drop-shadow-md" />
                  </div>
               </div>
               <span className="text-sm font-semibold text-gray-300">You</span>
               <input 
                 type="file" 
                 ref={userFileInputRef} 
                 className="hidden" 
                 accept="image/*" 
                 onChange={(e) => handleFileSelect(e, false)} 
               />
            </div>

            <div className="h-12 w-[1px] bg-[#262626]"></div>

            {/* Bot Avatar */}
            <div className="flex flex-col items-center gap-3">
               <div 
                 className="relative w-20 h-20 rounded-full group cursor-pointer ring-2 ring-pink-500 p-1" 
                 onClick={() => botFileInputRef.current?.click()}
               >
                  <img src={botAvatar} className="w-full h-full rounded-full object-cover bg-gray-800" alt="Donia" />
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={24} className="text-white drop-shadow-md" />
                  </div>
               </div>
               <span className="text-sm font-semibold text-gray-300">Donia</span>
               <input 
                 type="file" 
                 ref={botFileInputRef} 
                 className="hidden" 
                 accept="image/*" 
                 onChange={(e) => handleFileSelect(e, true)} 
               />
            </div>

          </div>
        </div>

        {/* Add Note Section */}
        <div className="p-4 mb-2">
           <h3 className="text-sm font-bold text-gray-400 mb-3">Saved Memories</h3>
           <div className="flex gap-2">
             <input
               value={newNote}
               onChange={(e) => setNewNote(e.target.value)}
               placeholder="Write something to remember forever..."
               className="flex-1 bg-[#262626] rounded-lg px-4 py-3 text-sm text-white outline-none border border-transparent focus:border-[#3797f0]"
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

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-4">
            <p className="text-xs text-center max-w-[200px] text-gray-600">No written memories yet.</p>
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