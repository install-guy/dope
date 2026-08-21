const FEED_URL = "https://whatthefuckjusthappenedtoday.com/feed.json";

/*
  Add approved article URLs here when you want manual control.

  Example:
  const APPROVED_URLS = [
    "https://whatthefuckjusthappenedtoday.com/2026/04/26/day-0000/"
  ];

  If this list is empty, the function will show the latest 10 items for testing.
*/
const APPROVED_URLS = [];

function cleanText(value = "") {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:br\s*\/?>|\/(?:p|div|li|h[1-6]))>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function shorten(value = "", limit = 280) {
  const text = cleanText(value);

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trim()}…`;
}

export async function onRequestGet() {
  try {
    const response = await fetch(FEED_URL, {
      headers: {
        "User-Agent": "dopeoclock.com feed reader"
      }
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: "Unable to load WTFJHT feed"
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }

    const feed = await response.json();

    let items = Array.isArray(feed.items) ? feed.items : [];

    if (APPROVED_URLS.length > 0) {
      items = items.filter((item) => APPROVED_URLS.includes(item.url));
    } else {
      items = items.slice(0, 10);
    }

    const cleanedItems = items.map((item) => {
      const content = cleanText(item.content_text || item.content_html || item.summary || "");

      return {
        title: item.title || "Untitled",
        date: item.date_published || item.date_modified || "",
        summary: shorten(item.summary || content),
        content,
        image: item.image || ""
      };
    });

    return new Response(
      JSON.stringify({
        source: "WTFJHT",
        items: cleanedItems
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=900"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Feed request failed",
        message: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
