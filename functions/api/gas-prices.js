const AAA_NATIONAL_URL = "https://gasprices.aaa.com/";
const AAA_NH_URL = "https://gasprices.aaa.com/?state=NH";
const AAA_ME_URL = "https://gasprices.aaa.com/?state=ME";
const WTI_QUOTE_URL = "https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=5d";
const WTI_SOURCE_URL = "https://finance.yahoo.com/quote/CL=F";

export async function onRequestGet() {
  try {
    const [nationalText, newHampshireText, maineText] = await Promise.all([
      fetchAaaText(AAA_NATIONAL_URL),
      fetchAaaText(AAA_NH_URL),
      fetchAaaText(AAA_ME_URL)
    ]);
    const crudeOil = await fetchWtiPrice().catch(() => null);

    const national = parseAverage(
      nationalText,
      /Today['’]s AAA National Average\s+\$?(\d+\.\d{3,4})\s+Price as of\s+([0-9/]+)/i
    );
    const newHampshire = parseAverage(
      newHampshireText,
      /Today['’]s AAA New Hampshire Avg\.\s+\$?(\d+\.\d{3,4})\s+Price as of\s+([0-9/]+)/i
    );
    const maine = parseAverage(
      maineText,
      /Today['’]s AAA Maine Avg\.\s+\$?(\d+\.\d{3,4})\s+Price as of\s+([0-9/]+)/i
    );
    const nationalYesterday = parseRowAverage(nationalText, "Yesterday Avg.");
    const newHampshireYesterday = parseRowAverage(newHampshireText, "Yesterday Avg.");
    const maineYesterday = parseRowAverage(maineText, "Yesterday Avg.");

    if (!national || !newHampshire || !maine || !nationalYesterday || !newHampshireYesterday || !maineYesterday) {
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
        newHampshire: AAA_NH_URL,
        maine: AAA_ME_URL,
      crudeOil: WTI_SOURCE_URL
      },
      fetchedAt: new Date().toISOString(),
      crudeOil,
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
        },
        maine: {
          label: "Maine average",
          regular: maine.price,
          yesterdayRegular: maineYesterday,
          priceDate: maine.date
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

async function fetchWtiPrice() {
  const response = await fetch(WTI_QUOTE_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`WTI quote request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const quote = payload?.chart?.result?.[0];
  const current = quote?.meta?.regularMarketPrice;
  const previous = quote?.meta?.chartPreviousClose;

  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    throw new Error("Unable to parse WTI quote data");
  }

  const timestamp = quote?.meta?.regularMarketTime;
  const priceDate = Number.isFinite(timestamp)
    ? new Date(timestamp * 1000).toISOString().slice(0, 10)
    : "";

  return {
    label: "WTI crude oil",
    regular: `$${current.toFixed(2)}`,
    previousRegular: `$${previous.toFixed(2)}`,
    priceDate,
    unit: "per barrel",
    source: "Yahoo Finance / NYMEX",
    sourceUrl: WTI_SOURCE_URL
  };
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
  const match = text.match(new RegExp(`${escapedLabel}\\s+\\$?(\\d+\\.\\d{3,4})`, "i"));
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
