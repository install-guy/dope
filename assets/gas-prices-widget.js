(function () {
  const selector = "[data-aaa-gas-prices]";
  const defaultEndpoint = "/api/gas-prices";

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderLoading(node) {
    node.innerHTML = `
      <div class="aaa-gas-widget" role="status" aria-live="polite">
        <p class="aaa-gas-widget__title">Gas prices loading...</p>
      </div>
    `;
  }

  function renderError(node) {
    node.innerHTML = `
      <div class="aaa-gas-widget" role="status" aria-live="polite">
        <p class="aaa-gas-widget__title">Gas prices unavailable.</p>
        <p class="aaa-gas-widget__source">
          Check <a href="https://gasprices.aaa.com/?state=NH" target="_blank" rel="noopener noreferrer">AAA Fuel Prices</a>.
        </p>
      </div>
    `;
  }

  function renderPrices(node, data) {
    const national = data.prices?.national;
    const nh = data.prices?.newHampshire;
    const maine = data.prices?.maine;
    const crudeOil = data.crudeOil;
    const source = data.source || "https://gasprices.aaa.com/?state=NH";
    const crudeSourceUrl = crudeOil?.sourceUrl || "https://fred.stlouisfed.org/series/DCOILWTICO";
    const crudeSourceLabel = crudeOil?.source || "FRED / U.S. EIA";
    const date = nh?.priceDate || maine?.priceDate || national?.priceDate || "";

    node.innerHTML = `
      <div class="aaa-gas-widget">
        ${renderCrudeCard(crudeOil)}
        <p class="aaa-gas-widget__title">Gas averages: today vs. yesterday</p>
        <div class="aaa-gas-widget__grid">
          ${renderPriceCard(national, "USA")}
          ${renderPriceCard(nh, "NH")}
          ${renderPriceCard(maine, "ME")}
        </div>
        <p class="aaa-gas-widget__source">
          ${date ? `Price as of ${escapeHtml(date)}. ` : ""}
          Sources: <a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">AAA Fuel Prices</a>${crudeOil ? ` · <a href="${escapeHtml(crudeSourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(crudeSourceLabel)}</a>` : ""}
        </p>
      </div>
    `;
  }

  function renderCrudeCard(price) {
    if (!price) {
      return "";
    }

    const delta = getPriceDelta(price.regular, price.previousRegular);
    const comparisonLabel = price.previousDate ? `Previous (${price.previousDate})` : "Previous reading";

    return `
      <div class="aaa-gas-widget__price">
        <div class="aaa-gas-widget__heading">
          <p class="aaa-gas-widget__label">${escapeHtml(price.label || "WTI crude oil")}</p>
          <span class="aaa-gas-widget__badge" aria-hidden="true">WTI</span>
        </div>
        <p class="aaa-gas-widget__value">
          ${escapeHtml(formatPrice(price.regular))}
          ${delta ? `
            <span class="aaa-gas-widget__delta aaa-gas-widget__delta--${delta.direction}" title="${escapeHtml(delta.label)}">
              <span aria-hidden="true">${delta.symbol}</span>
              <span class="visually-hidden">${escapeHtml(delta.label)}</span>
            </span>
          ` : ""}
        </p>
        <p class="aaa-gas-widget__date">${price.priceDate ? `${escapeHtml(price.priceDate)}, ` : ""}${escapeHtml(price.unit || "per barrel")}</p>
        ${price.previousRegular ? `<p class="aaa-gas-widget__compare">${escapeHtml(comparisonLabel)}: <strong>${escapeHtml(formatPrice(price.previousRegular))}</strong></p>` : ""}
      </div>
    `;
  }

  function renderPriceCard(price, badge) {
    if (!price) {
      return "";
    }

    const delta = getPriceDelta(price.regular, price.yesterdayRegular);

    return `
      <div class="aaa-gas-widget__price">
        <div class="aaa-gas-widget__heading">
          <p class="aaa-gas-widget__label">${escapeHtml(price.label)}</p>
          <span class="aaa-gas-widget__badge" aria-hidden="true">${escapeHtml(badge)}</span>
        </div>
        <p class="aaa-gas-widget__value">
          ${escapeHtml(formatPrice(price.regular))}
          ${delta ? `
            <span class="aaa-gas-widget__delta aaa-gas-widget__delta--${delta.direction}" title="${escapeHtml(delta.label)}">
              <span aria-hidden="true">${delta.symbol}</span>
              <span class="visually-hidden">${escapeHtml(delta.label)}</span>
            </span>
          ` : ""}
        </p>
        <p class="aaa-gas-widget__date">Today, regular unleaded</p>
        ${price.yesterdayRegular ? `<p class="aaa-gas-widget__compare">Yesterday: <strong>${escapeHtml(formatPrice(price.yesterdayRegular))}</strong></p>` : ""}
      </div>
    `;
  }

  function formatPrice(value) {
    const amount = Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));

    if (Number.isNaN(amount)) {
      return value;
    }

    return `$${amount.toFixed(2)}`;
  }

  function getPriceDelta(currentValue, previousValue) {
    const current = parsePrice(currentValue);
    const previous = parsePrice(previousValue);

    if (current === null || previous === null) {
      return null;
    }

    const currentCents = Math.round((current + Number.EPSILON) * 100);
    const previousCents = Math.round((previous + Number.EPSILON) * 100);
    const differenceCents = currentCents - previousCents;

    if (differenceCents === 0) {
      return {
        amount: "$0.00",
        direction: "flat",
        symbol: "-",
        label: "Unchanged from previous reading"
      };
    }

    const difference = differenceCents / 100;

    return {
      amount: `$${Math.abs(difference).toFixed(2)}`,
      direction: difference > 0 ? "up" : "down",
      symbol: difference > 0 ? "\u25B2" : "\u25BC",
      label: `${difference > 0 ? "Up" : "Down"} $${Math.abs(difference).toFixed(2)} from previous reading`
    };
  }

  function parsePrice(value) {
    const amount = Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
    return Number.isNaN(amount) ? null : amount;
  }

  async function loadWidget(node) {
    const endpoint = node.getAttribute("data-endpoint") || defaultEndpoint;

    renderLoading(node);

    try {
      const response = await fetch(endpoint, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Gas price endpoint failed");
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Gas price data unavailable");
      }

      renderPrices(node, data);
    } catch (error) {
      console.error(error);
      renderError(node);
    }
  }

  document.querySelectorAll(selector).forEach(loadWidget);
})();
