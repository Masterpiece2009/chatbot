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
      resetChat();
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

  const resetChat = () => {
     const initialMsg: Message = { 
        id: '1', 
        role: 'model', 
        text: 'بتفكري في إيه وأنتي ساكتة كده؟ شكلك مش عاجبني.. 🙄', 
        timestamp: Date.now() 
      };
      setMessages([initialMsg]);
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
    <div className="h-dvh w-full flex flex-col bg-[#0b141a] text-[#e9edef] font-sans overflow-hidden relative">
      
      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col pt-safe-top">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === Tab.CHAT && (
            <ChatTab 
              messages={messages}
              onAddMessage={addMessage}
              onNoteDetected={addNote}
              onClearChat={resetChat}
              userAvatar={userAvatar} 
              botAvatar={botAvatar} 
              // Removed updateAvatar props for cleaner WhatsApp look, 
              // assuming avatars are static or managed in settings later
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

      {/* Bottom Navigation HUD - WhatsApp Style */}
      <nav className="h-[70px] pb-safe-bottom bg-[#202c33] border-t border-[#202c33] flex items-center justify-around px-2 z-40 relative">
        
        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center justify-center space-y-1 w-20 py-2 rounded-xl transition-all ${
            activeTab === Tab.CHAT ? 'bg-[#00a884]/10 text-[#00a884]' : 'text-[#8696a0]'
          }`}
        >
          <MessageCircle size={22} fill={activeTab === Tab.CHAT ? "currentColor" : "none"} />
          <span className="text-[12px] font-medium">Chats</span>
        </button>

        <button
            onClick={() => setActiveTab(Tab.VOICE)}
            className={`flex flex-col items-center justify-center space-y-1 w-20 py-2 rounded-xl transition-all ${
                activeTab === Tab.VOICE ? 'bg-[#00a884]/10 text-[#00a884]' : 'text-[#8696a0]'
            }`}
        >
            <Mic size={22} fill={activeTab === Tab.VOICE ? "currentColor" : "none"} />
            <span className="text-[12px] font-medium">Call</span>
        </button>

        <button
            onClick={() => setActiveTab(Tab.NOTES)}
            className={`flex flex-col items-center justify-center space-y-1 w-20 py-2 rounded-xl transition-all ${
                activeTab === Tab.NOTES ? 'bg-[#00a884]/10 text-[#00a884]' : 'text-[#8696a0]'
            }`}
        >
            <Database size={22} fill={activeTab === Tab.NOTES ? "currentColor" : "none"} />
            <span className="text-[12px] font-medium">Notes</span>
        </button>
      </nav>
    </div>
  );
};

export default App;