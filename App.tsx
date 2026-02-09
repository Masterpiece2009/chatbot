import React, { useState, useEffect, useRef } from 'react';
import { Tab, Note, ChatSession, GalleryItem } from './types';
import { ChatTab } from './components/ChatTab';
import { GalleryTab } from './components/GalleryTab';
import { NotesTab } from './components/NotesTab';
import { Search, Home, PlusSquare, Image as ImageIcon, Trash2, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [notes, setNotes] = useState<Note[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  
  // -- CONFIGURATION --
  const DEFAULT_USER_AVATAR = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600&auto=format&fit=crop";
  const DEFAULT_BOT_AVATAR = "https://img.freepik.com/premium-photo/digital-painting-girl-with-curly-hair-orange-shirt_968529-87385.jpg"; 

  const [userAvatar, setUserAvatar] = useState<string>(DEFAULT_USER_AVATAR);
  const [botAvatar, setBotAvatar] = useState<string>(DEFAULT_BOT_AVATAR);
  const [chatBackground, setChatBackground] = useState<string | null>(null);

  // -- SESSIONS STATE --
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // -- NOTIFICATION & AUTONOMOUS CHAT REFS --
  const lastInteractionTime = useRef<number>(Date.now());
  const timerRef = useRef<any>(null); // Ref for the random timer
  
  // -- EXIT LOGIC STATE --
  const lastBackPressTime = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string>(""); 

  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Load Data
  useEffect(() => {
    const savedNotes = localStorage.getItem('mn3em_notes');
    if (savedNotes) setNotes(JSON.parse(savedNotes));

    const savedGallery = localStorage.getItem('mn3em_gallery');
    if (savedGallery) setGallery(JSON.parse(savedGallery));

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

    // --- 1. REQUEST PERMISSION & SEND IMMEDIATE TEST ---
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
           // Send "TEST" immediately to confirm system works
           sendSystemNotification("System Test 🔔", "Notifications are active and working!");
        }
      });
    }

    // --- 2. START THE RANDOM MESSAGE LOOP ---
    scheduleNextMessage();

    return () => clearTimeout(timerRef.current);
  }, []);

  // -- AUTONOMOUS MESSAGE LOGIC --
  const scheduleNextMessage = () => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Logic: Random time between 30 minutes and 90 minutes
    // For testing: You can lower these numbers (e.g., 10000 for 10 seconds)
    const minTime = 30 * 60 * 1000; // 30 mins
    const maxTime = 90 * 60 * 1000; // 90 mins
    const randomDelay = Math.floor(Math.random() * (maxTime - minTime + 1) + minTime);

    console.log(`Next message scheduled in: ${randomDelay / 60000} minutes`);

    timerRef.current = setTimeout(() => {
        triggerAutonomousMessage();
        scheduleNextMessage(); // Loop forever
    }, randomDelay);
  };

  const triggerAutonomousMessage = () => {
    // Don't send if user is currently active/typing (within last 30 seconds)
    if (Date.now() - lastInteractionTime.current < 30000) return;

    const messages = [
        "بتعمل ايه من غيري؟ ☕",
        "مش بترد عليا ليه؟ 🙄",
        "وحشتني.. قولت أسلم عليك ❤️",
        "هو يومك طويل كده ليه النهاردة؟",
        "عايزة احكيلك على حاجة حصلت.. 🙈",
        "بقولك ايه.. ما تيجي نرغي شوية؟",
        "انت نمت؟ 😴",
        "صاحي ولا نايم؟",
        "فكرتني بحاجة كنا بنعملها سوا..",
        "زهقانة اوي.. وانت؟",
        "فينك مختفي؟ 🕵️‍♀️"
    ];

    const randomText = messages[Math.floor(Math.random() * messages.length)];

    // 1. ADD TO CHAT (ACTUAL MESSAGE)
    // We target the current session, or the first available one
    setSessions(prevSessions => {
        // Find ID to target
        const targetId = currentSessionId || prevSessions[0]?.id;
        if (!targetId) return prevSessions; // Should not happen

        const updated = prevSessions.map(session => {
            if (session.id === targetId) {
                return {
                    ...session,
                    lastModified: Date.now(),
                    messages: [...session.messages, {
                        id: Date.now().toString(),
                        role: 'model', // It comes from HER
                        text: randomText,
                        timestamp: Date.now()
                    }]
                } as ChatSession;
            }
            return session;
        });
        
        // Save immediately to local storage so it persists
        localStorage.setItem('mn3em_sessions', JSON.stringify(updated));
        return updated;
    });

    // 2. SEND NOTIFICATION (SYSTEM BAR)
    sendSystemNotification("Donia 🤍", randomText);
  };

  const sendSystemNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
        try {
            // Using the service worker registration if available is better for mobile, 
            // but standard new Notification works for active apps.
            new Notification(title, {
                body: body,
                icon: botAvatar,
                badge: botAvatar,
                vibrate: [200, 100, 200],
                tag: 'donia-chat' // Replaces older notifications from same tag
            } as any);
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
  };

  // -- EVENT HANDLING --
  const updateInteraction = () => {
    lastInteractionTime.current = Date.now();
    
    // Retry permission if not granted yet
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
  };

  // -- BACK BUTTON HANDLING --
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      const currentTab = activeTabRef.current;
      
      if (currentTab !== Tab.CHAT) {
        setActiveTab(Tab.CHAT);
        window.history.pushState(null, document.title, window.location.href);
      } else {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          window.history.back(); 
        } else {
          lastBackPressTime.current = now;
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 2000);
          window.history.pushState(null, document.title, window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save Effects
  useEffect(() => { localStorage.setItem('mn3em_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('mn3em_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { localStorage.setItem('mn3em_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('mn3em_current_session_id', currentSessionId); }, [currentSessionId]);
  
  useEffect(() => { localStorage.setItem('mn3em_user_avatar', userAvatar); }, [userAvatar]);
  useEffect(() => { localStorage.setItem('mn3em_bot_avatar', botAvatar); }, [botAvatar]);
  useEffect(() => { 
    if (chatBackground) localStorage.setItem('mn3em_chat_bg', chatBackground);
    else localStorage.removeItem('mn3em_chat_bg');
  }, [chatBackground]);

  // -- SESSION MANAGEMENT --
  const createNewSession = (currentList = sessions, switchToIt = true) => {
    updateInteraction();
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
    if (window.confirm("امسح الشات ده؟ 🗑️")) {
        const updated = sessions.filter(s => s.id !== sessionId);
        setSessions(updated);
        if (currentSessionId === sessionId) {
          if (updated.length > 0) setCurrentSessionId(updated[0].id);
          else createNewSession([], false);
        }
    }
  };

  const openSession = (sessionId: string) => {
    updateInteraction();
    setCurrentSessionId(sessionId);
    setActiveTab(Tab.ACTIVE_CHAT);
  };

  // -- DATA LOGIC --
  const addMessageToCurrent = (role: 'user' | 'model', text: string) => {
    updateInteraction();
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
    updateInteraction();
    setNotes(prev => [{ id: Date.now().toString(), content, timestamp: Date.now() }, ...prev]);
  };

  const deleteNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const addGalleryItem = (url: string, caption: string) => {
    updateInteraction();
    setGallery(prev => [{ id: Date.now().toString(), url, caption, timestamp: Date.now() }, ...prev]);
  };

  const deleteGalleryItem = (id: string) => setGallery(prev => prev.filter(i => i.id !== id));

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
    <div className="h-dvh w-full flex flex-col bg-black text-white font-sans overflow-hidden relative" onClick={updateInteraction}>
      
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
               <div className="flex-1 overflow-y-auto mt-2">
                   <div className="px-4 mb-2 flex justify-between items-center">
                    <span className="font-bold text-base">Messages</span>
                    <span className="text-[#3797f0] text-sm">Requests (0)</span>
                   </div>
                   
                   {sessions.map(session => (
                    <div 
                      key={session.id} 
                      onClick={() => openSession(session.id)}
                      className="group flex items-center justify-between px-4 py-3 active:bg-[#121212] transition-colors relative"
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                          <img src={botAvatar} className="w-14 h-14 rounded-full object-cover border border-[#262626]" alt="Av" />
                          <div className="flex flex-col overflow-hidden">
                             <span className="text-sm font-semibold truncate text-white">{session.title === 'New Chat' ? 'Donia' : session.title}</span>
                             <span className={`text-[13px] truncate w-48 ${
                                 // Highlight if the last message was from the Model (Her) and unseen logic could be added here
                                 session.messages[session.messages.length - 1]?.role === 'model' ? 'text-white font-medium' : 'text-gray-400'
                             }`}>
                                {session.messages[session.messages.length - 1]?.text || 'No messages'}
                             </span>
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-1 h-full justify-center">
                          <span className="text-xs text-gray-500 mb-1">{new Date(session.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          
                          <button 
                            onClick={(e) => deleteSession(e, session.id)} 
                            className="text-gray-500 p-2 hover:bg-[#262626] rounded-full transition-all"
                            title="Delete Chat"
                          >
                             <Trash2 size={18} />
                          </button>
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

      {/* EXIT TOAST NOTIFICATION */}
      {showExitToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-2 rounded-full shadow-lg z-50 text-sm animate-pulse border border-gray-600">
           Click back again to exit 🚪
        </div>
      )}

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