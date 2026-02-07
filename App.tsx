import React, { useState, useEffect } from 'react';
import { Tab, Note } from './types';
import { ChatTab } from './components/ChatTab';
import { VoiceTab } from './components/VoiceTab';
import { NotesTab } from './components/NotesTab';
import { MessageCircle, Mic, Database } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // -- CONFIGURATION --
  // New specific avatars from prompt
  const DEFAULT_USER_AVATAR = "https://lh3.googleusercontent.com/gg-dl/AOI_d__60dHSJKTtd6JvFQ-iYkZhG7jSS8_4IyYqekqM8SFFkRooF2gG7Er10SNg8V6JYjd0lSZ6myyvV-mrO1dKeLZ4s3arV_0ndfSxLeAFmOhw_yL845RZS0mC45unsA9fAChhf-1l181gzjOH0hcZjDJXSCwpJX38YYIUThD1SqXTWFf1=s1024-rj";
  const BOT_AVATAR_URL = "https://lh3.googleusercontent.com/gg-dl/AOI_d_9XHQSElitf2Coi4t3NYycwmo36PuVX-I2NrndhM5NohpKB43boiCupt14uxRZwjQ_hziRLmKKv0fG1FuG4AH4X2_0BkM3GuYTyrixRljuEhb7W4JL59F0Mtal_8d1Tkdp2La01O8tbzsuLhWBYViU-6Z_XIxHx_xZa4_pP5pCLWis0HQ=s1024-rj"; 

  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);

  // Load Data
  useEffect(() => {
    const savedNotes = localStorage.getItem('mn3em_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedAvatar = localStorage.getItem('mn3em_user_avatar');
    if (savedAvatar) setUserAvatar(savedAvatar);
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('mn3em_notes', JSON.stringify(notes));
  }, [notes]);

  const updateUserAvatar = (url: string) => {
    setUserAvatar(url);
    localStorage.setItem('mn3em_user_avatar', url);
  };

  const addNote = (content: string) => {
    const newNote: Note = {
      id: Date.now().toString(),
      content,
      timestamp: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-white font-sans overflow-hidden relative selection:bg-accent-500/30">
      
      {/* 1. Background Layer: Subtle Gradient (Relaxing) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-slate-900 to-[#020617]" />
      
      {/* 2. Ambient Glow (Soft) */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/5 blur-[100px] pointer-events-none"></div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
        <div className="flex-1 overflow-hidden relative backdrop-blur-[2px]">
          {activeTab === Tab.CHAT && (
            <ChatTab 
              onNoteDetected={addNote} 
              userAvatar={userAvatar} 
              botAvatar={BOT_AVATAR_URL} 
              onUpdateUserAvatar={updateUserAvatar}
            />
          )}
          {activeTab === Tab.VOICE && <VoiceTab onNoteDetected={addNote} />}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* Bottom Navigation HUD */}
      <nav className="h-20 bg-background/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-8 z-40 relative shadow-2xl">
        
        {/* Navigation Buttons Left */}
        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
            activeTab === Tab.CHAT ? 'text-accent-500 scale-105' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageCircle size={22} strokeWidth={activeTab === Tab.CHAT ? 2.5 : 2} />
          <span className="text-[9px] font-bold tracking-widest uppercase">Chat</span>
        </button>

        {/* Center: Men3em Indicator */}
        <div className="relative -top-6 group cursor-pointer" onClick={() => setActiveTab(Tab.CHAT)}>
           {/* Glow Ring */}
           <div className={`absolute inset-0 rounded-full blur-md transition-opacity duration-500 ${activeTab === Tab.CHAT ? 'bg-accent-500/40 opacity-100' : 'opacity-0'}`}></div>
           
           <div className={`relative w-14 h-14 rounded-full p-1 bg-background border-2 transition-all duration-300 shadow-xl overflow-hidden ${activeTab === Tab.CHAT ? 'border-accent-500 scale-110' : 'border-slate-700'}`}>
              <img 
                src={BOT_AVATAR_URL} 
                alt="Men3em" 
                className="w-full h-full rounded-full object-cover"
              />
           </div>
        </div>

        {/* Navigation Buttons Right */}
        <div className="flex gap-8">
            <button
            onClick={() => setActiveTab(Tab.VOICE)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                activeTab === Tab.VOICE ? 'text-accent-500 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
            >
            <Mic size={22} strokeWidth={activeTab === Tab.VOICE ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-widest uppercase">Voice</span>
            </button>

            <button
            onClick={() => setActiveTab(Tab.NOTES)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                activeTab === Tab.NOTES ? 'text-accent-500 scale-105' : 'text-slate-500 hover:text-slate-300'
            }`}
            >
            <Database size={22} strokeWidth={activeTab === Tab.NOTES ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-widest uppercase">Notes</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;