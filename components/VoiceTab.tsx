import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { sendMessage, generateSpeech } from '../services/geminiService';
import { playRawAudio } from '../services/audioUtils';
import { transcribeAudio } from '../services/deepgramService';
import { Mic, PhoneOff, Phone, AudioWaveform } from 'lucide-react';

interface VoiceTabProps {
  messages: Message[];
  onAddMessage: (role: 'user' | 'model', text: string) => void;
  onNoteDetected: (content: string) => void;
  globalMemory: string;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({ messages, onAddMessage, onNoteDetected, globalMemory }) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [textDisplay, setTextDisplay] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start Call Cycle
  const startListening = async () => {
    try {
      // Resume context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setStatus('thinking');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        try {
          const transcript = await transcribeAudio(audioBlob);
          if (transcript.trim()) {
            setTextDisplay(transcript);
            onAddMessage('user', transcript);
            await processResponse(transcript);
          } else {
             // Silence, listen again? For now, just go to idle
             setStatus('idle');
          }
        } catch (e) {
          console.error(e);
          setStatus('idle');
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setStatus('listening');

    } catch (error) {
      alert("Microphone denied");
      setStatus('idle');
    }
  };

  const stopListeningAndProcess = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const processResponse = async (inputText: string) => {
    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendMessage(inputText, history, globalMemory);
      onAddMessage('model', responseText);
      setTextDisplay(responseText);

      setStatus('speaking');
      const audioBase64 = await generateSpeech(responseText);
      
      if (audioBase64) {
        await playRawAudio(audioBase64);
        // Estimate duration
        const duration = Math.min(responseText.length * 80, 15000);
        setTimeout(() => {
            // After speaking, automatically listen again if in call mode? 
            // For now, let's go to idle to require user interaction (Walkie Talkie style is safer for web)
            setStatus('idle'); 
        }, duration);
      } else {
        setStatus('idle');
      }

    } catch (error) {
      setStatus('idle');
    }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-6 bg-[#0b141a] relative">
      
      {/* STATUS INDICATOR */}
      <div className="mb-12 text-center space-y-4">
        <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${
          status === 'listening' ? 'border-red-500 bg-red-500/10 animate-pulse' :
          status === 'speaking' ? 'border-[#00a884] bg-[#00a884]/10 shadow-[0_0_50px_rgba(0,168,132,0.4)]' :
          status === 'thinking' ? 'border-yellow-500 bg-yellow-500/10 animate-bounce' :
          'border-gray-600 bg-gray-800'
        }`}>
          {status === 'speaking' ? <AudioWaveform size={48} className="text-[#00a884]" /> :
           status === 'listening' ? <Mic size={48} className="text-red-500" /> :
           <Phone size={48} className="text-gray-400" />}
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-gray-100">
            {status === 'idle' && "Ready to Call"}
            {status === 'listening' && "Listening..."}
            {status === 'thinking' && "Donia is thinking..."}
            {status === 'speaking' && "Donia Speaking"}
          </h2>
          <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto line-clamp-3 h-10" dir="auto">
            {textDisplay}
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex gap-8 items-center">
        {status === 'idle' ? (
          <button 
            onClick={startListening}
            className="w-20 h-20 bg-[#00a884] rounded-full flex items-center justify-center shadow-lg hover:bg-[#008f6f] transition-all active:scale-95"
          >
            <Phone size={32} className="text-white fill-white" />
          </button>
        ) : (
          <button 
            onClick={stopListeningAndProcess}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              status === 'listening' ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700'
            }`}
          >
            {status === 'listening' ? <div className="w-8 h-8 bg-white rounded-sm" /> : <PhoneOff size={32} className="text-white" />}
          </button>
        )}
      </div>
      
      <p className="absolute bottom-8 text-gray-500 text-xs">
        {status === 'listening' ? "Tap Red to Stop & Send" : "Tap Green to Start"}
      </p>
    </div>
  );
};