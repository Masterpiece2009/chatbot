import React, { useState, useRef } from 'react';
import { sendMessage, generateSpeech } from '../services/geminiService';
import { playRawAudio } from '../services/audioUtils';
import { transcribeAudio } from '../services/deepgramService';
import { Mic, Activity, Loader2, StopCircle } from 'lucide-react';

interface VoiceTabProps {
  onNoteDetected: (content: string) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({ onNoteDetected }) => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start Recording (Deepgram)
  const startRecording = async () => {
    try {
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
         // If no voice detected, just stop loading
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
    try {
      // 1. Send to "Brain" (Chat Model)
      const aiResponseText = (await sendMessage(inputText, [])) || ""; 

      // 2. Check for Note Command
      let finalTextToSpeak = aiResponseText;
      const noteRegex = /\|\|SAVE_NOTE:(.*?)\|\|/;
      const match = aiResponseText.match(noteRegex);
      
      if (match && match[1]) {
        onNoteDetected(match[1].trim());
        finalTextToSpeak = aiResponseText.replace(noteRegex, '').trim();
      }

      // 3. Convert to speech
      if (finalTextToSpeak) {
        const base64Audio = await generateSpeech(finalTextToSpeak);
        if (base64Audio) {
          setIsSpeaking(true);
          await playRawAudio(base64Audio);
          setTimeout(() => setIsSpeaking(false), Math.min(finalTextToSpeak.length * 80, 10000)); 
        }
      }
    } catch (error) {
      console.error(error);
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
    <div className="flex flex-col h-full items-center justify-center relative overflow-hidden bg-background">
      
      {/* Background Arc Lines */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-primary-500 rounded-full animate-pulse-slow"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border border-accent-500/30 rounded-full"></div>
      </div>

      <div className="z-10 w-full px-8 flex flex-col items-center">
        <h2 className="text-primary-500 font-mono tracking-[0.2em] mb-8 text-sm uppercase">واجهة صوتية</h2>

        {/* Arc Reactor / Mic Button */}
        <div className="relative group select-none">
          <div className={`absolute inset-0 bg-primary-500 rounded-full blur-xl opacity-20 transition-all duration-500 ${isSpeaking || isLoading || isRecording ? 'scale-150 opacity-40' : ''}`}></div>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isLoading || isSpeaking}
            className={`relative w-40 h-40 rounded-full flex items-center justify-center border-4 transition-all duration-200 active:scale-95 ${
              isRecording
                ? 'border-red-500 bg-red-950/80 shadow-[0_0_50px_rgba(239,68,68,0.8)]'
                : isLoading 
                    ? 'border-accent-500 bg-black shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                    : 'border-primary-500 bg-black/80 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)]'
            }`}
          >
            {/* Reactor Inner Detail */}
            <div className={`absolute inset-2 rounded-full border transition-all ${isRecording ? 'border-red-400' : 'border-primary-500/30'}`}></div>
            <div className="absolute inset-8 rounded-full border border-accent-500/50"></div>
            
            {isLoading ? (
               <Loader2 size={40} className="text-accent-500 animate-spin" />
            ) : isRecording ? (
               <Mic size={50} className="text-red-500 animate-pulse fill-current" />
            ) : isSpeaking ? (
               <Activity size={40} className="text-accent-400 animate-pulse" />
            ) : (
               <Mic size={40} className="text-primary-400 fill-current" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <p className={`mt-6 text-sm font-mono uppercase tracking-widest ${isRecording ? 'text-red-500 animate-pulse' : 'text-primary-700'}`}>
             {isRecording ? "جاري الاستماع..." : isLoading ? "جاري التحليل..." : "اضغط وتحدث (HOLD TO SPEAK)"}
        </p>

        {/* Text Input styled as terminal input */}
        <div className="w-full mt-8 relative">
            <div className="absolute inset-0 bg-primary-900/10 skew-x-12 transform"></div>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleManualSend(); } }}
                placeholder="... أو اكتب هنا"
                className="w-full bg-black/40 border-l-2 border-r-2 border-primary-500/50 p-4 text-center text-white placeholder-primary-800 outline-none font-mono h-20 resize-none backdrop-blur-sm relative z-10"
                dir="auto"
            />
        </div>
      </div>
    </div>
  );
};