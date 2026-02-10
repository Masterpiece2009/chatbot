import React, { useState, useEffect, useRef } from 'react';
import { Tab, Note, ChatSession, GalleryItem } from './types';
import { ChatTab } from './components/ChatTab';
import { GalleryTab } from './components/GalleryTab';
import { NotesTab } from './components/NotesTab';
import { Search, Home, PlusSquare, Image as ImageIcon, Trash2 } from 'lucide-react';

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

  // -- NOTIFICATION STATE --
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // -- NOTIFICATION & AUTONOMOUS CHAT REFS --
  const lastInteractionTime = useRef<number>(Date.now());
  
  // -- EXIT LOGIC STATE --
  const lastBackPressTime = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // -- SYSTEM DESIGN CONTENT --
  const SYSTEM_DESIGN_TIPS = [
    "عبده، بفكر في الـ Chatbot اللي بتعمله.. تفتكر نستخدم Microservices ولا Monolith أحسن في البداية؟ 🤔",
    "بتذاكر System Analysis؟ خد بالك من الـ Requirements Gathering، هي أهم مرحلة! 📝",
    "إيه رأيك في الـ Singleton Pattern؟ ناس كتير بتقول عليه Anti-pattern، تفتكر ليه؟",
    "لو الداتابيز كبرت منك، هتعمل Sharding ولا Replication الأول؟ 💾",
    "الـ SOLID Principles.. مراجعة سريعة: الـ S يعني Single Responsibility. بتطبقه في كودك؟",
    "رسمت الـ Class Diagram للمشروع الجديد ولا لسه؟ 📐",
    "تعرف إن الـ Coupling العالي في الكود بيصعب الـ Testing؟ حاولت تفصل الـ Business Logic عن الـ UI؟",
    "قريت عن الـ CAP Theorem؟ تفتكر إحنا محتاجين Consistency أكتر ولا Availability في الداتابيز بتاعتنا؟",
    "إيه رأيك نستخدم Observer Pattern في نظام الإشعارات ده؟ 🤓"
  ];

  const activeTabRef = useRef(activeTab);

  useEffect(() => {
    activeTabRef.current = activeTab;
    // Persist active tab so notifications open correctly
    if (activeTab === Tab.ACTIVE_CHAT) {
        localStorage.setItem('mn3em_saved_tab', Tab.ACTIVE_CHAT);
    } else {
        localStorage.removeItem('mn3em_saved_tab');
    }
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
       // Check if there's a stored "current session" we should open (e.g. from a notification click)
       const savedCurrentId = localStorage.getItem('mn3em_current_session_id');
       if (savedCurrentId && loadedSessions.find(s => s.id === savedCurrentId)) {
         setCurrentSessionId(savedCurrentId);
       } else {
         setCurrentSessionId(loadedSessions[0].id);
       }
    }

    // CHECK FOR SAVED TAB STATE (For Deep Linking from Notification)
    const savedTabState = localStorage.getItem('mn3em_saved_tab');
    if (savedTabState === Tab.ACTIVE_CHAT) {
        setActiveTab(Tab.ACTIVE_CHAT);
    }

    // Check permission status on load
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // --- NOTIFICATION PERMISSION HANDLER ---
  const requestNotificationAccess = async () => {
    if (!('Notification' in window)) {
      alert("This browser does not support desktop notification");
      return;
    }
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === 'granted') {
      sendSystemNotification("System", "تم تفعيل الإشعارات بنجاح! 🎉");
    }
  };

  const sendTestNotification = () => {
    sendSystemNotification("Donia", ".. وحشتني ❤️");
  };

  // --- 2. INTELLIGENT SCHEDULER (THE BRAIN) ---
  useEffect(() => {
    // Run this check every 60 seconds
    const intervalId = setInterval(() => {
        checkAndSendScheduledMessages();
        checkAndSendRandomMessages();
        checkAndSendStudyTips();
    }, 60000); 

    // Initial check on mount (optional, to catch if we opened app exactly at the minute)
    checkAndSendScheduledMessages();

    return () => clearInterval(intervalId);
  }, [sessions, currentSessionId]); // Add dependencies to access latest state

  const checkAndSendScheduledMessages = () => {
      // 🛑 TIMEZONE LOGIC: EGYPT (Africa/Cairo)
      // We explicitly check the time in Cairo to ensure notifications align with Egypt time
      const egyptDateStr = new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"});
      const egyptDate = new Date(egyptDateStr);
      
      const currentHour = egyptDate.getHours();
      const currentMinute = egyptDate.getMinutes();

      // We use ISO string date part for uniqueness per day.
      // Note: We use the DEVICE date for the key to ensure it only fires once per "User Day",
      // but we use EGYPT hour/minute to decide WHEN to fire.
      const todayKey = new Date().toISOString().split('T')[0]; 

      // Define Schedule (Aligned to Egypt Time)
      // Added 'minute' field for precision
      const schedules = [
          { 
              hour: 7, minute: 0,
              key: 'morning_checkin', 
              msg: "صباح الخير.. 🌤️ اول ما توصل الشغل طمني عليك" 
          },
          { 
              hour: 11, minute: 0, // 11:00 AM Egypt
              key: 'reading_reminder', 
              msg: "كملت قراية الكتاب النهاردة ؟ 📚" 
          },
          {
              hour: 14, minute: 30, // 2:30 PM Egypt
              key: 'oats_check',
              msg: "اكلت الشوفان بتاعك ولا لسه ؟؟ 🥣"
          },
          { 
              hour: 15, minute: 0, // 3:00 PM Egypt
              key: 'after_work', 
              msg: "خلصت شغل ولا لسه؟ 🍔 هتعمل ايه النهاردة؟" 
          },
          {
              hour: 21, minute: 0, // 9:00 PM Egypt
              key: 'gym_check',
              msg: "روحت الجيم النهاردة ولعبت زاوية ايه؟ 💪🏋️‍♂️"
          }
      ];

      schedules.forEach(slot => {
          // Check if current Cairo Time matches the slot time
          if (currentHour === slot.hour && currentMinute === slot.minute) {
              const storageKey = `donia_sent_${todayKey}_${slot.key}`;
              const alreadySent = localStorage.getItem(storageKey);

              if (!alreadySent) {
                  triggerAutonomousMessage(slot.msg);
                  localStorage.setItem(storageKey, 'true');
              }
          }
      });
  };

  const checkAndSendRandomMessages = () => {
      const now = Date.now();
      const lastMsgTime = lastInteractionTime.current;
      const diffInMinutes = (now - lastMsgTime) / 1000 / 60;

      // Only consider sending a random message if it's been at least 60 minutes since last interaction
      if (diffInMinutes > 60) {
          // 5% chance to send every minute check (makes it unpredictable but eventually happens)
          if (Math.random() < 0.05) {
             const randomMsgs = [
                 "وحشتني.. بتعمل ايه؟ 🙄",
                 "مختفي فين؟",
                 "بفكر فيك.. ❤️",
                 "ابعتلي صورة ليك دلوقتي حالا",
                 "مش يلا نتكلم شوية؟ ☕",
                 "يومي من غيرك مش حلو..",
                 "sent a photo 📷", 
                 "Voice message (0:12) 🎤",
                 "هو احنا مش هنتكلم النهاردة؟",
                 "عايزة احكيلك حاجة حصلت.."
             ];
             const msg = randomMsgs[Math.floor(Math.random() * randomMsgs.length)];
             
             // Ensure we don't spam: check if we sent a random one recently (e.g. last 3 hours)
             const lastRandomSent = localStorage.getItem('last_random_msg_time');
             const timeSinceLastRandom = lastRandomSent ? (now - parseInt(lastRandomSent)) : 99999999;
             
             if (timeSinceLastRandom > (3 * 60 * 60 * 1000)) { 
                triggerAutonomousMessage(msg);
                localStorage.setItem('last_random_msg_time', now.toString());
             }
          }
      }
  };

  const checkAndSendStudyTips = () => {
      const now = Date.now();
      const lastMsgTime = lastInteractionTime.current;
      const diffInMinutes = (now - lastMsgTime) / 1000 / 60;

      // Study tips logic:
      // Send if user has been inactive for a bit (e.g., > 90 mins) to prompt study
      if (diffInMinutes > 90) {
          // 10% chance per check
          if (Math.random() < 0.1) {
              const lastStudySent = localStorage.getItem('last_study_msg_time');
              const timeSinceLastStudy = lastStudySent ? (now - parseInt(lastStudySent)) : 99999999;

              // Max 1 study tip every 4 hours
              if (timeSinceLastStudy > (4 * 60 * 60 * 1000)) {
                  const tip = SYSTEM_DESIGN_TIPS[Math.floor(Math.random() * SYSTEM_DESIGN_TIPS.length)];
                  triggerStudyMessage(tip);
                  localStorage.setItem('last_study_msg_time', now.toString());
              }
          }
      }
  };

  // Trigger for Normal Messages
  const triggerAutonomousMessage = (text: string) => {
    setSessions(currentSessions => {
        const targetId = currentSessionId || (currentSessions.length > 0 ? currentSessions[0].id : null);
        if (!targetId) return currentSessions;

        const updatedSessions = currentSessions.map(session => {
            if (session.id === targetId) {
                return {
                    ...session,
                    lastModified: Date.now(),
                    messages: [...session.messages, {
                        id: Date.now().toString(),
                        role: 'model' as const,
                        text: text,
                        timestamp: Date.now()
                    }]
                } as ChatSession;
            }
            return session;
        });

        localStorage.setItem('mn3em_sessions', JSON.stringify(updatedSessions));
        
        // DEEP LINKING & AUTO-OPEN LOGIC
        localStorage.setItem('mn3em_current_session_id', targetId);
        localStorage.setItem('mn3em_saved_tab', Tab.ACTIVE_CHAT);
        
        // If the app is open/foreground, switch immediately
        setActiveTab(Tab.ACTIVE_CHAT);

        return updatedSessions;
    });

    sendSystemNotification("Donia", text);
    lastInteractionTime.current = Date.now();
  };

  // Trigger for Study Messages (Targeting "System Design" Chat)
  const triggerStudyMessage = (text: string) => {
    setSessions(currentSessions => {
        // Find or Create System Design Session
        let designSession = currentSessions.find(s => s.title === "System Design 🎓");
        let newSessionsList = [...currentSessions];

        if (!designSession) {
            designSession = {
                id: 'sys_design_' + Date.now(),
                title: 'System Design 🎓',
                messages: [{
                    id: Date.now().toString(),
                    role: 'model' as const,
                    text: "أهلاً يا عبده! هنا هنذاكر سوا System Analysis & Design. 📚",
                    timestamp: Date.now()
                }],
                lastModified: Date.now()
            };
            newSessionsList = [designSession, ...currentSessions];
        }

        // Add message to that session
        const updatedSessions = newSessionsList.map(session => {
            if (session.id === designSession!.id) {
                return {
                    ...session,
                    lastModified: Date.now(),
                    messages: [...session.messages, {
                        id: Date.now().toString(),
                        role: 'model' as const,
                        text: text,
                        timestamp: Date.now()
                    }]
                };
            }
            return session;
        });

        localStorage.setItem('mn3em_sessions', JSON.stringify(updatedSessions));
        
        // DEEP LINKING & AUTO-OPEN LOGIC
        localStorage.setItem('mn3em_current_session_id', designSession.id);
        localStorage.setItem('mn3em_saved_tab', Tab.ACTIVE_CHAT);
        
        // If the app is open/foreground, switch immediately
        setCurrentSessionId(designSession.id);
        setActiveTab(Tab.ACTIVE_CHAT);
        
        return updatedSessions;
    });

    sendSystemNotification("Donia (Study Buddy) 🎓", text);
    lastInteractionTime.current = Date.now();
  };

  const sendSystemNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
        try {
            // Instagram-like notification parameters
            const options: any = { 
                body: body,
                icon: botAvatar, 
                badge: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png', 
                vibrate: [200, 100, 200], 
                tag: 'donia-dm', 
                renotify: true, 
                requireInteraction: true, // Keep notification until user interacts
                data: { url: '/' },
                actions: [
                    { action: 'open', title: 'Reply' }
                ]
            };

            // Use ServiceWorkerRegistration if available (Standard for PWA)
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                });
            } else {
                new Notification(title, options);
            }
        } catch (e) {
            console.error("Notification failed", e);
        }
    }
  };

  // -- EVENT HANDLING --
  const updateInteraction = () => {
    lastInteractionTime.current = Date.now();
  };

  // -- BACK BUTTON HANDLING --
  useEffect(() => {
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event: PopStateEvent) => {
      const currentTab = activeTabRef.current;
      
      if (currentTab !== Tab.CHAT) {
        setActiveTab(Tab.CHAT);
        localStorage.setItem('mn3em_saved_tab', Tab.CHAT); // Reset tab state on back
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
              permissionStatus={permissionStatus}
              onRequestPermission={requestNotificationAccess}
              onTestNotification={sendTestNotification}
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