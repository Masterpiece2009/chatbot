import React, { useState, useEffect } from 'react';
import { Tab, Note } from './types';
import { ChatTab } from './components/ChatTab';
import { VoiceTab } from './components/VoiceTab';
import { NotesTab } from './components/NotesTab';
import { MessageCircle, Mic, Database } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // -- IMAGES CONFIGURATION --
  // Iron Man Dark/Red Background
  const BACKGROUND_URL = "https://images.unsplash.com/photo-1635863138275-d9b33299680b?q=80&w=2000&auto=format&fit=crop"; 
  
  // !!! IMPORTANT: REPLACE THESE URLS WITH THE LINKS TO YOUR UPLOADED IMAGES !!!
  // USER AVATAR (Your photo in white shirt)
  const USER_AVATAR_URL = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"; 
  
  // BOT AVATAR (Men3em in leather jacket)
  const BOT_AVATAR_URL = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop"; 

  // Load Notes
  useEffect(() => {
    const saved = localStorage.getItem('mn3em_notes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  // Save Notes
  useEffect(() => {
    localStorage.setItem('mn3em_notes', JSON.stringify(notes));
  }, [notes]);

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
    <div className="h-screen w-full flex flex-col bg-[#020617] text-white font-sans overflow-hidden relative selection:bg-red-500/30">
      
      {/* 1. Background Layer: Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
      />
      
      {/* 2. Background Layer: Red Tech Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* 3. Background Layer: Vignette */}
      <div className="absolute inset-0 z-0 bg-radial-gradient(circle at center, transparent 20%, #020617 100%) pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
        {/* Top Scanline Decoration */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_red]"></div>
        
        <div className="flex-1 overflow-hidden relative backdrop-blur-[2px]">
          {activeTab === Tab.CHAT && <ChatTab onNoteDetected={addNote} userAvatar={USER_AVATAR_URL} botAvatar={BOT_AVATAR_URL} />}
          {activeTab === Tab.VOICE && <VoiceTab onNoteDetected={addNote} />}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* Bottom Navigation HUD */}
      <nav className="h-24 bg-[#0f0404]/95 backdrop-blur-xl border-t border-red-900/50 flex items-center justify-between px-8 pb-6 z-40 relative shadow-[0_-5px_30px_rgba(220,38,38,0.15)]">
        
        {/* Navigation Buttons Left */}
        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
            activeTab === Tab.CHAT ? 'text-accent-500 scale-110 drop-shadow-[0_0_8px_#f59e0b]' : 'text-red-900/60 hover:text-red-500'
          }`}
        >
          <MessageCircle size={24} strokeWidth={activeTab === Tab.CHAT ? 2.5 : 2} />
          <span className="text-[10px] font-mono tracking-widest uppercase">محادثة</span>
        </button>

        {/* Center: Mn3em (Bot Identity) - Iron Man Arc Style */}
        <div className="relative -top-8 group cursor-pointer" onClick={() => setActiveTab(Tab.CHAT)}>
           {/* Rotating Outer Ring (Gold/Red) */}
          <div className="absolute inset-[-6px] rounded-full border-2 border-red-500/30 border-t-accent-500 border-r-transparent animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-[-6px] rounded-full border-2 border-red-500/10 border-b-red-500 border-l-transparent animate-[spin_5s_linear_infinite_reverse]"></div>
          
          {/* Static Glow */}
          <div className="absolute inset-0 rounded-full bg-red-500 blur-lg opacity-20 group-hover:opacity-60 transition-opacity"></div>
          
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-black border border-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)] overflow-hidden">
             <img 
               src={BOT_AVATAR_URL} 
               alt="Mn3em" 
               className="w-full h-full rounded-full object-cover"
             />
             <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay"></div>
          </div>
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-32 text-center">
            <span className="text-xl font-bold text-accent-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.8)]">منعم</span>
          </div>
        </div>

        {/* Navigation Buttons Right */}
        <div className="flex gap-8">
            <button
            onClick={() => setActiveTab(Tab.VOICE)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                activeTab === Tab.VOICE ? 'text-accent-500 scale-110 drop-shadow-[0_0_8px_#f59e0b]' : 'text-red-900/60 hover:text-red-500'
            }`}
            >
            <Mic size={24} strokeWidth={activeTab === Tab.VOICE ? 2.5 : 2} />
            <span className="text-[10px] font-mono tracking-widest uppercase">تحدث</span>
            </button>

            <button
            onClick={() => setActiveTab(Tab.NOTES)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                activeTab === Tab.NOTES ? 'text-accent-500 scale-110 drop-shadow-[0_0_8px_#f59e0b]' : 'text-red-900/60 hover:text-red-500'
            }`}
            >
            <Database size={24} strokeWidth={activeTab === Tab.NOTES ? 2.5 : 2} />
            <span className="text-[10px] font-mono tracking-widest uppercase">ملاحظات</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;