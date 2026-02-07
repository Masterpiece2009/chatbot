export enum Tab {
  CHAT = 'chat',
  IMAGE = 'image',
  VOICE = 'voice'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
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
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}