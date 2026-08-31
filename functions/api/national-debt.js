const DEBT_ENDPOINT =
  "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=2";
const CENSUS_ENDPOINT =
  "https://api.census.gov/data/2024/acs/acs1?get=NAME%2CB01003_001E%2CB11001_001E&for=us%3A1";
const REFERENCE_DEBT = 40e12;
const TREASURY_TIMEOUT_MS = 4000;
const DEMOGRAPHIC_FALLBACK = {
  year: 2024,
  population: 340110990,
  households: 132737146
};

export async function onRequestGet(context) {
  const [debtResult, demographicResult] = await Promise.allSettled([
    getDebtData(),
    getDemographicData(context.env?.CENSUS_API_KEY)
  ]);

  const demographics = demographicResult.status === "fulfilled"
    ? demographicResult.value
    : DEMOGRAPHIC_FALLBACK;

  if (debtResult.status === "rejected") {
    return json({
      ok: false,
      source: "U.S. Treasury Fiscal Data",
      sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
      fetchedAt: new Date().toISOString(),
      latest: { recordDate: "", value: REFERENCE_DEBT },
      previous: null,
      dailyChange: 0,
      demographics,
      error: debtResult.reason instanceof Error ? debtResult.reason.message : "Debt data unavailable"
    }, debtResult.reason?.name === "TimeoutError" ? 504 : 502);
  }

  return json({
    ok: true,
    source: "U.S. Treasury Fiscal Data",
    sourceUrl: "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny",
    fetchedAt: new Date().toISOString(),
    ...debtResult.value,
    demographics
  });
}

async function getDebtData() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TREASURY_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(DEBT_ENDPOINT, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "dopeoclock.com Treasury debt reader"
      }
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`Treasury request timed out after ${TREASURY_TIMEOUT_MS}ms`);
      timeoutError.name = "TimeoutError";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

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

  return {
    latest,
    previous: previous || null,
    dailyChange: previous ? (latest.value - previous.value) / elapsedDays : 0
  };
}

async function getDemographicData(apiKey) {
  if (!apiKey) return DEMOGRAPHIC_FALLBACK;

  const url = `${CENSUS_ENDPOINT}&key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });

  if (!response.ok) {
    throw new Error(`Census request failed with status ${response.status}`);
  }

  const rows = await response.json();
  const headers = rows[0] || [];
  const values = rows[1] || [];
  const population = Number(values[headers.indexOf("B01003_001E")]);
  const households = Number(values[headers.indexOf("B11001_001E")]);

  if (!Number.isFinite(population) || !Number.isFinite(households)) {
    throw new Error("Census returned incomplete demographic estimates");
  }

  return { year: 2024, population, households };
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
      "Cache-Control": status >= 400 ? "no-store" : "public, max-age=900"
    }
  });
}
