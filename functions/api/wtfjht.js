const FEED_URL = "https://whatthefuckjusthappenedtoday.com/feed.json";

/*
  Add approved article URLs here when you want manual control.

  Example:
  const APPROVED_URLS = [
    "https://whatthefuckjusthappenedtoday.com/2026/04/26/day-0000/"
  ];

  If this list is empty, the function will show the latest 5 items for testing.
*/
const APPROVED_URLS = [];

function cleanText(value = "") {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
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
      items = items.slice(0, 5);
    }

    const cleanedItems = items.map((item) => ({
      title: item.title || "Untitled",
      url: item.url,
      date: item.date_published || item.date_modified || "",
      summary: shorten(item.summary || item.content_text || item.content_html || ""),
      image: item.image || ""
    }));

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