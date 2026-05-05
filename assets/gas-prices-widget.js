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
    const source = data.source || "https://gasprices.aaa.com/?state=NH";
    const date = nh?.priceDate || national?.priceDate || "";

    node.innerHTML = `
      <div class="aaa-gas-widget">
        <p class="aaa-gas-widget__title">AAA gas averages: today vs. last year</p>
        <div class="aaa-gas-widget__grid">
          ${renderPriceCard(national, "USA")}
          ${renderPriceCard(nh, "NH")}
        </div>
        <p class="aaa-gas-widget__source">
          ${date ? `Price as of ${escapeHtml(date)}. ` : ""}
          Source: <a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">AAA Fuel Prices</a>
        </p>
      </div>
    `;
  }

  function renderPriceCard(price, badge) {
    if (!price) {
      return "";
    }

    const delta = getPriceDelta(price.regular, price.yearAgoRegular);

    return `
      <div class="aaa-gas-widget__price">
        <div class="aaa-gas-widget__heading">
          <p class="aaa-gas-widget__label">${escapeHtml(price.label)}</p>
          <span class="aaa-gas-widget__badge" aria-hidden="true">${escapeHtml(badge)}</span>
        </div>
        <p class="aaa-gas-widget__value">${escapeHtml(formatPrice(price.regular))}</p>
        <p class="aaa-gas-widget__date">Today, regular unleaded</p>
        ${price.yearAgoRegular ? `
          <div class="aaa-gas-widget__compare">
            <span>Same day last year</span>
            <strong>${escapeHtml(formatPrice(price.yearAgoRegular))}</strong>
          </div>
        ` : ""}
        ${delta ? `
          <p class="aaa-gas-widget__delta aaa-gas-widget__delta--${delta.direction}">
            <span aria-hidden="true">${delta.symbol}</span>
            ${escapeHtml(delta.amount)} vs. last year
          </p>
        ` : ""}
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

    const difference = current - previous;

    if (Math.abs(difference) < 0.005) {
      return {
        amount: "$0.00",
        direction: "flat",
        symbol: "-"
      };
    }

    return {
      amount: `$${Math.abs(difference).toFixed(2)}`,
      direction: difference > 0 ? "up" : "down",
      symbol: difference > 0 ? "▲" : "▼"
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
