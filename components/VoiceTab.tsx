import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { playRawAudio } from '../services/audioUtils';
import { Mic, Activity, Loader2 } from 'lucide-react';

interface VoiceTabProps {
  onNoteDetected: (content: string) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({ onNoteDetected }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Logic check for local note (simple version, fallback to AI logic handled in speech gen)
      if (text.toLowerCase().startsWith('note this')) {
         onNoteDetected(text.replace(/note this/i, '').trim());
      }

      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        setIsSpeaking(true);
        await playRawAudio(base64Audio);
        setTimeout(() => setIsSpeaking(false), 5000); // Approximate duration
      }
      setText('');
    } catch (error) {
      alert("Voice module offline.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center relative overflow-hidden">
      
      {/* Background Arc Lines */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-cyan-500 rounded-full animate-pulse-slow"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-cyan-500/50 rounded-full"></div>
      </div>

      <div className="z-10 w-full px-8 flex flex-col items-center">
        <h2 className="text-cyan-400 font-mono tracking-[0.2em] mb-8 text-sm">VOICE INTERFACE</h2>

        {/* Arc Reactor / Mic Button */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-cyan-500 rounded-full blur-xl opacity-20 transition-all duration-500 ${isSpeaking || isLoading ? 'scale-150 opacity-40' : ''}`}></div>
          <button
            onClick={handleSpeak}
            disabled={!text.trim() || isLoading}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
              isLoading 
                ? 'border-orange-500 bg-black shadow-[0_0_30px_rgba(249,115,22,0.4)]'
                : 'border-cyan-500 bg-black/80 shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)]'
            }`}
          >
            {/* Reactor Inner Detail */}
            <div className="absolute inset-2 rounded-full border border-cyan-500/30"></div>
            <div className="absolute inset-8 rounded-full border border-cyan-500/50"></div>
            
            {isLoading ? (
               <Loader2 size={40} className="text-orange-500 animate-spin" />
            ) : isSpeaking ? (
               <Activity size={40} className="text-cyan-400 animate-pulse" />
            ) : (
               <Mic size={40} className="text-cyan-400 fill-current" />
            )}
          </button>
        </div>

        {/* Text Input styled as terminal input */}
        <div className="w-full mt-12 relative">
            <div className="absolute inset-0 bg-cyan-500/5 skew-x-12 transform"></div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Initialize voice command..."
                className="w-full bg-black/40 border-l-2 border-r-2 border-cyan-500/50 p-4 text-center text-cyan-100 placeholder-cyan-800 outline-none font-mono h-24 resize-none backdrop-blur-sm relative z-10"
            />
        </div>
        
        <p className="mt-4 text-[10px] text-cyan-700 font-mono uppercase">
             {isLoading ? "Processing Neural Net..." : "System Ready"}
        </p>
      </div>
    </div>
  );
};