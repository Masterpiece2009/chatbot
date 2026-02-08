export enum Tab {
  CHAT = 'chat', // The DM List view
  ACTIVE_CHAT = 'active_chat', // The actual chat interface
  GALLERY = 'gallery', // The shared photo album
  PROFILE = 'profile' // Settings/Profile
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
}

export interface GalleryItem {
  id: string;
  url: string; // Base64
  caption: string;
  timestamp: number;
}

export interface ImageResult {
  url: string;
  prompt: string;
  timestamp: number;
}