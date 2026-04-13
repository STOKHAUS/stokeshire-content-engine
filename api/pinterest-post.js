export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify webhook secret
  const secret = req.headers['x-webhook-secret'];
  if (secret !== process.env.ZAPIER_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { blog_url, blog_title, image_url, description } = req.body;

  if (!blog_url || !blog_title) {
    return res.status(400).json({ error: 'blog_url and blog_title are required' });
  }

  try {
    const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
    const boardId = process.env.PINTEREST_BOARD_ID || '993466067740065278';

    // Step 1: Get image — use provided URL or extract OG image from blog
    let pinImageUrl = image_url;
    if (!pinImageUrl) {
      pinImageUrl = await extractOgImage(blog_url);
    }

    if (!pinImageUrl) {
      return res.status(400).json({ error: 'No image available for Pin — provide image_url or ensure blog has OG image' });
    }

    // Step 2: Build Pinterest-optimized description
    const pinDescription = description || buildDescription(blog_title, blog_url);

    // Step 3: Build pin title (max 100 chars)
    const pinTitle = blog_title.length > 100
      ? blog_title.substring(0, 97) + '...'
      : blog_title;

    // Step 4: Post to Pinterest API v5
    const pinResponse = await fetch('https://api.pinterest.com/v5/pins', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: pinTitle,
        description: pinDescription,
        link: blog_url,
        board_id: boardId,
        media_source: {
          source_type: 'image_url',
          url: pinImageUrl,
        },
      }),
    });

    const pinData = await pinResponse.json();

    if (!pinResponse.ok) {
      console.error('Pinterest API error:', JSON.stringify(pinData));
      return res.status(pinResponse.status).json({
        error: 'Pinterest API error',
        details: pinData,
      });
    }

    return res.status(200).json({
      success: true,
      pin_id: pinData.id,
      pin_url: `https://www.pinterest.com/pin/${pinData.id}/`,
      blog_url,
      blog_title,
      image_url: pinImageUrl,
    });

  } catch (error) {
    console.error('pinterest-post error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Fetch the blog URL and extract the OG image meta tag
 */
async function extractOgImage(url) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Stokeshire-Content-Engine/1.0' },
    });
    const html = await response.text();

    // Match og:image meta tag
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    return ogMatch ? ogMatch[1] : null;
  } catch (err) {
    console.error('extractOgImage error:', err.message);
    return null;
  }
}

/**
 * Build a Pinterest-optimized description from title + URL
 * Kept under 500 chars. SEO-focused — keywords, CTA, brand.
 */
function buildDescription(title, url) {
  const slug = url.split('/').filter(Boolean).pop() || '';
  const keywords = slugToKeywords(slug);

  const base = `${title} — Stokeshire Designer Doodles`;
  const keywordLine = keywords ? `\n\n${keywords}` : '';
  const cta = '\n\nVisit the blog for expert guidance from Wisconsin\'s premier doodle breeder.';
  const hashtags = '\n\n#DesignerDoodles #DoodlePuppy #ResponsibleBreeder #Stokeshire #PuppyLife #DoodleMom #DoodleDad';

  const full = base + keywordLine + cta + hashtags;
  return full.length > 500 ? full.substring(0, 497) + '...' : full;
}

/**
 * Convert a URL slug into readable keyword phrases
 * e.g. "puppy-adolescent-regression" → "puppy adolescent regression, puppy development, doodle puppy training"
 */
function slugToKeywords(slug) {
  if (!slug) return '';
  const words = slug.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
