// Fetch a blog page server-side to avoid CORS issues
// Replaces the unreliable allorigins.win proxy

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  // Only allow fetching from wisconsindesignerdoodles.com
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('wisconsindesignerdoodles.com')) {
      return res.status(400).json({ error: 'Only wisconsindesignerdoodles.com URLs allowed' });
    }
  } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; StokeshireContentEngine/1.0)',
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Fetch failed: ${response.status}` });
    }

    const html = await response.text();
    return res.status(200).json({ html });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
