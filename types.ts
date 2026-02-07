export enum Tab {
  CHAT = 'chat',
  VOICE = 'voice',
  NOTES = 'notes'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
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

export enum TTSVoice {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir', // Deep male voice
  Zephyr = 'Zephyr'
}