import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessage, generateSpeech } from '../services/geminiService';
import { playRawAudio } from '../services/audioUtils';
import { transcribeAudio } from '../services/deepgramService';
import { Mic, Send, Loader2, StopCircle, Waves, Radio } from 'lucide-react';

interface VoiceTabProps {
  messages: Message[];
  onAddMessage: (role: 'user' | 'model', text: string) => void;
  onNoteDetected: (content: string) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({ messages, onAddMessage, onNoteDetected }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start Recording (Deepgram)
  const startRecording = async () => {
    try {
      // Create/Resume AudioContext on user interaction to ensure playback is allowed later
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Microphone error:", error);
      alert("المايكروفون غير متاح (Microphone access denied)");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Handle Transcribed Text
  const handleTranscription = async (blob: Blob) => {
    setIsLoading(true);
    try {
      const transcript = await transcribeAudio(blob);
      if (transcript && transcript.trim().length > 0) {
        setText(transcript);
        // Auto-send after transcription
        await processTextAndSpeak(transcript);
      } else {
         setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  // Logic to process text -> Gemini -> Speech
  const processTextAndSpeak = async (inputText: string) => {
    if (!inputText.trim()) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    // 1. Add User interaction to persistent chat history immediately
    onAddMessage('user', inputText);

    try {
      // 2. Prepare history for context
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      // 3. Send to "Brain" (Chat Model)
      const aiResponseText = (await sendMessage(inputText, history)) || ""; 
      
      // Update text input to show what bot replied
      setText(aiResponseText);

      // 4. Save Bot Response to persistent chat
      onAddMessage('model', aiResponseText);

      // 5. Check for Note Command
      let finalTextToSpeak = aiResponseText;
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = aiResponseText.match(noteRegex);
      
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        finalTextToSpeak = aiResponseText.replace(noteRegex, '').trim();
      }

      // 6. Convert to speech
      if (finalTextToSpeak) {
        const base64Audio = await generateSpeech(finalTextToSpeak);
        if (base64Audio) {
          setIsSpeaking(true);
          await playRawAudio(base64Audio);
          // Estimate duration: ~80ms per char (rough estimate for Arabic)
          setTimeout(() => setIsSpeaking(false), Math.min(finalTextToSpeak.length * 80, 15000)); 
        } else {
            // Audio generation failed
             setIsSpeaking(false);
        }
      }
    } catch (error) {
      console.error(error);
      onAddMessage('model', "مش سامعة.. الشبكة بتقطع 🤦‍♀️");
      alert("حدث خطأ في الاتصال");
    } finally {
      setIsLoading(false);
    }
  };

  // Manual Text Send
  const handleManualSend = () => {
    processTextAndSpeak(text);
  };

  return (
    <div className="flex flex-col h-full items-center justify-between p-6 bg-background relative overflow-hidden">
      
      {/* Visualizer Area / Status */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative">
        <div className={`transition-all duration-500 flex flex-col items-center gap-6 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
          
          {/* Main Status Circle */}
          <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
            isSpeaking 
              ? 'bg-accent-500/10 border-accent-500 shadow-[0_0_60px_rgba(217,70,239,0.4)] animate-pulse' 
              : isRecording 
                ? 'bg-red-500/10 border-red-500 shadow-[0_0_60px_rgba(239,68,68,0.4)]'
                : 'bg-[#1e293b] border-white/10'
          }`}>
             {isLoading ? (
               <Loader2 size={64} className="text-accent-500 animate-spin" />
             ) : isSpeaking ? (
               <Waves size={64} className="text-accent-500 animate-pulse" />
             ) : isRecording ? (
               <Radio size={64} className="text-red-500 animate-pulse" />
             ) : (
               <Mic size={64} className="text-slate-600" />
             )}
          </div>
          
          <div className="text-center space-y-2 h-12">
            <h2 className="text-2xl font-bold text-white tracking-wide">
              {isRecording ? "Listening..." : isSpeaking ? "Donia Speaking" : isLoading ? "Thinking..." : "Tap & Hold"}
            </h2>
            {isSpeaking && text && (
              <p className="text-xs text-slate-400 line-clamp-2 max-w-[250px] mx-auto animate-fade-in" dir="auto">
                {text}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="w-full flex flex-col items-center gap-6 pb-6 z-10">
        
        {/* Main Recording Button */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isLoading || isSpeaking}
          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-2xl ${
            isRecording
              ? 'bg-red-500 text-white scale-105 shadow-red-500/50 ring-4 ring-red-500/30'
              : 'bg-gradient-to-br from-accent-500 to-accent-600 text-white hover:brightness-110 shadow-accent-500/40'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <StopCircle size={40} className="fill-current" />
          ) : (
            <Mic size={40} />
          )}
        </button>

        {/* Text Fallback Input */}
        <div className="w-full max-w-md bg-[#1e293b] rounded-full px-4 py-2 flex items-center gap-3 border border-white/5 shadow-md">
           <input 
             type="text"
             value={text}
             onChange={(e) => setText(e.target.value)}
             onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleManualSend(); } }}
             placeholder="Type to talk..."
             className="flex-1 bg-transparent border-none outline-none text-white text-sm text-right font-medium"
             dir="auto"
           />
           <button 
             onClick={handleManualSend} 
             disabled={!text.trim() || isLoading}
             className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center hover:bg-slate-600 transition-colors"
           >
             <Send size={14} />
           </button>
        </div>

      </div>
    </div>
  );
};