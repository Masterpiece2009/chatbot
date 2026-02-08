import React, { useRef } from 'react';
import { GalleryItem } from '../types';
import { Plus, Trash2, Heart, Image as ImageIcon } from 'lucide-react';

interface GalleryTabProps {
  items: GalleryItem[];
  onAdd: (url: string, caption: string) => void;
  onDelete: (id: string) => void;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({ items, onAdd, onDelete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Prompt for caption before processing
      const userCaption = window.prompt("Write a caption for this memory:", "Shared Moment");
      if (userCaption === null) return; // Cancelled

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Max dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          onAdd(dataUrl, userCaption || "Shared Memory");
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-[#262626] bg-black sticky top-0 z-10">
        <h1 className="font-bold text-lg">Our Gallery 🤍</h1>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="text-[#3797f0] font-semibold text-sm"
        >
          <Plus size={24} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileSelect}
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-1">
        {items.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
             <div className="w-16 h-16 rounded-full border-2 border-gray-700 flex items-center justify-center">
               <ImageIcon size={32} />
             </div>
             <p>No photos yet. Add some memories!</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {items.map((item) => (
              <div key={item.id} className="relative aspect-auto group bg-[#121212] overflow-hidden mb-1">
                <img 
                  src={item.url} 
                  className="w-full h-auto object-cover max-h-96" 
                  alt={item.caption} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 opacity-100">
                    <p className="text-white text-xs font-semibold drop-shadow-md">{item.caption}</p>
                    <span className="text-[10px] text-gray-300">{new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={() => onDelete(item.id)}
                  className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};