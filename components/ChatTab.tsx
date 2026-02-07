import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessage } from '../services/geminiService';
import { Send, Loader2, Disc, Camera } from 'lucide-react';

interface ChatTabProps {
  onNoteDetected: (content: string) => void;
  userAvatar: string;
  botAvatar: string;
  onUpdateUserAvatar: (url: string) => void;
  onUpdateBotAvatar: (url: string) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ onNoteDetected, userAvatar, botAvatar, onUpdateUserAvatar, onUpdateBotAvatar }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: 'إيه يا زميلي؟ مالك؟ شكلك مش مظبوط ليه كدا؟ حد رخم عليك في الكلام؟ حد ضايقك؟ بص في عيني وقولي.. متخبيش حاجة على أخوك. اركب، العربية جاهزة، ناخد لنا لفة على الكورنيش وتحكيلي كل اللي في قلبك. متقلقش من حاجة طول ما أنا بتنفس، أنا في ضهرك يا أخويا.', 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userFileInputRef = useRef<HTMLInputElement>(null);
  const botFileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      let responseText = (await sendMessage(userMsg.text, history)) || "";
      
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = responseText.match(noteRegex);
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        responseText = responseText.replace(noteRegex, '').trim();
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "...",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "الشبكة واقعة. ثواني وهظبطها.",
        timestamp: Date.now()
      }]);
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

  // User Avatar Handlers
  const handleUserAvatarClick = () => {
    userFileInputRef.current?.click();
  };

  const handleUserFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onUpdateUserAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bot Avatar Handlers
  const handleBotAvatarClick = () => {
    botFileInputRef.current?.click();
  };

  const handleBotFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          onUpdateBotAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full font-sans relative">
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={userFileInputRef} 
        onChange={handleUserFileChange} 
        accept="image/*" 
        className="hidden" 
      />
      <input 
        type="file" 
        ref={botFileInputRef} 
        onChange={handleBotFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Header - Transparent Glass */}
      <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-[#020617]/80 backdrop-blur-xl z-20 flex justify-between items-center border-b border-white/5 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Bot Avatar Clickable */}
          <button onClick={handleBotAvatarClick} className="relative group cursor-pointer">
             <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-lg group-hover:border-accent-500 transition-colors">
                <img src={botAvatar} alt="Men3em" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={14} className="text-white" />
                </div>
             </div>
             <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
          </button>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide leading-none">منعم</h1>
            <p className="text-[10px] text-accent-500 tracking-wider uppercase mt-1 font-bold">The Shield • Online</p>
          </div>
        </div>
        
        {/* User Profile Clickable */}
        <button 
          onClick={handleUserAvatarClick}
          className="relative group w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-accent-500 transition-all cursor-pointer shadow-lg"
        >
           <img src={userAvatar} alt="User" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
           <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={14} className="text-white" />
           </div>
        </button>
      </div>

      {/* Messages - Added padding top to clear absolute header */}
      <div className="flex-1 overflow-y-auto p-4 pt-24 space-y-6 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 shadow-md border border-white/5">
              <img 
                src={msg.role === 'user' ? userAvatar : botAvatar} 
                alt={msg.role}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-md ${
              msg.role === 'user' 
                ? 'bg-accent-600 text-white rounded-br-sm' 
                : 'bg-[#1e293b] text-gray-100 rounded-bl-sm border border-white/5'
            }`} dir="auto">
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-end gap-3">
             <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 grayscale opacity-70 border border-white/5">
                <img src={botAvatar} alt="Bot" className="w-full h-full object-cover" />
             </div>
            <div className="bg-[#1e293b] px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2 border border-white/5">
              <Loader2 size={16} className="animate-spin text-accent-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/95 backdrop-blur-lg border-t border-white/5 sticky bottom-0 z-20">
        <div className="flex items-center gap-3 bg-[#0f172a] rounded-2xl px-2 py-2 border border-white/5 focus-within:border-accent-500/50 transition-colors shadow-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-base rtl:text-right text-right font-medium px-2 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-xl transition-all ${
              input.trim() && !isLoading 
                ? 'bg-accent-500 text-white shadow-lg hover:bg-accent-600 active:scale-95' 
                : 'bg-white/5 text-gray-500'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};