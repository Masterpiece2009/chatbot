import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessage } from '../services/geminiService';
import { Send, Loader2, Cpu } from 'lucide-react';

interface ChatTabProps {
  onNoteDetected: (content: string) => void;
  userAvatar: string;
  botAvatar: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({ onNoteDetected, userAvatar, botAvatar }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: 'Mn3em OS Online. Ahlan ya Habibi. Ready for anything.', timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      let responseText = await sendMessage(userMsg.text, history);
      
      // Detect Note
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = responseText?.match(noteRegex);
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
        text: "System failure. Connection lost.",
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
      <div className="px-6 py-4 border-b border-cyan-500/30 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center shadow-[0_5px_20px_rgba(0,0,0,0.5)]">
        <h1 className="text-2xl font-bold text-cyan-400 tracking-widest font-mono flex items-center gap-3">
          <Cpu className="animate-pulse text-cyan-300" size={24}/> 
          <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">منعم</span>
        </h1>
        <div className="flex flex-col items-end">
           <div className="text-[10px] text-cyan-600 font-mono tracking-[0.2em]">SYSTEM ACTIVE</div>
           <div className="text-[8px] text-cyan-800 font-mono">V 3.1.0</div>
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
                ? 'border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]' 
                : 'border border-white/50 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
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
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-50 rounded-br-none' 
                : 'bg-slate-900/80 border-slate-700 text-gray-200 rounded-bl-none font-mono'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-end gap-3">
             <div className="w-10 h-10 rounded-full border-2 border-white/50 overflow-hidden opacity-70">
                <img src={botAvatar} alt="Bot" className="w-full h-full object-cover grayscale" />
             </div>
            <div className="bg-slate-900/80 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
              <span className="text-xs text-cyan-500 font-mono">THINKING</span>
              <Loader2 size={14} className="animate-spin text-cyan-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#020617]/90 border-t border-cyan-500/30 backdrop-blur-md sticky bottom-0 z-20">
        <div className="flex items-center gap-2 bg-slate-900/50 rounded-xl border border-cyan-500/30 px-4 py-3 focus-within:border-cyan-400 focus-within:shadow-[0_0_15px_rgba(34,211,238,0.15)] transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-cyan-100 placeholder-cyan-800 text-sm font-mono"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-2 rounded-lg transition-all ${
              input.trim() && !isLoading 
                ? 'text-cyan-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_10px_cyan]' 
                : 'text-slate-600 bg-slate-800/50'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};