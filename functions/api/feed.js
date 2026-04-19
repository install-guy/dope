export async function onRequestGet() {
  const feedUrl = "https://trumpstruth.org/feed";

  try {
    const response = await fetch(feedUrl, {
      headers: {
        "User-Agent": "CloudflarePagesFeedProxy/1.0",
        "Accept": "application/rss+xml, application/xml, text/xml, */*"
      }
    });

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: `Feed request failed with status ${response.status}`
        },
        502
      );
    }

    const xml = await response.text();
    const posts = parseRssItems(xml).slice(0, 10);

    return json({
      ok: true,
      source: feedUrl,
      count: posts.length,
      posts
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown proxy error"
      },
      500
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
}

function decodeXmlEntities(str = "") {
  return str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(str = "") {
  return str.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getTagValue(block, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = block.match(regex);
  return match ? decodeXmlEntities(match[1].trim()) : "";
}

function parseRssItems(xml) {
  const items = [...xml.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((match) => match[0]);

  return items
    .map((item) => {
      const title = stripTags(getTagValue(item, "title"));
      const description = stripTags(getTagValue(item, "description"));
      const pubDate = getTagValue(item, "pubDate");
      const link = stripTags(getTagValue(item, "link"));

      const content = description || title || "Recent update";
      const isoDate = toIsoDate(pubDate);

      return {
        date: isoDate,
        content,
        link
      };
    })
    .filter((post) => post.content)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function toIsoDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}