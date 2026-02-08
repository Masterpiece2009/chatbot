import React, { useState, useEffect } from 'react';
import { Tab, Note, ChatSession, Message } from './types';
import { ChatTab } from './components/ChatTab';
import { NotesTab } from './components/NotesTab';
import { MessageCircle, Search, Home, PlusSquare, User, Trash2 } from 'lucide-react';

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

    // Initialize if empty
    if (loadedSessions.length === 0) {
       createNewSession([], false); // Create first session
    } else {
       // Set active to most recent
       const savedCurrentId = localStorage.getItem('mn3em_current_session_id');
       if (savedCurrentId && loadedSessions.find(s => s.id === savedCurrentId)) {
         setCurrentSessionId(savedCurrentId);
       } else {
         setCurrentSessionId(loadedSessions[0].id);
       }
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
  const createNewSession = (currentList = sessions, switchToIt = true) => {
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
    
    if (switchToIt) {
      setCurrentSessionId(newSession.id);
      setActiveTab(Tab.ACTIVE_CHAT);
    }
    return newSession.id;
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation(); // Prevent opening chat
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    
    // If we deleted the current one
    if (currentSessionId === sessionId) {
      if (updated.length > 0) {
        setCurrentSessionId(updated[0].id);
      } else {
        createNewSession([], false);
      }
    }
  };

  const openSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab(Tab.ACTIVE_CHAT);
  };

  // -- MESSAGE LOGIC --
  const addMessageToCurrent = (role: 'user' | 'model', text: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        // Update title if it's the first user message
        let newTitle = session.title;
        if (session.messages.length <= 1 && role === 'user') {
           newTitle = text.slice(0, 25) + (text.length > 25 ? '...' : '');
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

  // -- MEMORY CONSTRUCTION --
  // This helps "Donia" remember things across chats
  const getGlobalMemory = () => {
    const notesContent = notes.map(n => `- ${n.content}`).join('\n');
    const recentChatTitles = sessions.slice(0, 5).map(s => `Chat about: ${s.title}`).join('\n');
    return `SAVED MEMORIES (FACTS):\n${notesContent}\n\nRECENT CONVERSATION TOPICS:\n${recentChatTitles}`;
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-black text-white font-sans overflow-hidden relative">
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col pt-safe-top">
        <div className="flex-1 overflow-hidden relative">
          
          {/* VIEW 1: CHAT LIST (DM VIEW) */}
          {activeTab === Tab.CHAT && (
            <div className="flex flex-col h-full">
               {/* Header */}
               <div className="h-[60px] flex items-center justify-between px-4">
                  <h1 className="text-xl font-bold flex items-center gap-1">
                    Donia <span className="text-[#3797f0] text-xs">▼</span>
                  </h1>
                  <button onClick={() => createNewSession(sessions, true)}>
                    <PlusSquare size={26} />
                  </button>
               </div>
               
               {/* Search Bar */}
               <div className="px-4 py-2">
                 <div className="bg-[#262626] rounded-xl h-9 flex items-center px-3 gap-2">
                   <Search size={16} className="text-gray-500" />
                   <input placeholder="Search" className="bg-transparent text-sm outline-none w-full" />
                 </div>
               </div>

               {/* Messages List */}
               <div className="flex-1 overflow-y-auto mt-2">
                  <div className="px-4 mb-4">
                    <span className="font-bold text-base">Messages</span>
                  </div>
                  
                  {sessions.map(session => (
                    <div 
                      key={session.id} 
                      onClick={() => openSession(session.id)}
                      className="flex items-center justify-between px-4 py-2 active:bg-[#121212]"
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <img src={botAvatar} className="w-14 h-14 rounded-full object-cover border border-[#262626]" alt="Av" />
                          <div className="flex flex-col overflow-hidden">
                             <span className="text-sm font-semibold truncate text-white">{session.title === 'New Chat' ? 'Donia' : session.title}</span>
                             <span className="text-xs text-gray-400 truncate w-48">
                                {session.messages[session.messages.length - 1]?.text || 'No messages'}
                                <span className="mx-1">·</span>
                                {new Date(session.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                          </div>
                       </div>
                       
                       <button onClick={(e) => deleteSession(e, session.id)} className="text-gray-600 p-2">
                          <Trash2 size={18} />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* VIEW 2: ACTIVE CHAT */}
          {activeTab === Tab.ACTIVE_CHAT && (
            <ChatTab 
              currentSessionId={currentSessionId}
              sessions={sessions}
              onAddMessage={addMessageToCurrent}
              onNoteDetected={addNote}
              onBack={() => setActiveTab(Tab.CHAT)}
              userAvatar={userAvatar} 
              botAvatar={botAvatar}
              globalMemory={getGlobalMemory()}
            />
          )}

          {/* VIEW 3: NOTES (PROFILE/SAVED) */}
          {activeTab === Tab.NOTES && <NotesTab notes={notes} onDelete={deleteNote} onAdd={addNote} />}
        </div>
      </main>

      {/* INSTAGRAM BOTTOM NAV (Only show if NOT in active chat) */}
      {activeTab !== Tab.ACTIVE_CHAT && (
        <nav className="h-[60px] pb-safe-bottom bg-black border-t border-[#262626] flex items-center justify-around px-2 z-40 relative">
          
          <button onClick={() => setActiveTab(Tab.CHAT)} className="p-2">
            <Home size={26} strokeWidth={activeTab === Tab.CHAT ? 3 : 2} />
          </button>

          <button className="p-2 text-gray-500">
            <Search size={26} />
          </button>

          <button onClick={() => createNewSession(sessions, true)} className="p-2 text-white">
             <PlusSquare size={26} />
          </button>

          <button onClick={() => setActiveTab(Tab.NOTES)} className="p-2">
            <MessageCircle size={26} strokeWidth={activeTab === Tab.NOTES ? 3 : 2} />
          </button>

          <button className="p-2">
             <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden border border-white">
                <img src={userAvatar} className="w-full h-full object-cover" />
             </div>
          </button>

        </nav>
      )}
    </div>
  );
};

export default App;
