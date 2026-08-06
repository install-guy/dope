const AAA_NATIONAL_URL = "https://gasprices.aaa.com/";
const AAA_NH_URL = "https://gasprices.aaa.com/?state=NH";
const AAA_ME_URL = "https://gasprices.aaa.com/?state=ME";
const FRED_WTI_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv?id=DCOILWTICO";
const FRED_WTI_SOURCE_URL = "https://fred.stlouisfed.org/series/DCOILWTICO";

export async function onRequestGet() {
  try {
    const [nationalText, newHampshireText, maineText, crudeOil] = await Promise.all([
      fetchAaaText(AAA_NATIONAL_URL),
      fetchAaaText(AAA_NH_URL),
      fetchAaaText(AAA_ME_URL),
      fetchWtiPrice().catch(() => null)
    ]);

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
        crudeOil: FRED_WTI_SOURCE_URL
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
  // FRED serves this public CSV directly. Do not send a synthetic User-Agent:
  // its bot protection rejects that header from some Cloudflare edge locations.
  const response = await fetch(FRED_WTI_URL, {
    headers: {
      Accept: "text/csv,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`FRED WTI request failed with status ${response.status}`);
  }

  const csv = await response.text();
  const rows = csv.trim().split(/\r?\n/).slice(1).reverse();
  const observations = [];

  for (const row of rows) {
    const [date, rawValue] = row.split(",");
    const value = Number.parseFloat(rawValue);

    if (date && Number.isFinite(value)) {
      observations.push({ date, value });

      if (observations.length === 2) {
        break;
      }
    }
  }

  if (observations.length < 2) {
    throw new Error("Unable to parse recent WTI observations");
  }

  return {
    label: "WTI crude oil",
    regular: `$${observations[0].value.toFixed(2)}`,
    previousRegular: `$${observations[1].value.toFixed(2)}`,
    priceDate: observations[0].date,
    previousDate: observations[1].date,
    unit: "per barrel",
    source: "FRED / U.S. EIA",
    sourceUrl: FRED_WTI_SOURCE_URL
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