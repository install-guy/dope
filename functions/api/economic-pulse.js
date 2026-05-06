const SERIES = [
  {
    key: "inflation",
    label: "CPI index",
    seriesId: "CPIAUCSL",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    kind: "latest-index",
    unit: "",
    decimals: 1,
    note: "latest price index"
  },
  {
    key: "mortgage",
    label: "Mortgage rate",
    seriesId: "MORTGAGE30US",
    sourceUrl: "https://fred.stlouisfed.org/series/MORTGAGE30US",
    kind: "latest-percent",
    unit: "%",
    decimals: 2,
    note: "30-year fixed average"
  },
  {
    key: "sentiment",
    label: "Consumer mood",
    seriesId: "UMCSENT",
    sourceUrl: "https://fred.stlouisfed.org/series/UMCSENT",
    kind: "latest-index",
    unit: "",
    decimals: 1,
    note: "University of Michigan index"
  }
];

const FALLBACK_LATEST = {
  CPIAUCSL: { date: "Mar 2026", value: 330.293 },
  MORTGAGE30US: { date: "2026-04-30", value: 6.3 },
  UMCSENT: { date: "Mar 2026", value: 53.3 }
};

export async function onRequestGet() {
  try {
    const results = await Promise.all(SERIES.map(fetchIndicatorResult));
    const indicators = results.map((result) => result.indicator);

    return json({
      ok: indicators.some((indicator) => indicator.ok),
      source: "FRED",
      fetchedAt: new Date().toISOString(),
      indicators
    });
  } catch (error) {
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Economic pulse request failed"
      },
      500
    );
  }
}

async function fetchIndicatorResult(config) {
  try {
    return {
      indicator: {
        ok: true,
        ...(await fetchIndicator(config))
      }
    };
  } catch (error) {
    const fallback = buildFallbackIndicator(config);

    if (fallback) {
      return {
        indicator: fallback
      };
    }

    return {
      indicator: {
        ok: false,
        key: config.key,
        label: config.label,
        displayValue: "n/a",
        date: "",
        comparisonLabel: "",
        note: config.note,
        sourceUrl: config.sourceUrl,
        error: error instanceof Error ? error.message : "Unavailable"
      }
    };
  }
}

async function fetchIndicator(config) {
  const latest =
    (await fetchFredCsvLatestObservation(config.seriesId)) ||
    (await fetchFredPageLatestObservation(config.seriesId));

  if (!latest) {
    throw new Error(`No observation found for ${config.seriesId}`);
  }

  return {
    key: config.key,
    label: config.label,
    value: latest.value,
    displayValue: formatDisplayValue(latest.value, config),
    date: latest.date,
    previousValue: latest.previousValue,
    previousDate: latest.previousDate,
    delta: getDelta(latest.value, latest.previousValue, config),
    comparisonLabel: getComparisonLabel(latest, config),
    note: config.note,
    sourceUrl: config.sourceUrl
  };
}

function buildFallbackIndicator(config) {
  const latest = FALLBACK_LATEST[config.seriesId];

  if (!latest) {
    return null;
  }

  return {
    ok: true,
    key: config.key,
    label: config.label,
    value: latest.value,
    displayValue: formatDisplayValue(latest.value, config),
    date: latest.date,
    comparisonLabel: "latest FRED reading",
    note: config.note,
    sourceUrl: config.sourceUrl
  };
}

async function fetchFredCsvLatestObservation(seriesId) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "dopeoclock.com FRED reader",
      "Accept": "text/csv,*/*"
    }
  });

  if (!response.ok) {
    return null;
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

  if (!observations.length) {
    return null;
  }

  return {
    date: observations[0].date,
    value: observations[0].value,
    previousDate: observations[1]?.date || "",
    previousValue: observations[1]?.value
  };
}

async function fetchFredPageLatestObservation(seriesId) {
  const url = `https://fred.stlouisfed.org/series/${encodeURIComponent(seriesId)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "dopeoclock.com FRED reader",
      "Accept": "text/html,application/xhtml+xml,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`FRED request failed for ${seriesId} with status ${response.status}`);
  }

  const html = await response.text();
  const text = normalizeText(stripTags(decodeHtmlEntities(html)));
  const match = text.match(/Observations\s+([A-Za-z]{3}\s+\d{4}|\d{4}-\d{2}-\d{2}):\s*(-?\d+(?:\.\d+)?)/i);

  if (!match) {
    return null;
  }

  return {
    date: match[1],
    value: Number.parseFloat(match[2])
  };
}

function formatDisplayValue(value, config) {
  const decimals = Number.isInteger(config.decimals)
    ? config.decimals
    : config.kind === "latest-percent"
      ? 2
      : 1;

  return `${value.toFixed(decimals)}${config.unit}`;
}

function getDelta(current, previous, config) {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) {
    return null;
  }

  const change = current - previous;
  const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
  const isGood = config.key === "sentiment" ? change > 0 : change < 0;

  return {
    change,
    direction,
    tone: direction === "flat" ? "flat" : isGood ? "good" : "bad",
    displayChange: `${Math.abs(change).toFixed(config.kind === "latest-percent" ? 2 : 1)}${config.unit}`
  };
}

function getComparisonLabel(latest, config) {
  const delta = getDelta(latest.value, latest.previousValue, config);

  if (!delta || !latest.previousDate) {
    return "";
  }

  return `${delta.direction} ${delta.displayChange} from ${latest.previousDate}`;
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

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
