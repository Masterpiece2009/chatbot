import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { ImageResult } from '../types';
import { Sparkles, Download, Loader2, Image as ImageIcon } from 'lucide-react';

export const ImageTab: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<ImageResult[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const imageUrl = await generateImage(prompt);
      const newImage: ImageResult = {
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now()
      };
      setGeneratedImages(prev => [newImage, ...prev]);
      setPrompt('');
    } catch (error) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <div className="px-6 py-4 border-b border-surface bg-background/80 backdrop-blur sticky top-0 z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Studio
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        {/* Input Section */}
        <div className="bg-surface rounded-2xl p-4 mb-6 border border-white/5 shadow-lg">
          <label className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2 block">
            Imagine Something
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic city with flying cars, neon lights, cyberpunk style..."
            className="w-full bg-background/50 rounded-xl p-3 text-sm text-white placeholder-gray-500 resize-none outline-none border border-transparent focus:border-purple-500/50 transition-all h-24 mb-3"
          />
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Generate Image
              </>
            )}
          </button>
        </div>

        {/* Gallery Section */}
        <div className="space-y-6">
            {generatedImages.length === 0 && !isLoading && (
                <div className="text-center py-12 text-gray-600">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No images created yet.</p>
                </div>
            )}
          
          {generatedImages.map((img, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-surface">
              <img 
                src={img.url} 
                alt={img.prompt} 
                className="w-full h-auto object-cover aspect-square"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-white text-xs line-clamp-2 mb-2">{img.prompt}</p>
                <a 
                  href={img.url} 
                  download={`gemini-${img.timestamp}.png`}
                  className="bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-lg py-2 px-3 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Save Image
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};