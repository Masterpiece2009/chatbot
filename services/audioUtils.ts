// Base64 decoding helper
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// PCM Audio Decoding Helper
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Shared Audio Context to prevent multiple contexts and respect user gesture limits
let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000 // Gemini TTS often uses 24k
    });
  }
  return sharedAudioContext;
}

export async function playRawAudio(base64Data: string) {
  try {
    const audioContext = getAudioContext();
    
    // Ensure context is running (fixes "not speaking" issues on mobile)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    const bytes = decode(base64Data);
    const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    
    return source;
  } catch (error) {
    console.error("Error playing audio", error);
    // Try to recover by creating a new context if the shared one is dead
    sharedAudioContext = null;
    throw error;
  }
}