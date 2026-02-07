import React, { useState, useEffect } from 'react';
import { Tab, Note } from './types';
import { ChatTab } from './components/ChatTab';
import { VoiceTab } from './components/VoiceTab';
import { NotesTab } from './components/NotesTab';
import { MessageCircle, Mic, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // -- IMAGES CONFIGURATION --
  const BACKGROUND_URL = "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop"; 
  const USER_AVATAR_URL = "https://www.pinterest.com/pin/894949757218402418/"; 
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
    <div className="h-screen w-full flex flex-col bg-[#020617] text-cyan-50 font-sans overflow-hidden relative selection:bg-cyan-500/30">
      
      {/* 1. Background Layer: Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-20 grayscale mix-blend-overlay"
        style={{ backgroundImage: `url(${BACKGROUND_URL})` }}
      />
      
      {/* 2. Background Layer: Holographic Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      
      {/* 3. Background Layer: Vignette */}
      <div className="absolute inset-0 z-0 bg-radial-gradient(circle at center, transparent 30%, #020617 100%) pointer-events-none" />

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
        {/* Top Scanline Decoration */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_cyan]"></div>
        
        <div className="flex-1 overflow-hidden relative backdrop-blur-[2px]">
          {activeTab === Tab.CHAT && <ChatTab onNoteDetected={addNote} userAvatar={USER_AVATAR_URL} botAvatar={BOT_AVATAR_URL} />}
          {activeTab === Tab.VOICE && <VoiceTab onNoteDetected={addNote} />}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* Bottom Navigation HUD */}
      <nav className="h-24 bg-[#020617]/95 backdrop-blur-xl border-t border-cyan-500/30 flex items-center justify-between px-8 pb-6 z-40 relative shadow-[0_-5px_30px_rgba(6,182,212,0.15)]">
        
        {/* Navigation Buttons Left */}
        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
            activeTab === Tab.CHAT ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_cyan]' : 'text-slate-500 hover:text-cyan-700'
          }`}
        >
          <MessageCircle size={24} strokeWidth={activeTab === Tab.CHAT ? 2.5 : 2} />
          <span className="text-[10px] font-mono tracking-widest uppercase">Chat</span>
        </button>

        {/* Center: Mn3em (Bot Identity) */}
        <div className="relative -top-8 group cursor-pointer" onClick={() => setActiveTab(Tab.CHAT)}>
           {/* Rotating Outer Ring */}
          <div className="absolute inset-[-6px] rounded-full border-2 border-cyan-500/30 border-t-cyan-400 border-r-transparent animate-[spin_3s_linear_infinite]"></div>
          <div className="absolute inset-[-6px] rounded-full border-2 border-cyan-500/10 border-b-cyan-400 border-l-transparent animate-[spin_5s_linear_infinite_reverse]"></div>
          
          {/* Static Glow */}
          <div className="absolute inset-0 rounded-full bg-cyan-400 blur-lg opacity-20 group-hover:opacity-60 transition-opacity"></div>
          
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-black border border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)] overflow-hidden">
             <img 
               src={BOT_AVATAR_URL} 
               alt="Mn3em" 
               className="w-full h-full rounded-full object-cover"
             />
             {/* Tech Overlay on Image */}
             <div className="absolute inset-0 bg-cyan-500/10 mix-blend-overlay"></div>
          </div>
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-32 text-center">
            <span className="text-xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,1)]">منعم</span>
          </div>
        </div>

        {/* Navigation Buttons Right */}
        <div className="flex gap-8">
            <button
            onClick={() => setActiveTab(Tab.VOICE)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                activeTab === Tab.VOICE ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_cyan]' : 'text-slate-500 hover:text-cyan-700'
            }`}
            >
            <Mic size={24} strokeWidth={activeTab === Tab.VOICE ? 2.5 : 2} />
            <span className="text-[10px] font-mono tracking-widest uppercase">Voice</span>
            </button>

            <button
            onClick={() => setActiveTab(Tab.NOTES)}
            className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
                activeTab === Tab.NOTES ? 'text-cyan-400 scale-110 drop-shadow-[0_0_8px_cyan]' : 'text-slate-500 hover:text-cyan-700'
            }`}
            >
            <ShieldCheck size={24} strokeWidth={activeTab === Tab.NOTES ? 2.5 : 2} />
            <span className="text-[10px] font-mono tracking-widest uppercase">Data</span>
            </button>
        </div>
      </nav>
    </div>
  );
};

export default App;