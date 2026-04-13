export default async function handler(req, res) {
  // Verify this is a legitimate cron call from Vercel
  if (req.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const webhookSecret = process.env.ZAPIER_WEBHOOK_SECRET;
    const rssUrl = 'https://www.wisconsindesignerdoodles.com/stokeshire-doodle-puppy-blog?format=rss';

    // Fetch RSS feed
    const rssResponse = await fetch(rssUrl);
    if (!rssResponse.ok) {
      throw new Error(`Failed to fetch RSS feed: ${rssResponse.statusText}`);
    }
    const rssText = await rssResponse.text();

    // Parse RSS XML with regex to extract items
    // Match <item>...</item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = [];
    let itemMatch;

    while ((itemMatch = itemRegex.exec(rssText)) !== null) {
      const itemContent = itemMatch[1];

      // Extract title
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/.exec(itemContent);
      const title = titleMatch ? decodeXmlEntities(titleMatch[1].trim()) : 'Untitled';

      // Extract link
      const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/.exec(itemContent);
      const link = linkMatch ? linkMatch[1].trim() : null;

      if (link) {
        items.push({ url: link, title });
      }
    }

    // Fetch list of already-processed URLs from Supabase
    const processedResponse = await fetch(
      `${supabaseUrl}/rest/v1/processed_blog_posts?select=url`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!processedResponse.ok) {
      throw new Error(`Failed to fetch processed posts: ${processedResponse.statusText}`);
    }

    const processedPosts = await processedResponse.json();
    const processedUrls = new Set(processedPosts.map(p => p.url));

    // Find new items
    const newItems = items.filter(item => !processedUrls.has(item.url));

    const results = {
      timestamp: new Date().toISOString(),
      totalItemsInFeed: items.length,
      newItemsFound: newItems.length,
      processedItems: [],
      errors: [],
    };

    // Process each new item
    for (const item of newItems) {
      try {
        // Call internal webhook
        const webhookResponse = await fetch(
          `${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/webhook-blog`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-webhook-secret': webhookSecret,
            },
            body: JSON.stringify({
              blog_url: item.url,
              blog_title: item.title,
            }),
          }
        );

        if (!webhookResponse.ok) {
          throw new Error(`Webhook returned ${webhookResponse.status}`);
        }

        // Record in Supabase
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/processed_blog_posts`,
          {
            method: 'POST',
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              url: item.url,
              title: item.title,
              processed_at: new Date().toISOString(),
            }),
          }
        );

        if (!insertResponse.ok) {
          throw new Error(`Failed to insert record: ${insertResponse.statusText}`);
        }

        results.processedItems.push({
          url: item.url,
          title: item.title,
          status: 'success',
        });
      } catch (error) {
        results.errors.push({
          url: item.url,
          title: item.title,
          error: error.message,
        });
      }
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Decode common XML entities
 */
function decodeXmlEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
  };
  return text.replace(/&(amp|lt|gt|quot|apos);/g, match => entities[match] || match);
}
