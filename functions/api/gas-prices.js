const AAA_GAS_URL = "https://gasprices.aaa.com/?state=NH";

export async function onRequestGet() {
  try {
    const response = await fetch(AAA_GAS_URL, {
      headers: {
        "User-Agent": "dopeoclock.com gas price reader",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!response.ok) {
      return json(
        {
          ok: false,
          error: `AAA request failed with status ${response.status}`
        },
        502
      );
    }

    const html = await response.text();
    const text = normalizeText(stripTags(decodeHtmlEntities(html)));
    const national = parseAverage(text, /Today's AAA National Average\s+\$?(\d+\.\d{3})\s+Price as of\s+([0-9/]+)/i);
    const newHampshire = parseAverage(text, /Today's AAA New Hampshire Avg\.\s+\$?(\d+\.\d{3})\s+Price as of\s+([0-9/]+)/i);

    if (!national || !newHampshire) {
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
      source: AAA_GAS_URL,
      fetchedAt: new Date().toISOString(),
      prices: {
        national: {
          label: "National average",
          regular: national.price,
          priceDate: national.date
        },
        newHampshire: {
          label: "New Hampshire average",
          regular: newHampshire.price,
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
