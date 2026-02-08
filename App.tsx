import React, { useState, useEffect } from 'react';
import { Tab, Note, ChatSession, Message } from './types';
import { ChatTab } from './components/ChatTab';
import { NotesTab } from './components/NotesTab';
import { MessageCircle, Database } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  
  // -- CONFIGURATION --
  const DEFAULT_USER_AVATAR = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop";
  const DEFAULT_BOT_AVATAR = "https://images.unsplash.com/photo-1541250628459-d5f27719a0a9?q=80&w=600&auto=format&fit=crop"; 

  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);
  const [botAvatar, setBotAvatar] = useState<string>(DEFAULT_BOT_AVATAR);

  // -- SESSIONS STATE --
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

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

    // Load Sessions
    const savedSessions = localStorage.getItem('mn3em_sessions');
    let loadedSessions: ChatSession[] = [];
    
    if (savedSessions) {
      loadedSessions = JSON.parse(savedSessions);
      setSessions(loadedSessions);
    }

    // Set active session or create new if none
    const savedCurrentId = localStorage.getItem('mn3em_current_session_id');
    if (savedCurrentId && loadedSessions.find(s => s.id === savedCurrentId)) {
      setCurrentSessionId(savedCurrentId);
    } else {
      createNewSession(loadedSessions);
    }
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('mn3em_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('mn3em_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('mn3em_current_session_id', currentSessionId);
  }, [currentSessionId]);


  // -- SESSION MANAGEMENT --
  const createNewSession = (currentList = sessions) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{ 
        id: '1', 
        role: 'model', 
        text: 'إيه يا ابني.. فينك؟ القهوة بردت.. ☕', 
        timestamp: Date.now() 
      }],
      lastModified: Date.now()
    };
    
    const updatedSessions = [newSession, ...currentList];
    setSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    return newSession.id;
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
      } else {
        createNewSession(updated);
      }
    }
  };

  // -- MESSAGE LOGIC --
  const getCurrentMessages = () => {
    const session = sessions.find(s => s.id === currentSessionId);
    return session ? session.messages : [];
  };

  const addMessageToCurrent = (role: 'user' | 'model', text: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Update title if it's the first user message
        let newTitle = session.title;
        if (session.messages.length <= 1 && role === 'user') {
          newTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '');
        }
        
        return {
          ...session,
          title: newTitle,
          lastModified: Date.now(),
          messages: [...session.messages, {
            id: Date.now().toString(),
            role,
            text,
            timestamp: Date.now()
          }]
        };
      }
      return session;
    }));
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
    <div className="h-dvh w-full flex flex-col bg-[#0b141a] text-[#e9edef] font-sans overflow-hidden relative">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col pt-safe-top">
        <div className="flex-1 overflow-hidden relative">
          {activeTab === Tab.CHAT && (
            <ChatTab 
              messages={getCurrentMessages()}
              sessions={sessions}
              currentSessionId={currentSessionId}
              onAddMessage={addMessageToCurrent}
              onNoteDetected={addNote}
              onNewChat={() => createNewSession()}
              onSwitchSession={switchSession}
              onDeleteSession={deleteSession}
              userAvatar={userAvatar} 
              botAvatar={botAvatar} 
            />
          )}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* Bottom Navigation HUD - Simple 2 Tabs */}
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