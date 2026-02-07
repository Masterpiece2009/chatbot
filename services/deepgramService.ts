// Service for Deepgram Speech-to-Text
// HARDCODED API KEY
const DEEPGRAM_KEY = "73c540241ef5debcb10445d74d7e63612ac1942f";

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  if (!DEEPGRAM_KEY) {
    console.error("Deepgram API Key is missing");
    throw new Error("API configuration missing");
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=ar&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_KEY}`,
        // Removed 'Content-Type': 'audio/wav' to let the browser set the correct type (e.g., audio/webm) from the Blob
      },
      body: audioBlob,
    });

    if (!response.ok) {
      throw new Error(`Deepgram Error: ${response.statusText}`);
    }

    const data = await response.json();
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;
    
    return transcript || "";
  } catch (error) {
    console.error("Transcription failed:", error);
    throw error;
  }
};
