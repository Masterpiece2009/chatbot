import React, { useState, useRef } from 'react';
import { sendMessage, generateSpeech } from '../services/geminiService';
import { playRawAudio } from '../services/audioUtils';
import { transcribeAudio } from '../services/deepgramService';
import { Mic, Send, Loader2, StopCircle, Waves } from 'lucide-react';

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
    <div className="flex flex-col h-full items-center justify-between p-6 bg-background relative overflow-hidden">
      
      {/* Visualizer Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center relative">
        {/* Simple Status Indicator */}
        <div className={`transition-all duration-500 flex flex-col items-center gap-4 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
          <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
            isSpeaking 
              ? 'bg-accent-500/20 shadow-[0_0_50px_rgba(217,70,239,0.3)] animate-pulse' 
              : isRecording 
                ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.3)]'
                : 'bg-white/5'
          }`}>
             {isLoading ? (
               <Loader2 size={48} className="text-accent-500 animate-spin" />
             ) : isSpeaking ? (
               <Waves size={48} className="text-accent-500 animate-bounce" />
             ) : (
               <div className="w-4 h-4 rounded-full bg-slate-500"></div>
             )}
          </div>
          
          <p className="text-slate-400 font-medium text-sm animate-pulse">
            {isRecording ? "Listening..." : isSpeaking ? "Speaking..." : isLoading ? "Thinking..." : "Tap & Hold to speak"}
          </p>
        </div>
      </div>

      {/* Controls Area */}
      <div className="w-full flex flex-col items-center gap-6 pb-6">
        
        {/* Main Recording Button */}
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={isLoading || isSpeaking}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg ${
            isRecording
              ? 'bg-red-500 text-white scale-110 shadow-red-500/40'
              : 'bg-accent-500 text-white hover:bg-accent-600 shadow-accent-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isRecording ? (
            <div className="w-8 h-8 bg-white rounded-md"></div>
          ) : (
            <Mic size={32} />
          )}
        </button>

        {/* Text Fallback Input */}
        <div className="w-full max-w-md bg-[#1e293b] rounded-full px-4 py-2 flex items-center gap-3 border border-white/5 shadow-md">
           <input 
             type="text"
             value={text}
             onChange={(e) => setText(e.target.value)}
             onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleManualSend(); } }}
             placeholder="Type a message..."
             className="flex-1 bg-transparent border-none outline-none text-white text-sm text-right"
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