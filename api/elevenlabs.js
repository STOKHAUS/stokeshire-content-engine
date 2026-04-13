// /api/elevenlabs.js — ElevenLabs Text-to-Speech API proxy
// Generates voiceover audio from caption text using James's cloned voice
// Env vars: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || "XMWOslvaCTutNnOA5mCJ";

  if (!apiKey) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY not configured" });
  }

  const { text, model_id, voice_settings } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  // Cap at 5000 chars to control costs
  const trimmed = text.trim().substring(0, 5000);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: model_id || "eleven_v3",
          voice_settings: voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err.detail?.message || err.detail || `ElevenLabs API ${response.status}`,
      });
    }

    // Stream the audio back as base64 for browser consumption
    const audioBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    return res.status(200).json({
      audio_base64: base64,
      content_type: "audio/mpeg",
      char_count: trimmed.length,
      voice_id: voiceId,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "ElevenLabs request failed" });
  }
}
