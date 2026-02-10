import React, { useRef } from 'react';
import { Note } from '../types';
import { Trash2, Plus, Bookmark, Camera, Wallpaper, Check, Bell, BellRing } from 'lucide-react';

interface NotesTabProps {
  notes: Note[];
  onDelete: (id: string) => void;
  onAdd: (content: string) => void;
  userAvatar: string;
  botAvatar: string;
  onUpdateUserAvatar: (url: string) => void;
  onUpdateBotAvatar: (url: string) => void;
  chatBackground: string | null;
  onUpdateChatBackground: (bg: string | null) => void;
  
  // Notification Props
  permissionStatus: NotificationPermission;
  onRequestPermission: () => void;
  onTestNotification: () => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({ 
  notes, onDelete, onAdd,
  userAvatar, botAvatar, onUpdateUserAvatar, onUpdateBotAvatar,
  chatBackground, onUpdateChatBackground,
  permissionStatus, onRequestPermission, onTestNotification
}) => {
  const [newNote, setNewNote] = React.useState('');
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const botFileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (newNote.trim()) {
      onAdd(newNote);
      setNewNote('');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'bot' | 'bg') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Compress settings
          const MAX_SIZE = type === 'bg' ? 1200 : 400; // Larger for backgrounds
          const QUALITY = type === 'bg' ? 0.8 : 0.7;
          
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
          
          if (type === 'bot') onUpdateBotAvatar(dataUrl);
          else if (type === 'user') onUpdateUserAvatar(dataUrl);
          else if (type === 'bg') onUpdateChatBackground(dataUrl);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const colors = [
    { name: 'Default', value: null },
    { name: 'Midnight', value: '#1e1b4b' }, // indigo-950
    { name: 'Plum', value: '#4a044e' }, // fuchsia-950
    { name: 'Forest', value: '#052e16' }, // green-950
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-center border-b border-[#262626]">
        <h1 className="font-bold text-lg flex items-center gap-2">
          Profile & Settings <Bookmark size={18} />
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-1">
        
        {/* IDENTITY SETUP */}
        <div className="p-6 mb-2 border-b border-[#262626]">
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
                 onChange={(e) => handleFileSelect(e, 'user')} 
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
                 onChange={(e) => handleFileSelect(e, 'bot')} 
               />
            </div>

          </div>
        </div>

        {/* NOTIFICATIONS CONTROL */}
        <div className="p-6 mb-2 border-b border-[#262626]">
           <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest text-center flex items-center justify-center gap-2">
             <Bell size={14} /> Notifications
           </h2>

           <div className="flex flex-col items-center gap-3">
             <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${permissionStatus === 'granted' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-300 capitalize">Status: {permissionStatus}</span>
             </div>
             
             {permissionStatus !== 'granted' ? (
                <button 
                  onClick={onRequestPermission}
                  className="bg-[#3797f0] text-white px-6 py-2 rounded-lg font-semibold text-sm w-full max-w-[200px]"
                >
                  Enable Notifications
                </button>
             ) : (
                <button 
                  onClick={onTestNotification}
                  className="bg-[#262626] border border-gray-700 text-white px-6 py-2 rounded-lg font-semibold text-sm w-full max-w-[200px] flex items-center justify-center gap-2"
                >
                  <BellRing size={16} /> Test Notification
                </button>
             )}
             <p className="text-[10px] text-gray-500 text-center px-4">
                Note: On some phones, you must keep this app in the background (minimized) for notifications to arrive reliably.
             </p>
           </div>
        </div>

        {/* CHAT WALLPAPER SECTION */}
        <div className="p-6 mb-2 border-b border-[#262626]">
          <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest text-center flex items-center justify-center gap-2">
            <Wallpaper size={14} /> Chat Wallpaper
          </h2>
          
          <div className="flex items-center justify-center gap-4 mb-4">
             {colors.map((c) => (
               <button
                 key={c.name}
                 onClick={() => onUpdateChatBackground(c.value)}
                 className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                   (chatBackground === c.value) ? 'border-white' : 'border-transparent'
                 }`}
                 style={{ backgroundColor: c.value || '#000' }}
                 title={c.name}
               >
                 {(chatBackground === c.value) && <Check size={16} className="text-white" />}
               </button>
             ))}
             
             {/* Upload BG */}
             <button
               onClick={() => bgFileInputRef.current?.click()}
               className={`w-10 h-10 rounded-full border-2 border-[#3797f0] flex items-center justify-center bg-[#121212] overflow-hidden relative`}
             >
                {chatBackground && chatBackground.length > 50 ? (
                  <img src={chatBackground} className="w-full h-full object-cover opacity-60" />
                ) : (
                  <Wallpaper size={18} className="text-[#3797f0]" />
                )}
             </button>
             <input 
                 type="file" 
                 ref={bgFileInputRef} 
                 className="hidden" 
                 accept="image/*" 
                 onChange={(e) => handleFileSelect(e, 'bg')} 
             />
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
          <div className="flex flex-col items-center justify-center py-6 text-gray-500 gap-4">
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