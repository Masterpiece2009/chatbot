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
  // Abdelrahman Avatar (Bodyguard/Cool guy)
  const DEFAULT_USER_AVATAR = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop";
  
  // Donia Avatar (Curly hair, Bohemian, Intense)
  const DEFAULT_BOT_AVATAR = "https://images.unsplash.com/photo-1541250628459-d5f27719a0a9?q=80&w=600&auto=format&fit=crop"; 

  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);
  const [botAvatar, setBotAvatar] = useState<string>(DEFAULT_BOT_AVATAR);

  // Load Data
  useEffect(() => {
    const savedNotes = localStorage.getItem('mn3em_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedUserAvatar = localStorage.getItem('mn3em_user_avatar');
    if (savedUserAvatar) setUserAvatar(savedUserAvatar);

    const savedBotAvatar = localStorage.getItem('mn3em_bot_avatar');
    if (savedBotAvatar) setBotAvatar(savedBotAvatar);
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('mn3em_notes', JSON.stringify(notes));
  }, [notes]);

  const updateUserAvatar = (url: string) => {
    setUserAvatar(url);
    localStorage.setItem('mn3em_user_avatar', url);
  };

  const updateBotAvatar = (url: string) => {
    setBotAvatar(url);
    localStorage.setItem('mn3em_bot_avatar', url);
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
    <div className="h-dvh w-full flex flex-col bg-background text-white font-sans overflow-hidden relative selection:bg-accent-500/30">
      
      {/* 1. Background Layer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0f172a] to-[#020617]" />
      
      {/* 2. Main Content Area - Added pt-safe for status bar */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col pt-safe-top">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === Tab.CHAT && (
            <ChatTab 
              onNoteDetected={addNote} 
              userAvatar={userAvatar} 
              botAvatar={botAvatar} 
              onUpdateUserAvatar={updateUserAvatar}
              onUpdateBotAvatar={updateBotAvatar}
            />
          )}
          {activeTab === Tab.VOICE && <VoiceTab onNoteDetected={addNote} />}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* Bottom Navigation HUD - Added pb-safe for home bar */}
      <nav className="h-[88px] pb-safe-bottom bg-[#020617]/95 backdrop-blur-xl border-t border-white/5 flex items-start pt-3 justify-between px-6 z-40 relative shadow-2xl">
        
        {/* Navigation Buttons Left */}
        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 w-16 ${
            activeTab === Tab.CHAT ? 'text-accent-500' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MessageCircle size={24} strokeWidth={activeTab === Tab.CHAT ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-widest uppercase">Chat</span>
        </button>

        {/* Center: Donia Indicator */}
        <div className="relative -top-8 group cursor-pointer flex flex-col items-center" onClick={() => setActiveTab(Tab.CHAT)}>
           <div className={`relative w-16 h-16 rounded-full p-1 bg-[#020617] border-2 transition-all duration-300 shadow-xl overflow-hidden z-20 ${activeTab === Tab.CHAT ? 'border-accent-500 scale-105 shadow-accent-500/20' : 'border-slate-700'}`}>
              <img 
                src={botAvatar} 
                alt="Donia" 
                className="w-full h-full rounded-full object-cover"
              />
           </div>
           {/* Text Label Below Circle */}
           <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors ${activeTab === Tab.CHAT ? 'text-accent-500' : 'text-slate-600'}`}>
             Donia
           </span>
           
           {/* Glow Effect behind */}
           <div className={`absolute top-0 w-16 h-16 rounded-full blur-xl bg-accent-500/30 z-10 transition-opacity duration-500 ${activeTab === Tab.CHAT ? 'opacity-100' : 'opacity-0'}`}></div>
        </div>

        {/* Navigation Buttons Right */}
        <div className="flex gap-4">
            <button
            onClick={() => setActiveTab(Tab.VOICE)}
            className={`flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 w-16 ${
                activeTab === Tab.VOICE ? 'text-accent-500' : 'text-slate-500 hover:text-slate-300'
            }`}
            >
            <Mic size={24} strokeWidth={activeTab === Tab.VOICE ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Voice</span>
            </button>

            <button
            onClick={() => setActiveTab(Tab.NOTES)}
            className={`flex flex-col items-center justify-center space-y-1.5 transition-all duration-300 w-16 ${
                activeTab === Tab.NOTES ? 'text-accent-500' : 'text-slate-500 hover:text-slate-300'
            }`}
            >
            <Database size={24} strokeWidth={activeTab === Tab.NOTES ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Notes</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;