(function () {
  const selector = "[data-national-debt]";
  const endpoint = "/api/national-debt";
  const treasuryEndpoint =
    "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&page%5Bsize%5D=2";
  const storageKey = "national-debt-snapshot";
  const demographicFallback = {
    year: 2024,
    population: 340110990,
    households: 132737146
  };
  const millionPerDay = 1e6;
  const daysPerYear = 365.2425;
  const retryDelayMs = 3000;
  const refreshDelayMs = 15 * 60 * 1000;
  const requestTimeoutMs = 4500;
  const animationTimers = new WeakMap();
  const refreshTimers = new WeakMap();

  const exactDollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const wholeDollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  const wholeNumbers = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  });

  function roundTo(value, increment) {
    return Math.round(value / increment) * increment;
  }

  function formatTrillions(value) {
    return `$${(value / 1e12).toFixed(1)} trillion`;
  }

  function formatWholeTrillions(value) {
    return `$${wholeNumbers.format(roundTo(value, 1e12) / 1e12)} trillion`;
  }

  function formatScaleCurrency(value) {
    const absolute = Math.abs(value);
    const sign = value < 0 ? "-" : "";

    if (absolute >= 1e12) return `${sign}$${(absolute / 1e12).toFixed(1)} trillion`;
    if (absolute >= 1e9) return `${sign}$${(absolute / 1e9).toFixed(1)} billion`;
    if (absolute >= 1e6) return `${sign}$${wholeNumbers.format(roundTo(absolute, 1e6) / 1e6)} million`;
    return `${sign}${wholeDollars.format(roundTo(absolute, 1000))}`;
  }

  function metric(label, value, note, dataAttribute) {
    return `
      <div class="debt-metric">
        <dt>${label}</dt>
        <dd${dataAttribute ? ` ${dataAttribute}` : ""}>${value}</dd>
        <small>${note}</small>
      </div>
    `;
  }

  function formatDate(value) {
    if (!value) return "unavailable";
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function getCachedData() {
    try {
      const cached = JSON.parse(window.localStorage.getItem(storageKey));
      if (!cached?.latest || !Number.isFinite(cached.latest.value) || !cached.demographics) return null;
      return cached;
    } catch {
      return null;
    }
  }

  function cacheData(data) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // The live display still works when browser storage is unavailable.
    }
  }

  function estimateCurrentDebt(debt, dailyChange, recordDate, fetchedAt) {
    if (!recordDate || !fetchedAt || dailyChange === 0) return debt;
    const endOfRecordDate = new Date(`${recordDate}T23:59:59Z`).getTime();
    const fetchedTime = new Date(fetchedAt).getTime();

    if (!Number.isFinite(endOfRecordDate) || !Number.isFinite(fetchedTime)) return debt;
    const elapsedDays = Math.max(0, (fetchedTime - endOfRecordDate) / 86400000);
    return debt + dailyChange * elapsedDays;
  }

  function render(node, data, index) {
    window.clearInterval(animationTimers.get(node));

    const panelTitleId = `debt-panel-title-${index}`;
    const comparisonTitleId = `debt-comparison-title-${index}`;
    const dailyChange = Number(data.dailyChange) || 0;
    const debt = data.ok === true
      ? estimateCurrentDebt(data.latest.value, dailyChange, data.latest.recordDate, data.fetchedAt)
      : data.latest.value;
    const hourlyChange = dailyChange / 24;
    const demographics = data.demographics;
    const population = Number(demographics.population);
    const households = Number(demographics.households);
    const isLive = data.ok === true;
    const liveNote = data.stale
      ? `Estimate based on the last available Treasury reading from ${formatDate(data.latest.recordDate)}. Refreshing the source automatically.`
      : isLive
        ? `Estimate based on the latest Treasury reading from ${formatDate(data.latest.recordDate)} and its recent daily change.`
        : "Treasury data is temporarily unavailable. Showing a $40 trillion reference figure and retrying automatically.";
    const rateValue = isLive && dailyChange !== 0 ? formatScaleCurrency(dailyChange) : "Unavailable";
    const hourlyValue = isLive && dailyChange !== 0 ? formatScaleCurrency(hourlyChange) : "Unavailable";

    node.innerHTML = `
      <div class="debt-widget">
        <section class="debt-panel" aria-labelledby="${panelTitleId}">
          <div class="debt-panel__heading">
            <h3 id="${panelTitleId}">National debt right now</h3>
            <a href="https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny" target="_blank" rel="noopener noreferrer">View Treasury source</a>
          </div>

          <div class="debt-panel__counter">
            <p class="debt-panel__label">${isLive ? "Estimated current total" : "Reference total"}</p>
            <p class="debt-panel__number" data-debt-counter aria-live="off">${exactDollars.format(debt)}</p>
            <p class="debt-panel__note">${liveNote}</p>
          </div>

          <div class="debt-comparison" aria-labelledby="${comparisonTitleId}">
            <div class="debt-comparison__heading">
              <h3 id="${comparisonTitleId}">What does ${formatWholeTrillions(debt)} actually mean?</h3>
              <p>Each figure below uses the same national debt total shown above.</p>
            </div>

            <dl class="debt-metrics" aria-label="National debt scale comparisons">
              ${metric("Total national debt", formatTrillions(debt), isLive ? "Live estimate" : "Reference figure", "data-total-debt")}
              ${metric("Per person", formatScaleCurrency(debt / population), `Using ${demographics.year} Census estimate`, "data-per-person")}
              ${metric("Per U.S. household", formatScaleCurrency(debt / households), `Using ${demographics.year} Census estimate`, "data-per-household")}
              ${metric("Added per hour", hourlyValue, "Recent-rate estimate")}
              ${metric("Added per day", rateValue, "Recent-rate estimate")}
            </dl>

            <p class="debt-comparison__summary" data-spending-comparison>
              If you spent $1 million every day, it would take roughly ${wholeNumbers.format(roundTo(debt / millionPerDay / daysPerYear, 1000))} years to spend ${formatWholeTrillions(debt)}.
            </p>

            <p class="debt-comparison__sources">
              Counts are estimates from the 2024 American Community Survey: <a href="https://data.census.gov/table/ACSDT1Y2024.B01003" target="_blank" rel="noopener noreferrer">population</a> and <a href="https://data.census.gov/table/ACSDT1Y2024.B11001" target="_blank" rel="noopener noreferrer">households</a>.
            </p>
          </div>
        </section>
      </div>
    `;

    if (isLive && dailyChange !== 0) {
      animationTimers.set(node, animateValues(node, debt, dailyChange, population, households));
    }
  }

  function animateValues(node, startingDebt, dailyChange, population, households) {
    const started = Date.now();
    const counter = node.querySelector("[data-debt-counter]");
    const total = node.querySelector("[data-total-debt]");
    const perPerson = node.querySelector("[data-per-person]");
    const perHousehold = node.querySelector("[data-per-household]");
    const comparison = node.querySelector("[data-spending-comparison]");

    function update() {
      const elapsedSeconds = (Date.now() - started) / 1000;
      const currentDebt = startingDebt + (dailyChange / 86400) * elapsedSeconds;
      counter.textContent = exactDollars.format(currentDebt);
      total.textContent = formatTrillions(currentDebt);
      perPerson.textContent = formatScaleCurrency(currentDebt / population);
      perHousehold.textContent = formatScaleCurrency(currentDebt / households);
      comparison.textContent = `If you spent $1 million every day, it would take roughly ${wholeNumbers.format(roundTo(currentDebt / millionPerDay / daysPerYear, 1000))} years to spend ${formatWholeTrillions(currentDebt)}.`;
    }

    update();
    return window.setInterval(update, 1000);
  }

  function scheduleLoad(node, index, delay) {
    window.clearTimeout(refreshTimers.get(node));
    refreshTimers.set(node, window.setTimeout(() => load(node, index, false), delay));
  }

  function validateDebtData(data) {
    if (data.ok !== true || !data.latest || !Number.isFinite(data.latest.value) || !data.demographics) {
      throw new Error("Debt data unavailable");
    }
    return data;
  }

  function toObservation(row) {
    const value = Number.parseFloat(row.tot_pub_debt_out_amt);
    if (!row.record_date || !Number.isFinite(value)) return null;
    return { recordDate: row.record_date, value };
  }

  function daysBetween(first, second) {
    return Math.round((new Date(`${second}T00:00:00Z`) - new Date(`${first}T00:00:00Z`)) / 86400000);
  }

  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      return await fetch(url, {
        cache: "no-store",
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function fetchDirectTreasuryData() {
    const response = await fetchWithTimeout(treasuryEndpoint);
    if (!response.ok) throw new Error("Direct Treasury request failed");

    const payload = await response.json();
    const observations = (payload.data || []).map(toObservation).filter(Boolean);
    if (!observations.length) throw new Error("Treasury returned no debt observations");

    const latest = observations[0];
    const previous = observations[1] || null;
    const elapsedDays = previous
      ? Math.max(1, daysBetween(previous.recordDate, latest.recordDate))
      : 1;

    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      latest,
      previous,
      dailyChange: previous ? (latest.value - previous.value) / elapsedDays : 0,
      demographics: demographicFallback
    };
  }

  async function fetchDebtData() {
    const fetchAppEndpoint = async () => {
      const response = await fetchWithTimeout(endpoint);
      if (!response.ok) throw new Error("Debt endpoint failed");
      return validateDebtData(await response.json());
    };

    return Promise.any([fetchAppEndpoint(), fetchDirectTreasuryData()]);
  }

  async function load(node, index, showLoading = true) {
    if (showLoading) {
      node.innerHTML = '<div class="debt-widget debt-widget--loading" role="status">Loading the latest Treasury total...</div>';
    }

    try {
      const data = await fetchDebtData();
      cacheData(data);
      render(node, data, index);
      scheduleLoad(node, index, refreshDelayMs);
    } catch (error) {
      console.error(error);
      const cachedData = getCachedData();

      if (cachedData) {
        render(node, {
          ...cachedData,
          ok: true,
          stale: true,
          fetchedAt: new Date().toISOString()
        }, index);
      } else if (showLoading || !node.querySelector("[data-debt-counter]")) {
        render(node, {
          ok: false,
          fetchedAt: "",
          latest: { value: 40e12, recordDate: "" },
          dailyChange: 0,
          demographics: demographicFallback
        }, index);
      }
      scheduleLoad(node, index, retryDelayMs);
    }
  }

  document.querySelectorAll(selector).forEach(load);
})();
