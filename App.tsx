import React, { useState, useEffect } from 'react';
import { Tab } from './types';
import { ChatTab } from './components/ChatTab';
import { ImageTab } from './components/ImageTab';
import { VoiceTab } from './components/VoiceTab';
import { MessageCircle, Image, Mic, Download, X, Share, MoreVertical } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.CHAT);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Detect if already installed (standalone mode)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isStandaloneMode);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.CHAT:
        return <ChatTab />;
      case Tab.IMAGE:
        return <ImageTab />;
      case Tab.VOICE:
        return <VoiceTab />;
      default:
        return <ChatTab />;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-background text-white font-sans overflow-hidden">
      
      {/* Install Button (Floating Top Right) - Hidden if already installed */}
      {!isStandalone && (
        <button 
          onClick={() => setShowInstallModal(true)}
          className="fixed top-4 right-4 z-50 bg-white/10 backdrop-blur border border-white/20 p-2 rounded-full text-white shadow-lg hover:bg-white/20 transition-all active:scale-95"
          aria-label="Install App"
        >
          <Download size={20} />
        </button>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <div className={`h-full w-full ${activeTab === Tab.CHAT ? 'block' : 'hidden'}`}>
             <ChatTab />
        </div>
         <div className={`h-full w-full ${activeTab === Tab.IMAGE ? 'block' : 'hidden'}`}>
             <ImageTab />
        </div>
         <div className={`h-full w-full ${activeTab === Tab.VOICE ? 'block' : 'hidden'}`}>
             <VoiceTab />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 bg-surface/90 backdrop-blur border-t border-white/5 flex items-center justify-around px-2 pb-safe z-40">
        <button
          onClick={() => setActiveTab(Tab.CHAT)}
          className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
            activeTab === Tab.CHAT ? 'text-primary' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <MessageCircle size={24} className={activeTab === Tab.CHAT ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Chat</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.IMAGE)}
          className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
            activeTab === Tab.IMAGE ? 'text-accent' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Image size={24} className={activeTab === Tab.IMAGE ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Image</span>
        </button>

        <button
          onClick={() => setActiveTab(Tab.VOICE)}
          className={`flex flex-col items-center justify-center w-16 h-full space-y-1 transition-colors ${
            activeTab === Tab.VOICE ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Mic size={24} className={activeTab === Tab.VOICE ? 'fill-current' : ''} />
          <span className="text-[10px] font-medium">Voice</span>
        </button>
      </nav>

      {/* Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Download size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Install Gemini Pocket</h2>
              <p className="text-gray-400 text-sm">
                No APK needed! Install this directly from your browser to get a native app experience.
              </p>
            </div>

            <div className="space-y-4 bg-background/50 rounded-xl p-4 border border-white/5">
              {isIOS ? (
                // iOS Instructions
                <div className="flex items-start gap-4 text-left">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">1. Tap the Share button</p>
                    <p className="text-xs text-gray-400 mb-3">Usually at the bottom of the screen</p>
                    <div className="flex justify-center my-2">
                         <Share size={24} className="text-blue-400" />
                    </div>
                    
                    <p className="text-sm font-medium text-white mt-4 mb-1">2. Select "Add to Home Screen"</p>
                    <p className="text-xs text-gray-400">Scroll down to find it</p>
                  </div>
                </div>
              ) : (
                // Android/Desktop Instructions
                <div className="flex items-start gap-4 text-left">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">1. Tap the Browser Menu</p>
                    <p className="text-xs text-gray-400 mb-3">Usually the 3 dots in the top corner</p>
                    <div className="flex justify-center my-2">
                        <MoreVertical size={24} className="text-gray-300" />
                    </div>

                    <p className="text-sm font-medium text-white mt-4 mb-1">2. Select "Install App"</p>
                    <p className="text-xs text-gray-400">Or "Add to Home Screen"</p>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-6 bg-white text-black font-semibold py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;