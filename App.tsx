import React, { useState, useEffect } from 'react';
import { Tab, Note, Message } from './types';
import { ChatTab } from './components/ChatTab';
import { VoiceTab } from './components/VoiceTab';
import { NotesTab } from './components/NotesTab';
import { MessageCircle, Mic, Database } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // -- CONFIGURATION --
  const DEFAULT_USER_AVATAR = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop";
  const DEFAULT_BOT_AVATAR = "https://images.unsplash.com/photo-1541250628459-d5f27719a0a9?q=80&w=600&auto=format&fit=crop"; 

  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);
  const [botAvatar, setBotAvatar] = useState<string>(DEFAULT_BOT_AVATAR);

  // -- MESSAGES STATE (SHARED & PERSISTENT) --
  const [messages, setMessages] = useState<Message[]>([]);

  // Load Data
  useEffect(() => {
    // Load Notes
    const savedNotes = localStorage.getItem('mn3em_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    // Load Avatars
    const savedUserAvatar = localStorage.getItem('mn3em_user_avatar');
    if (savedUserAvatar) setUserAvatar(savedUserAvatar);

    const savedBotAvatar = localStorage.getItem('mn3em_bot_avatar');
    if (savedBotAvatar) setBotAvatar(savedBotAvatar);

    // Load Chat History
    const savedMessages = localStorage.getItem('mn3em_messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      // Default Initial Message if empty
      setMessages([{ 
        id: '1', 
        role: 'model', 
        text: 'هو أنت هتفضل باصص في البتاع ده كتير؟ 😒 ما تقوم تشوفلنا صرفة.. ولا أنت خلاص استريحت للقعدة دي؟ 🙄 الجو بقى تلج، مش معاك جاكيت ولا أي حاجة نتدفى بيها بدل ما إحنا قاعدين زي اللاجئين كده؟ 🥶', 
        timestamp: Date.now() 
      }]);
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('mn3em_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('mn3em_messages', JSON.stringify(messages));
  }, [messages]);

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

  // Helper to add message from any tab
  const addMessage = (role: 'user' | 'model', text: string) => {
    const msg: Message = {
      id: Date.now().toString(),
      role,
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, msg]);
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-background text-white font-sans overflow-hidden relative selection:bg-accent-500/30">
      
      {/* 1. Background Layer */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0f172a] to-[#020617]" />
      
      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col pt-safe-top">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === Tab.CHAT && (
            <ChatTab 
              messages={messages}
              onAddMessage={addMessage}
              onNoteDetected={addNote} 
              userAvatar={userAvatar} 
              botAvatar={botAvatar} 
              onUpdateUserAvatar={updateUserAvatar}
              onUpdateBotAvatar={updateBotAvatar}
            />
          )}
          {activeTab === Tab.VOICE && (
            <VoiceTab 
              messages={messages} // Pass history for context
              onAddMessage={addMessage} // Pass function to save voice interactions
              onNoteDetected={addNote} 
            />
          )}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* Bottom Navigation HUD */}
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
           <span className={`text-[10px] font-bold uppercase tracking-widest mt-2 transition-colors ${activeTab === Tab.CHAT ? 'text-accent-500' : 'text-slate-600'}`}>
             Donia
           </span>
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