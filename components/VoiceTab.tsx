import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { playRawAudio } from '../services/audioUtils';
import { TTSVoice } from '../types';
import { Mic, Volume2, Play, Loader2, StopCircle } from 'lucide-react';

export const VoiceTab: React.FC = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>(TTSVoice.Kore);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = async () => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      await playRawAudio(base64Audio);
      setIsPlaying(true);
      // Reset playing state after a simple timeout assumption or user interaction
      // In a robust app, we'd track the source's onended event
      setTimeout(() => setIsPlaying(false), 5000); 
    } catch (error) {
      alert("Failed to generate speech.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="px-6 py-4 border-b border-surface bg-background/80 backdrop-blur sticky top-0 z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
          Voice Engine
        </h1>
      </div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
        {/* Voice Selection */}
        <div className="bg-surface rounded-2xl p-1 border border-white/5 flex flex-wrap gap-1">
          {Object.values(TTSVoice).map((voice) => (
            <button
              key={voice}
              onClick={() => setSelectedVoice(voice)}
              className={`flex-1 min-w-[30%] py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                selectedVoice === voice
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {voice}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something for me to say..."
            className="w-full bg-surface border border-white/5 rounded-3xl p-6 text-lg text-white placeholder-gray-600 resize-none outline-none focus:border-green-500/50 transition-all h-64"
          />
          <div className="absolute bottom-4 right-4 text-xs text-gray-500">
            {text.length} chars
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
            <button
                onClick={handleSpeak}
                disabled={!text.trim() || isLoading}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 ${
                    isLoading 
                    ? 'bg-surface border border-white/10' 
                    : 'bg-gradient-to-br from-green-500 to-teal-600 hover:shadow-green-500/20'
                }`}
            >
                {isLoading ? (
                    <Loader2 size={32} className="text-gray-400 animate-spin" />
                ) : (
                    <Volume2 size={32} className="text-white fill-current" />
                )}
            </button>
        </div>

        <div className="text-center">
            <p className="text-gray-500 text-sm">
                {!text ? "Enter text above to start speaking" : isLoading ? "Synthesizing audio..." : "Tap to speak"}
            </p>
        </div>
      </div>
    </div>
  );
};