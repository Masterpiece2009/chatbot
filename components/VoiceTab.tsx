import React, { useState } from 'react';
import { sendMessage, generateSpeech } from '../services/geminiService';
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
      // 1. Send to "Brain" (Chat Model) first to get intelligent response and check for notes
      const aiResponseText = await sendMessage(text, []); 

      // 2. Check for Note Command in the AI response
      let finalTextToSpeak = aiResponseText;
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = aiResponseText?.match(noteRegex);
      
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        // Remove the note command so the voice doesn't read the technical bits
        finalTextToSpeak = aiResponseText.replace(noteRegex, '').trim();
      }

      // 3. Convert the clean text to speech
      if (finalTextToSpeak) {
        const base64Audio = await generateSpeech(finalTextToSpeak);
        if (base64Audio) {
          setIsSpeaking(true);
          await playRawAudio(base64Audio);
          setTimeout(() => setIsSpeaking(false), Math.min(finalTextToSpeak.length * 80, 10000)); 
        }
      }
      
      setText('');
    } catch (error) {
      console.error(error);
      alert("أنظمة الصوت غير متاحة حالياً");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center relative overflow-hidden bg-background">
      
      {/* Background Arc Lines */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-primary-500 rounded-full animate-pulse-slow"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-accent-500/30 rounded-full"></div>
      </div>

      <div className="z-10 w-full px-8 flex flex-col items-center">
        <h2 className="text-primary-500 font-mono tracking-[0.2em] mb-8 text-sm uppercase">واجهة صوتية</h2>

        {/* Arc Reactor / Mic Button */}
        <div className="relative group">
          <div className={`absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-20 transition-all duration-500 ${isSpeaking || isLoading ? 'scale-150 opacity-40' : ''}`}></div>
          <button
            onClick={handleSpeak}
            disabled={!text.trim() || isLoading}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
              isLoading 
                ? 'border-accent-500 bg-black shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                : 'border-primary-500 bg-black/80 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)]'
            }`}
          >
            {/* Reactor Inner Detail */}
            <div className="absolute inset-2 rounded-full border border-primary-500/30"></div>
            <div className="absolute inset-8 rounded-full border border-accent-500/50"></div>
            
            {isLoading ? (
               <Loader2 size={40} className="text-accent-500 animate-spin" />
            ) : isSpeaking ? (
               <Activity size={40} className="text-accent-400 animate-pulse" />
            ) : (
               <Mic size={40} className="text-primary-400 fill-current" />
            )}
          </button>
        </div>

        {/* Text Input styled as terminal input */}
        <div className="w-full mt-12 relative">
            <div className="absolute inset-0 bg-primary-900/10 skew-x-12 transform"></div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="كلم منعم..."
                className="w-full bg-black/40 border-l-2 border-r-2 border-primary-500/50 p-4 text-center text-white placeholder-primary-800 outline-none font-mono h-24 resize-none backdrop-blur-sm relative z-10"
                dir="auto"
            />
        </div>
        
        <p className="mt-4 text-[10px] text-primary-700 font-mono uppercase">
             {isLoading ? "جاري التحليل..." : "أنا سامعك..."}
        </p>
      </div>
    </div>
  );
};