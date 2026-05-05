const SERIES = [
  {
    key: "inflation",
    label: "Inflation",
    seriesId: "CPIAUCSL",
    sourceUrl: "https://fred.stlouisfed.org/series/CPIAUCSL",
    kind: "yoy-percent",
    unit: "%",
    note: "CPI, year over year"
  },
  {
    key: "mortgage",
    label: "Mortgage rate",
    seriesId: "MORTGAGE30US",
    sourceUrl: "https://fred.stlouisfed.org/series/MORTGAGE30US",
    kind: "latest-percent",
    unit: "%",
    note: "30-year fixed average"
  },
  {
    key: "sentiment",
    label: "Consumer mood",
    seriesId: "UMCSENT",
    sourceUrl: "https://fred.stlouisfed.org/series/UMCSENT",
    kind: "latest-index",
    unit: "",
    note: "University of Michigan index"
  }
];

export async function onRequestGet() {
  try {
    const indicators = await Promise.all(SERIES.map(fetchIndicator));

    return json({
      ok: true,
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

async function fetchIndicator(config) {
  const observations = await fetchFredSeries(config.seriesId);
  const latest = observations.at(-1);

  if (!latest) {
    throw new Error(`No observations found for ${config.seriesId}`);
  }

  if (config.kind === "yoy-percent") {
    const previous = findObservationAtLeastMonthsBack(observations, latest.date, 12);
    const change = previous ? ((latest.value - previous.value) / previous.value) * 100 : null;

    return {
      key: config.key,
      label: config.label,
      value: change,
      displayValue: change === null ? "n/a" : `${change.toFixed(1)}%`,
      date: latest.date,
      comparisonLabel: previous ? `vs. ${previous.date}` : "",
      note: config.note,
      sourceUrl: config.sourceUrl
    };
  }

  return {
    key: config.key,
    label: config.label,
    value: latest.value,
    displayValue: `${latest.value.toFixed(config.kind === "latest-percent" ? 2 : 1)}${config.unit}`,
    date: latest.date,
    comparisonLabel: "",
    note: config.note,
    sourceUrl: config.sourceUrl
  };
}

async function fetchFredSeries(seriesId) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "dopeoclock.com FRED reader",
      "Accept": "text/csv,*/*"
    }
  });

  if (!response.ok) {
    throw new Error(`FRED request failed for ${seriesId} with status ${response.status}`);
  }

  const csv = await response.text();
  return parseFredCsv(csv, seriesId);
}

function parseFredCsv(csv, seriesId) {
  return csv
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, rawValue] = line.split(",");
      const value = Number.parseFloat(rawValue);

      if (!date || Number.isNaN(value)) {
        return null;
      }

      return { date, value };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function findObservationAtLeastMonthsBack(observations, latestDate, monthsBack) {
  const target = new Date(latestDate);
  target.setMonth(target.getMonth() - monthsBack);

  return [...observations]
    .reverse()
    .find((observation) => new Date(observation.date) <= target) || null;
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
