import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../types';
import { sendMessage } from '../services/geminiService';
import { Send, Image as ImageIcon, ArrowLeft, Phone, Video, Info } from 'lucide-react';

interface ChatTabProps {
  currentSessionId: string;
  sessions: ChatSession[];
  onAddMessage: (role: 'user' | 'model', text: string) => void;
  onNoteDetected: (content: string) => void;
  onBack: () => void; // Go back to DM list
  userAvatar: string;
  botAvatar: string;
  globalMemory: string; // Context passed to API
  chatBackground: string | null;
}

export const ChatTab: React.FC<ChatTabProps> = ({ 
  currentSessionId,
  sessions,
  onAddMessage,
  onNoteDetected,
  onBack,
  userAvatar, 
  botAvatar,
  globalMemory,
  chatBackground
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get current session data
  const session = sessions.find(s => s.id === currentSessionId);
  const messages = session ? session.messages : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- MESSAGING LOGIC ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const textToSend = input;
    onAddMessage('user', textToSend);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for this specific session
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // Send to API with Global Memory context
      let responseText = (await sendMessage(textToSend, history, globalMemory)) || "";
      
      // Check for notes in response
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = responseText.match(noteRegex);
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        responseText = responseText.replace(noteRegex, '').trim();
      }

      onAddMessage('model', responseText || "...");
    } catch (error) {
      onAddMessage('model', "النت بيقطع.. 😤");
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

  if (!session) return <div>Session not found</div>;

  return (
    <div className="flex flex-col h-full bg-black text-white relative overflow-hidden">
      
      {/* 1. FIXED BACKGROUND LAYER (Outside Scroll View) */}
      {chatBackground && (
        <div className="absolute inset-0 z-0">
           {chatBackground.startsWith('#') ? (
             <div style={{ backgroundColor: chatBackground }} className="w-full h-full" />
           ) : (
             <>
               <img 
                 src={chatBackground} 
                 className="w-full h-full object-cover" 
                 alt="Chat Background" 
               />
               {/* Dark Overlay for text readability */}
               <div className="absolute inset-0 bg-black/40"></div> 
             </>
           )}
        </div>
      )}

      {/* 2. HEADER (Z-INDEX 20) */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-[#262626] z-20 bg-black/80 backdrop-blur-sm relative">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-white">
             <ArrowLeft size={28} />
          </button>
          <div className="flex items-center gap-3">
             <img src={botAvatar} alt="Donia" className="w-8 h-8 rounded-full object-cover" />
             <div className="flex flex-col">
                <span className="font-semibold text-sm leading-none">Donia <span className="text-[10px] text-blue-500">Verified</span></span>
                <span className="text-[11px] text-gray-400">Active now</span>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-6 text-white">
           <Phone size={24} />
           <Video size={26} />
           <Info size={24} />
        </div>
      </div>

      {/* 3. SCROLLABLE MESSAGES AREA (Z-INDEX 10) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10 bg-transparent">
        <div className="text-center text-xs text-gray-400 my-4 shadow-black drop-shadow-md font-medium">
           {new Date(session.lastModified).toLocaleDateString()} · {new Date(session.lastModified).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {/* Bot Avatar for received messages */}
            {msg.role === 'model' && (
               <img src={botAvatar} className="w-7 h-7 rounded-full object-cover mr-2 self-end mb-1 border border-white/10 shadow-sm" alt="Bot" />
            )}

            <div 
              className={`max-w-[75%] px-4 py-3 text-[15px] leading-snug rounded-[22px] shadow-sm backdrop-blur-md ${
                msg.role === 'user' 
                  ? 'bg-[#3797f0] text-white rounded-br-md' // Instagram Blue
                  : 'bg-[#262626]/80 text-white rounded-bl-md border border-white/10' // Dark Grey with opacity
              }`}
              dir="auto"
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
           <div className="flex justify-start mb-4">
              <img src={botAvatar} className="w-7 h-7 rounded-full object-cover mr-2 self-end mb-1" alt="Bot" />
              <div className="bg-[#262626]/80 text-gray-400 px-4 py-3 rounded-[22px] rounded-bl-md text-sm border border-white/10 backdrop-blur-sm">
                 typing...
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. INPUT AREA (Z-INDEX 20) */}
      <div className="p-4 flex items-center gap-3 bg-black z-20 border-t border-[#262626] relative">
         <div className="w-9 h-9 bg-[#262626] rounded-full flex items-center justify-center text-[#3797f0]">
            <ImageIcon size={20} />
         </div>
         
         <div className="flex-1 bg-[#262626] rounded-[22px] h-11 flex items-center px-4">
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={handleKeyPress}
             placeholder="Message..."
             className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-[15px]"
             dir="auto"
           />
           {input.trim() && (
              <button onClick={handleSend} className="text-[#3797f0] font-semibold text-sm ml-2">
                 Send
              </button>
           )}
         </div>

         {!input.trim() && (
            <>
               <div className="text-white"><Send size={24} /></div> 
            </>
         )}
      </div>
    </div>
  );
};