export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured in Vercel environment variables' });
  }

  try {
    const { system, messages, model } = req.body;

    const openaiMessages = [];
    if (system) {
      openaiMessages.push({ role: 'system', content: system });
    }
    if (messages) {
      openaiMessages.push(...messages);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: openaiMessages,
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Normalize to match Anthropic response shape so the frontend can use the same parser
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({
      content: [{ type: 'text', text }],
      model: data.model,
      usage: data.usage,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
