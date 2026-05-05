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
        <p class="aaa-gas-widget__title">Today's AAA gas averages</p>
        <div class="aaa-gas-widget__grid">
          ${renderPriceCard(national)}
          ${renderPriceCard(nh)}
        </div>
        <p class="aaa-gas-widget__title aaa-gas-widget__title--sub">Same day last year, for comparison</p>
        <div class="aaa-gas-widget__grid aaa-gas-widget__grid--compare">
          ${renderComparisonCard(national)}
          ${renderComparisonCard(nh)}
        </div>
        <p class="aaa-gas-widget__source">
          ${date ? `Price as of ${escapeHtml(date)}. ` : ""}
          Source: <a href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">AAA Fuel Prices</a>
        </p>
      </div>
    `;
  }

  function renderPriceCard(price) {
    if (!price) {
      return "";
    }

    return `
      <div class="aaa-gas-widget__price">
        <p class="aaa-gas-widget__label">${escapeHtml(price.label)}</p>
        <p class="aaa-gas-widget__value">${escapeHtml(formatPrice(price.regular))}</p>
        <p class="aaa-gas-widget__date">Today, regular unleaded</p>
      </div>
    `;
  }

  function renderComparisonCard(price) {
    if (!price?.yearAgoRegular) {
      return "";
    }

    return `
      <div class="aaa-gas-widget__price aaa-gas-widget__price--compare">
        <p class="aaa-gas-widget__label">${escapeHtml(price.label)}</p>
        <p class="aaa-gas-widget__value aaa-gas-widget__value--compare">${escapeHtml(formatPrice(price.yearAgoRegular))}</p>
        <p class="aaa-gas-widget__date">Same date last year</p>
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
