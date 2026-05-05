const AAA_NATIONAL_URL = "https://gasprices.aaa.com/";
const AAA_NH_URL = "https://gasprices.aaa.com/?state=NH";

export async function onRequestGet() {
  try {
    const [nationalText, newHampshireText] = await Promise.all([
      fetchAaaText(AAA_NATIONAL_URL),
      fetchAaaText(AAA_NH_URL)
    ]);

    const national = parseAverage(nationalText, /Today's AAA National Average\s+\$?(\d+\.\d{3})\s+Price as of\s+([0-9/]+)/i);
    const newHampshire = parseAverage(newHampshireText, /Today's AAA New Hampshire Avg\.\s+\$?(\d+\.\d{3})\s+Price as of\s+([0-9/]+)/i);
    const nationalYesterday = parseRowAverage(nationalText, "Yesterday Avg.");
    const newHampshireYesterday = parseRowAverage(newHampshireText, "Yesterday Avg.");

    if (!national || !newHampshire || !nationalYesterday || !newHampshireYesterday) {
      return json(
        {
          ok: false,
          error: "Unable to parse AAA gas prices"
        },
        502
      );
    }

    return json({
      ok: true,
      source: AAA_NH_URL,
      sources: {
        national: AAA_NATIONAL_URL,
        newHampshire: AAA_NH_URL
      },
      fetchedAt: new Date().toISOString(),
      prices: {
        national: {
          label: "National average",
          regular: national.price,
          yesterdayRegular: nationalYesterday,
          priceDate: national.date
        },
        newHampshire: {
          label: "New Hampshire average",
          regular: newHampshire.price,
          yesterdayRegular: newHampshireYesterday,
          priceDate: newHampshire.date
        }
      }
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Gas price request failed"
      },
      500
    );
  }
}

async function fetchAaaText(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "dopeoclock.com gas price reader",
      "Accept": "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`AAA request failed with status ${response.status}`);
  }

  const html = await response.text();
  return normalizeText(stripTags(decodeHtmlEntities(html)));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=1800"
    }
  });
}

function parseAverage(text, pattern) {
  const match = text.match(pattern);

  if (!match) {
    return null;
  }

  return {
    price: `$${match[1]}`,
    date: match[2]
  };
}

function parseRowAverage(text, rowLabel) {
  const escapedLabel = rowLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escapedLabel}\\s+\\$?(\\d+\\.\\d{3})`, "i"));
  return match ? `$${match[1]}` : null;
}

function normalizeText(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function stripTags(value = "") {
  return value.replace(/<[^>]*>/g, " ");
}

function decodeHtmlEntities(value = "") {
  return value
    .replace(/\u2019/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
