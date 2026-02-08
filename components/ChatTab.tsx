import React, { useState, useRef, useEffect } from 'react';
import { Message, ChatSession } from '../types';
import { sendMessage } from '../services/geminiService';
import { Send, Menu, Phone, Video, Image as ImageIcon, Smile, Paperclip, CheckCheck, Plus, X, MessageSquare, Trash2 } from 'lucide-react';

interface ChatTabProps {
  messages: Message[];
  sessions: ChatSession[];
  currentSessionId: string;
  onAddMessage: (role: 'user' | 'model', text: string) => void;
  onNoteDetected: (content: string) => void;
  onNewChat: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  userAvatar: string;
  botAvatar: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({ 
  messages, 
  sessions,
  currentSessionId,
  onAddMessage,
  onNoteDetected,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  userAvatar, 
  botAvatar, 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- MESSAGING LOGIC ---
  const handleSend = async (textToSend: string = input) => {
    if (!textToSend.trim() || isLoading) return;

    onAddMessage('user', textToSend);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      let responseText = (await sendMessage(textToSend, history)) || "";
      
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = responseText.match(noteRegex);
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        responseText = responseText.replace(noteRegex, '').trim();
      }

      onAddMessage('model', responseText || "...");
    } catch (error) {
      onAddMessage('model', "النت وحش أوي.. 😑");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- FORMATTING ---
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full relative bg-[#0b141a] overflow-hidden">
      
      {/* --- SIDEBAR (HISTORY) --- */}
      <div className={`absolute inset-y-0 left-0 w-64 bg-[#111b21] z-50 transform transition-transform duration-300 ease-in-out border-r border-[#202c33] ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 bg-[#202c33] h-[60px] flex items-center justify-between shadow-sm">
           <h2 className="font-bold text-gray-200">Chats</h2>
           <button onClick={() => setShowSidebar(false)}><X className="text-gray-400" size={24} /></button>
        </div>
        
        <div className="p-3">
          <button 
            onClick={() => { onNewChat(); setShowSidebar(false); }}
            className="w-full bg-[#00a884] text-white rounded-lg py-2 flex items-center justify-center gap-2 font-medium shadow-md active:scale-95 transition-transform"
          >
            <Plus size={20} /> New Chat
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-120px)]">
           {sessions.map(session => (
             <div 
                key={session.id}
                onClick={() => { onSwitchSession(session.id); setShowSidebar(false); }}
                className={`flex items-center justify-between p-3 border-b border-[#202c33] cursor-pointer hover:bg-[#202c33] ${currentSessionId === session.id ? 'bg-[#2a3942]' : ''}`}
             >
                <div className="flex flex-col flex-1 min-w-0 mr-2">
                   <h3 className="text-gray-200 text-sm font-medium truncate" dir="auto">
                     {session.title || 'New Chat'}
                   </h3>
                   <span className="text-gray-500 text-xs">
                     {formatDate(session.lastModified)}
                   </span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  className="text-gray-500 hover:text-red-400 p-1"
                >
                  <Trash2 size={16} />
                </button>
             </div>
           ))}
        </div>
      </div>

      {/* OVERLAY FOR SIDEBAR */}
      {showSidebar && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowSidebar(false)} />
      )}


      {/* --- MAIN CHAT UI --- */}
      
      {/* BACKGROUND PATTERN */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" 
           style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
      </div>

      {/* WHATSAPP HEADER */}
      <div className="bg-[#202c33] px-2 py-2 flex items-center justify-between z-20 shadow-sm border-b border-[#202c33]">
        <div className="flex items-center gap-3">
           <button onClick={() => setShowSidebar(true)} className="p-1">
              <Menu className="text-gray-300" size={24} />
           </button>
           
           <div className="relative">
             <img src={botAvatar} alt="Donia" className="w-10 h-10 rounded-full object-cover" />
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#202c33]"></div>
           </div>
           
           <div className="flex flex-col">
             <h1 className="text-gray-100 font-semibold text-base leading-tight">Donia ❤️</h1>
             <span className="text-xs text-gray-400">
                {isLoading ? 'typing...' : 'online'}
             </span>
           </div>
        </div>

        <div className="flex items-center gap-4 text-[#8696a0]">
          <Video size={22} className="opacity-50 cursor-not-allowed" />
          <Phone size={20} className="opacity-50 cursor-not-allowed" />
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 z-10 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`relative max-w-[80%] px-3 py-1.5 rounded-lg shadow-sm text-[15px] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none' 
                  : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
              }`}
              dir="auto"
            >
              <span className="break-words whitespace-pre-wrap">{msg.text}</span>
              
              <div className={`flex items-center justify-end gap-1 mt-1 ${msg.role === 'user' ? 'text-[#8696a0]' : 'text-[#8696a0]'}`}>
                <span className="text-[11px] min-w-[45px] text-right">
                  {formatTime(msg.timestamp)}
                </span>
                {msg.role === 'user' && (
                   <CheckCheck size={14} className="text-[#53bdeb]" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* WHATSAPP INPUT AREA (NO VOICE) */}
      <div className="bg-[#202c33] px-2 py-2 flex items-end gap-2 z-20">
        <div className="flex-1 bg-[#2a3942] rounded-2xl flex items-center px-3 py-2 gap-2">
          <Smile className="text-[#8696a0] cursor-pointer" size={24} />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Message"
            className="flex-1 bg-transparent border-none outline-none text-[#d1d7db] placeholder-[#8696a0] text-base h-8"
            dir="auto"
          />
          <Paperclip className="text-[#8696a0] cursor-pointer -rotate-45" size={20} />
          {!input.trim() && <ImageIcon className="text-[#8696a0] cursor-pointer" size={20} />}
        </div>

        <button 
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
             input.trim()
               ? 'bg-[#00a884] text-white hover:bg-[#008f6f]' 
               : 'bg-[#202c33] text-[#8696a0] border border-[#2a3942]'
          }`}
        >
          <Send size={20} className={input.trim() ? "ml-0.5" : ""} />
        </button>
      </div>
    </div>
  );
};