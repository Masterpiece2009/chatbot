export enum Tab {
  CHAT = 'chat',
  NOTES = 'notes'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string; // The first few words of the chat
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
