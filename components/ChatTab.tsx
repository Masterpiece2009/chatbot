import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessage } from '../services/geminiService';
import { transcribeAudio } from '../services/deepgramService';
import { Send, Mic, MoreVertical, Phone, Video, Image as ImageIcon, Smile, Paperclip, Check, CheckCheck, Trash2 } from 'lucide-react';

interface ChatTabProps {
  messages: Message[];
  onAddMessage: (role: 'user' | 'model', text: string) => void;
  onNoteDetected: (content: string) => void;
  onClearChat: () => void;
  userAvatar: string;
  botAvatar: string;
}

export const ChatTab: React.FC<ChatTabProps> = ({ 
  messages, 
  onAddMessage,
  onNoteDetected,
  onClearChat,
  userAvatar, 
  botAvatar, 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      onAddMessage('model', "الشبكة زفت.. مش سامعة 😤");
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

  // --- RECORDING LOGIC (Chat Mic) ---
  const toggleRecording = async () => {
    if (isRecording) {
      // STOP RECORDING
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setIsLoading(true);
          try {
            const transcript = await transcribeAudio(audioBlob);
            if (transcript.trim()) {
              handleSend(transcript);
            }
          } catch (e) {
            console.error(e);
          } finally {
            setIsLoading(false);
          }
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (error) {
        alert("Microphone access denied");
      }
    }
  };

  // --- FORMATTING ---
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full relative bg-[#0b141a]">
      {/* BACKGROUND PATTERN */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-0" 
           style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
      </div>

      {/* WHATSAPP HEADER */}
      <div className="bg-[#202c33] px-2 py-2 flex items-center justify-between z-20 shadow-sm border-b border-[#202c33]">
        <div className="flex items-center gap-3">
           {/* Back Arrow (Simulated) */}
           {/* <ArrowLeft className="text-gray-300" size={24} /> */}
           
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
          <Video size={22} className="cursor-pointer hover:text-white" />
          <Phone size={20} className="cursor-pointer hover:text-white" />
          <div className="relative">
            <MoreVertical size={20} className="cursor-pointer hover:text-white" onClick={() => setShowMenu(!showMenu)} />
            {showMenu && (
              <div className="absolute right-0 top-8 bg-[#233138] w-40 rounded-lg shadow-xl py-2 z-50 border border-gray-800">
                <button 
                  onClick={() => { onClearChat(); setShowMenu(false); }}
                  className="w-full text-left px-4 py-3 text-red-400 hover:bg-[#182229] flex items-center gap-2 text-sm"
                >
                  <Trash2 size={16} /> Clear Chat
                </button>
              </div>
            )}
          </div>
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

      {/* WHATSAPP INPUT AREA */}
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
          onClick={() => input.trim() ? handleSend() : toggleRecording()}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${
             isRecording 
               ? 'bg-red-500 text-white animate-pulse' 
               : 'bg-[#00a884] text-white hover:bg-[#008f6f]'
          }`}
        >
          {input.trim() ? <Send size={20} className="ml-0.5" /> : <Mic size={20} />}
        </button>
      </div>
    </div>
  );
};