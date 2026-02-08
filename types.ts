export enum Tab {
  CHAT = 'chat', // The DM List view
  NOTES = 'notes', // The Profile/Saved view
  ACTIVE_CHAT = 'active_chat' // The actual chat interface
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string; // Auto-generated from first message
  messages: Message[];
  lastModified: number;
}

export interface Note {
  id: string;
  content: string;
  timestamp: number;
}

export interface ImageResult {
  url: string;
  prompt: string;
  timestamp: number;
}
