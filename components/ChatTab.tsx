import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessage } from '../services/geminiService';
import { Send, Loader2, Cpu, Download } from 'lucide-react';

interface ChatTabProps {
  onNoteDetected: (content: string) => void;
  userAvatar: string;
  botAvatar: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({ onNoteDetected, userAvatar, botAvatar }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'model', 
      text: 'الشارع هادي ولا فيه قلق؟ أنا صاحي ومتابعك. طمني.', 
      timestamp: Date.now() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPrompt) {
      installPrompt.prompt();
      setInstallPrompt(null);
    }
  };

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

      // Fallback to empty string if undefined to satisfy TS strict null checks
      let responseText = (await sendMessage(userMsg.text, history)) || "";
      
      // Detect Note
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = responseText.match(noteRegex);
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        // Remove the technical note command from the visible chat
        responseText = responseText.replace(noteRegex, '').trim();
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Processing error.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "معلش الشبكة فيها مشكلة. ثواني وهظبطها.",
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

  return (
    <div className="flex flex-col h-full">
      {/* HUD Header */}
      <div className="px-6 py-4 border-b border-primary-500/30 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <Cpu className="animate-pulse text-primary-500" size={24}/> 
          <h1 className="text-xl font-bold text-primary-400 tracking-widest font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
            منعم
          </h1>
        </div>
        
        {/* User Profile in Header */}
        <div className="flex items-center gap-3">
           {installPrompt && (
              <button 
                onClick={handleInstallClick}
                className="p-2 bg-accent-500/20 text-accent-500 rounded-full animate-pulse mr-2"
                title="Install App"
              >
                <Download size={18} />
              </button>
           )}
           <div className="text-[10px] text-primary-500/70 font-mono tracking-widest text-right hidden sm:block">
              PROJECT<br/>SHIELD
           </div>
           <div className="w-8 h-8 rounded-full border border-accent-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] overflow-hidden">
             <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
           </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
              msg.role === 'user' 
                ? 'border-2 border-accent-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                : 'border border-primary-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
            }`}>
              <img 
                src={msg.role === 'user' ? userAvatar : botAvatar} 
                alt={msg.role}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed border backdrop-blur-md shadow-lg ${
              msg.role === 'user' 
                ? 'bg-accent-500/10 border-accent-500/30 text-accent-50 rounded-br-none text-right' 
                : 'bg-primary-950/40 border-primary-900 text-gray-200 rounded-bl-none font-mono text-right'
            }`} dir="auto">
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-end gap-3">
             <div className="w-10 h-10 rounded-full border border-primary-500/30 overflow-hidden opacity-70">
                <img src={botAvatar} alt="Bot" className="w-full h-full object-cover grayscale" />
             </div>
            <div className="bg-primary-950/40 border border-primary-900 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
              <span className="text-xs text-primary-500 font-mono">يفكر...</span>
              <Loader2 size={14} className="animate-spin text-primary-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#020617]/90 border-t border-primary-500/30 backdrop-blur-md sticky bottom-0 z-20">
        <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl border border-primary-500/30 px-4 py-3 focus-within:border-accent-500 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="اكتب رسالتك..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-primary-900 text-sm font-mono rtl:text-right text-right"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading 
                ? 'text-black bg-accent-500 hover:bg-accent-400 shadow-[0_0_10px_#f59e0b]' 
                : 'text-primary-900 bg-primary-950/50'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};