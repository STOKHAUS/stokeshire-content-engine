// /api/webhook-blog.js — Zapier webhook receiver for blog publish events
// Triggered by Zapier when Squarespace blog RSS updates
// Kicks off the Blog → Carousel → Voiceover → Queue pipeline
// Env vars: ZAPIER_WEBHOOK_SECRET, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  // Simple shared-secret auth
  const secret = process.env.ZAPIER_WEBHOOK_SECRET;
  const provided = req.headers["x-webhook-secret"] || req.body?.secret;
  if (secret && provided !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { blog_url, blog_title } = req.body;

  if (!blog_url) {
    return res.status(400).json({ error: "blog_url is required" });
  }

  // Validate it's a wisconsindesignerdoodles.com URL
  try {
    const u = new URL(blog_url);
    if (!u.hostname.includes("wisconsindesignerdoodles.com")) {
      return res.status(400).json({ error: "URL must be wisconsindesignerdoodles.com" });
    }
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    // Step 1: Fetch blog content
    const fetchRes = await fetch(
      `${getBaseUrl(req)}/api/fetch-blog`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blog_url }),
      }
    );

    if (!fetchRes.ok) {
      const e = await fetchRes.json().catch(() => ({}));
      return res.status(500).json({
        error: "Blog fetch failed",
        detail: e.error || fetchRes.status,
        step: "fetch",
      });
    }

    const { html } = await fetchRes.json();

    // Extract text content from HTML
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 5000);

    const title = blog_title || bodyText.substring(0, 80);

    // Step 2: Generate carousel via Claude
    const carouselRes = await fetch(
      `${getBaseUrl(req)}/api/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: SOCIAL_PROMPT,
          messages: [
            {
              role: "user",
              content: `Create an Instagram carousel from this blog.\n\nTitle: ${title}\n\nContent:\n${bodyText}`,
            },
          ],
        }),
      }
    );

    if (!carouselRes.ok) {
      return res.status(500).json({ error: "Carousel generation failed", step: "carousel" });
    }

    const carouselData = await carouselRes.json();
    const rawText = carouselData.content
      ?.map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    // Extract JSON robustly
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) {
      return res.status(500).json({ error: "No JSON in carousel response", step: "parse" });
    }

    const carousel = JSON.parse(rawText.substring(firstBrace, lastBrace + 1));
    if (!carousel.slides?.length) {
      return res.status(500).json({ error: "Empty carousel", step: "validate" });
    }

    // Step 3: Generate voiceover from caption
    let voiceover = null;
    if (carousel.caption) {
      try {
        const voiceRes = await fetch(
          `${getBaseUrl(req)}/api/elevenlabs`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: carousel.caption }),
          }
        );
        if (voiceRes.ok) {
          voiceover = await voiceRes.json();
        }
      } catch {
        // Voiceover is optional - pipeline continues without it
      }
    }

    // Return the full pipeline output
    return res.status(200).json({
      success: true,
      blog_url,
      blog_title: title,
      carousel: {
        slides: carousel.slides.length,
        caption: carousel.caption || "",
        hashtags: carousel.hashtags || "",
      },
      voiceover: voiceover
        ? {
            generated: true,
            char_count: voiceover.char_count,
            content_type: voiceover.content_type,
            // audio_base64 intentionally omitted from webhook response (too large)
            // Milette retrieves via Content Engine UI
          }
        : { generated: false },
      pipeline_status: "ready_for_scheduling",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: e.message, step: "unknown" });
  }
}

function getBaseUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}`;
}

const SOCIAL_PROMPT = `You are a luxury brand social media strategist for Stokeshire Designer Doodles.

Given a blog post, create an Instagram carousel with 5-7 slides.

Respond ONLY with valid JSON (no markdown, no backticks, no prose):
{
  "caption": "Instagram caption text (2-3 short paragraphs, no hashtags here)",
  "hashtags": "#stokeshire #designerdoodles #bernedoodle (8-12 relevant tags)",
  "slides": [
    {
      "template": "editorial-dark|statement-cream|split-editorial|stat-card|carousel-text|cta-card",
      "props": { ... template-specific props ... }
    }
  ]
}

Template props:
- editorial-dark: { headline, subtitle, footer }
- statement-cream: { tagline, headline, subtitle, accentWord }
- split-editorial: { headline, body, footer, divider:true }
- stat-card: { stat, label, context, footer }
- carousel-text: { slideNumber, totalSlides, headline, body, footer }
- cta-card: { headline, subtitle, cta, url, footer }

Brand voice: Premium, calm, confident. No hype. No exclamation points. Trust over persuasion.
Footer always: "Stokeshire Designer Doodles"`;
