const DEBT_ENDPOINT =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=2";
const REFERENCE_DEBT = 40e12;

export async function onRequestGet() {
  try {
    const response = await fetch(DEBT_ENDPOINT, {
      headers: {
        Accept: "application/json",
        "User-Agent": "dopeoclock.com Treasury debt reader"
      }
    });

    if (!response.ok) {
      throw new Error(`Treasury request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const observations = (payload.data || []).map(toObservation).filter(Boolean);

    if (!observations.length) {
      throw new Error("Treasury returned no debt observations");
    }

    const latest = observations[0];
    const previous = observations[1];
    const elapsedDays = previous
      ? Math.max(1, daysBetween(previous.recordDate, latest.recordDate))
      : 1;
    const dailyChange = previous ? (latest.value - previous.value) / elapsedDays : 0;

    return json({
      ok: true,
      source: "U.S. Treasury Fiscal Data",
      sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
      fetchedAt: new Date().toISOString(),
      latest,
      previous: previous || null,
      dailyChange
    });
  } catch (error) {
    // Keep the scale comparison usable when Treasury is temporarily unavailable.
    // This is deliberately identified as a reference figure, never as live data.
    return json({
      ok: false,
      source: "U.S. Treasury Fiscal Data",
      sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
      fetchedAt: new Date().toISOString(),
      latest: { recordDate: "", value: REFERENCE_DEBT },
      previous: null,
      dailyChange: 0,
      error: error instanceof Error ? error.message : "Debt data unavailable"
    });
  }
}

function toObservation(row) {
  const value = Number.parseFloat(row.tot_pub_debt_out_amt);

  if (!row.record_date || !Number.isFinite(value)) return null;

  return { recordDate: row.record_date, value };
}

function daysBetween(first, second) {
  return Math.round((new Date(`${second}T00:00:00Z`) - new Date(`${first}T00:00:00Z`)) / 86400000);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=900"
    }
  });
}
