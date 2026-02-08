import React, { useState, useEffect } from 'react';
import { Tab, Note, ChatSession, GalleryItem } from './types';
import { ChatTab } from './components/ChatTab';
import { GalleryTab } from './components/GalleryTab';
import { NotesTab } from './components/NotesTab';
import { Search, Home, PlusSquare, Image as ImageIcon } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  
  // -- CONFIGURATION --
  const DEFAULT_USER_AVATAR = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop";
  const DEFAULT_BOT_AVATAR = "https://images.unsplash.com/photo-1541250628459-d5f27719a0a9?q=80&w=600&auto=format&fit=crop"; 

  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);
  const [botAvatar, setBotAvatar] = useState<string>(DEFAULT_BOT_AVATAR);
  const [chatBackground, setChatBackground] = useState<string | null>(null);

  // -- SESSIONS STATE --
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // Load Data
  useEffect(() => {
    const savedNotes = localStorage.getItem('mn3em_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedGallery = localStorage.getItem('mn3em_gallery');
    if (savedGallery) setGallery(JSON.parse(savedGallery));

    // Load Avatars & Background
    const savedUserAvatar = localStorage.getItem('mn3em_user_avatar');
    if (savedUserAvatar) setUserAvatar(savedUserAvatar);

    const savedBotAvatar = localStorage.getItem('mn3em_bot_avatar');
    if (savedBotAvatar) setBotAvatar(savedBotAvatar);
    
    const savedBg = localStorage.getItem('mn3em_chat_bg');
    if (savedBg) setChatBackground(savedBg);

    const savedSessions = localStorage.getItem('mn3em_sessions');
    let loadedSessions: ChatSession[] = [];
    
    if (savedSessions) {
      loadedSessions = JSON.parse(savedSessions);
      setSessions(loadedSessions);
    }

    if (loadedSessions.length === 0) {
       createNewSession([], false);
    } else {
       const savedCurrentId = localStorage.getItem('mn3em_current_session_id');
       if (savedCurrentId && loadedSessions.find(s => s.id === savedCurrentId)) {
         setCurrentSessionId(savedCurrentId);
       } else {
         setCurrentSessionId(loadedSessions[0].id);
       }
    }
  }, []);

  // Save Data
  useEffect(() => { localStorage.setItem('mn3em_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('mn3em_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { localStorage.setItem('mn3em_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('mn3em_current_session_id', currentSessionId); }, [currentSessionId]);
  
  // Save Config
  useEffect(() => { localStorage.setItem('mn3em_user_avatar', userAvatar); }, [userAvatar]);
  useEffect(() => { localStorage.setItem('mn3em_bot_avatar', botAvatar); }, [botAvatar]);
  useEffect(() => { 
    if (chatBackground) localStorage.setItem('mn3em_chat_bg', chatBackground);
    else localStorage.removeItem('mn3em_chat_bg');
  }, [chatBackground]);

  // -- SESSION MANAGEMENT --
  const createNewSession = (currentList = sessions, switchToIt = true) => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{ 
        id: '1', 
        role: 'model', 
        text: 'وحشتني.. كنت فين؟ ☕', 
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
    e.stopPropagation(); 
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (currentSessionId === sessionId) {
      if (updated.length > 0) setCurrentSessionId(updated[0].id);
      else createNewSession([], false);
    }
  };

  const openSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab(Tab.ACTIVE_CHAT);
  };

  // -- DATA LOGIC --
  const addMessageToCurrent = (role: 'user' | 'model', text: string) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
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
    setNotes(prev => [{ id: Date.now().toString(), content, timestamp: Date.now() }, ...prev]);
  };

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const addGalleryItem = (url: string, caption: string) => {
    setGallery(prev => [{ id: Date.now().toString(), url, caption, timestamp: Date.now() }, ...prev]);
  };

  const deleteGalleryItem = (id: string) => setGallery(prev => prev.filter(i => i.id !== id));

  // -- GLOBAL MEMORY BUILDER --
  const getGlobalMemory = () => {
    const facts = notes.map(n => `[SAVED FACT]: ${n.content}`).join('\n');
    const galleryContext = gallery.map(g => `[PHOTO MEMORY]: ${g.caption}`).join('\n');
    
    const historySummary = sessions.map(s => {
       const recentMsgs = s.messages.slice(-5).map(m => `${m.role === 'user' ? 'Him' : 'Donia'}: ${m.text}`).join(' | ');
       return `[CHAT: ${s.title}]: ${recentMsgs}`;
    }).join('\n');

    return `IMPORTANT MEMORIES:\n${facts}\n\nSHARED PHOTOS:\n${galleryContext}\n\nCONVERSATION HISTORY:\n${historySummary}`;
  };

  return (
    <div className="h-dvh w-full flex flex-col bg-black text-white font-sans overflow-hidden relative">
      
      <main className="flex-1 overflow-hidden relative z-10 flex flex-col pt-safe-top">
        <div className="flex-1 overflow-hidden relative">
          
          {/* VIEW 1: CHAT LIST (HOME) */}
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

               {/* STORIES / MEMORIES BAR */}
               <div className="px-4 pb-2 border-b border-[#262626]">
                 <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                   {/* Add Story */}
                   <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setActiveTab(Tab.GALLERY)}>
                     <div className="w-16 h-16 rounded-full p-[2px] border border-gray-600 relative">
                        <img src={userAvatar} className="w-full h-full rounded-full object-cover" />
                        <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-[2px]">
                          <PlusSquare size={12} />
                        </div>
                     </div>
                     <span className="text-xs text-gray-300">New Memory</span>
                   </div>

                   {/* Gallery Items as Stories */}
                   {gallery.slice(0, 5).map(item => (
                     <div key={item.id} className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setActiveTab(Tab.GALLERY)}>
                       <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600">
                         <div className="w-full h-full rounded-full bg-black flex items-center justify-center p-[2px] border-2 border-black">
                            <img src={item.url} className="w-full h-full rounded-full object-cover" />
                         </div>
                       </div>
                       <span className="text-xs text-gray-300 w-16 truncate text-center">{item.caption.split(' ')[0]}</span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Chat List */}
               {/* Reusing Chat List Logic from prev version */}
               {/* ... (Implementation is implicit from previous file, condensed here for brevity as no logic changed in list view) ... */}
               <div className="flex-1 overflow-y-auto mt-2">
                   {sessions.map(session => (
                    <div 
                      key={session.id} 
                      onClick={() => openSession(session.id)}
                      className="flex items-center justify-between px-4 py-3 active:bg-[#121212]"
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <img src={botAvatar} className="w-14 h-14 rounded-full object-cover border border-[#262626]" alt="Av" />
                          <div className="flex flex-col overflow-hidden">
                             <span className="text-sm font-semibold truncate text-white">{session.title === 'New Chat' ? 'Donia' : session.title}</span>
                             <span className="text-[13px] text-gray-400 truncate w-48">
                                {session.messages[session.messages.length - 1]?.text || 'No messages'}
                             </span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-gray-500">{new Date(session.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                       </div>
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
              chatBackground={chatBackground}
            />
          )}

          {/* VIEW 3: GALLERY */}
          {activeTab === Tab.GALLERY && (
            <GalleryTab 
              items={gallery}
              onAdd={addGalleryItem}
              onDelete={deleteGalleryItem}
            />
          )}

          {/* VIEW 4: NOTES/PROFILE */}
          {activeTab === Tab.PROFILE && (
            <NotesTab 
              notes={notes} 
              onDelete={deleteNote} 
              onAdd={addNote}
              userAvatar={userAvatar}
              botAvatar={botAvatar}
              onUpdateUserAvatar={setUserAvatar}
              onUpdateBotAvatar={setBotAvatar}
              chatBackground={chatBackground}
              onUpdateChatBackground={setChatBackground}
            />
          )}
        </div>
      </main>

      {/* INSTAGRAM NAV */}
      {activeTab !== Tab.ACTIVE_CHAT && (
        <nav className="h-[50px] pb-safe-bottom bg-black border-t border-[#262626] flex items-center justify-around px-2 z-40 relative">
          <button onClick={() => setActiveTab(Tab.CHAT)} className="p-2">
            <Home size={26} strokeWidth={activeTab === Tab.CHAT ? 3 : 2} />
          </button>
          
          <button className="p-2 text-gray-500">
             <Search size={26} />
          </button>

          <button onClick={() => createNewSession(sessions, true)} className="p-2">
             <PlusSquare size={26} className="text-white" />
          </button>

          <button onClick={() => setActiveTab(Tab.GALLERY)} className="p-2">
            <ImageIcon size={26} strokeWidth={activeTab === Tab.GALLERY ? 3 : 2} />
          </button>

          <button onClick={() => setActiveTab(Tab.PROFILE)} className="p-2">
             <div className={`w-7 h-7 rounded-full overflow-hidden border ${activeTab === Tab.PROFILE ? 'border-white' : 'border-transparent'}`}>
                <img src={userAvatar} className="w-full h-full object-cover" />
             </div>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;