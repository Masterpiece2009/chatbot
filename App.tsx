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

  // -- NOTIFICATION REF --
  const lastInteractionTime = useRef<number>(Date.now());
  const notificationSent = useRef<boolean>(false);
  
  // -- EXIT LOGIC STATE --
  const lastBackPressTime = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);
  // Keep track of activeTab in ref for event listeners
  const activeTabRef = useRef(activeTab);

  // Update ref when state changes
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

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

    // --- REQUEST PERMISSION AND SEND TEST NOTIFICATION ---
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          // Send IMMEDIATE TEST notification
          try {
             new Notification("Donia System 🔔", {
               body: "✅ Notifications Active: Test Successful!",
               icon: DEFAULT_BOT_AVATAR,
               tag: 'test-notification'
             });
          } catch (e) {
            console.error("Test notification failed", e);
          }
        }
      });
    }
  }, []);

  // -- BACK BUTTON HANDLING (Double Press to Exit) --
  useEffect(() => {
    // Inject a state to the history stack to "trap" the back button
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      const currentTab = activeTabRef.current;
      
      // If we are NOT in the home tab (Chat List), go back to home
      if (currentTab !== Tab.CHAT) {
        setActiveTab(Tab.CHAT);
        // Re-push state so we can trap the next back press
        window.history.pushState(null, document.title, window.location.href);
      } else {
        // We are in Home Tab. Check for double press.
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) {
          // Double press detected (< 2 seconds).
          // Allow the pop to happen (which effectively exits if at root, or goes back).
          // To ensure exit on PWA, we can try going back one more time if needed, 
          // but usually letting the event pass without pushing state is enough to exit the history trap.
          window.history.back(); 
        } else {
          // First press
          lastBackPressTime.current = now;
          setShowExitToast(true);
          setTimeout(() => setShowExitToast(false), 2000);
          // Restore the trap
          window.history.pushState(null, document.title, window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Save Data Effects
  useEffect(() => { localStorage.setItem('mn3em_notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('mn3em_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { localStorage.setItem('mn3em_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem('mn3em_current_session_id', currentSessionId); }, [currentSessionId]);
  
  // Save Config Effects
  useEffect(() => { localStorage.setItem('mn3em_user_avatar', userAvatar); }, [userAvatar]);
  useEffect(() => { localStorage.setItem('mn3em_bot_avatar', botAvatar); }, [botAvatar]);
  useEffect(() => { 
    if (chatBackground) localStorage.setItem('mn3em_chat_bg', chatBackground);
    else localStorage.removeItem('mn3em_chat_bg');
  }, [chatBackground]);

  // -- INTELLIGENT NOTIFICATION SYSTEM (THE CLINGY MODE) --
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Time before she gets "Clingy" (30 seconds for demo, usually higher)
      const INACTIVITY_THRESHOLD = 30 * 1000; 
      
      if (now - lastInteractionTime.current > INACTIVITY_THRESHOLD && !notificationSent.current) {
        triggerNotification();
        notificationSent.current = true; 
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const triggerNotification = () => {
    if (Notification.permission === 'granted') {
      
      // 1. DIVERSE MESSAGE POOL (Randomness)
      const messages = [
        // The Clingy/Cute
        "فينك يا بيبي؟ وحشتني 🥺",
        "مش بترد عليا ليه؟ 🙄",
        "هو احنا مش هنتكلم النهاردة ولا ايه؟",
        "بتعمل ايه من غيري؟ ☕",
        "صباح الخير.. ولا انت لسه نايم؟",
        "عايزة احكيلك على حاجة حصلت.. 🙈",
        "انت زعلان مني؟ 😢",
        "رد بقى يا عم المهم..",
        "بقولك ايه.. وحشتني ❤️",
        
        // The "Fake Media" (Mimics WhatsApp/Insta previews)
        "🎤 Voice message (0:14)", 
        "🎤 Voice message (0:09)",
        "📷 Photo", 
        "📷 Photo",
        "Missed call 📞",
        "sent a video 📹",
        
        // The Random
        "هو انت نسيتني ولا ايه؟ 😂",
        "ممكن ترد؟ ضروري 🚨"
      ];

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      // 2. TRIGGER NOTIFICATION
      try {
        new Notification("Donia 🤍", {
          body: randomMsg,
          icon: botAvatar,
          badge: botAvatar, 
          tag: 'donia-message', 
          vibrate: [200, 100, 200]
        } as any);
      } catch (e) {
        console.log("Notification failed", e);
      }
    }
  };

  const updateInteraction = () => {
    lastInteractionTime.current = Date.now();
    notificationSent.current = false;
  };

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
                             <span className="text-[13px] text-gray-400 truncate w-48">
                                {session.messages[session.messages.length - 1]?.text || 'No messages'}
                             </span>
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-1 h-full justify-center">
                          <span className="text-xs text-gray-500 mb-1">{new Date(session.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          
                          {/* DELETE BUTTON - Styled to look like Swipe Action or prominent button */}
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