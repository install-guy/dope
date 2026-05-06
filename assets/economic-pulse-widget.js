(function () {
  const selector = "[data-economic-pulse]";
  const defaultEndpoint = "/api/economic-pulse";

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
      <div class="economic-pulse-widget" role="status" aria-live="polite">
        <p class="economic-pulse-widget__title">Cost signals loading...</p>
      </div>
    `;
  }

  function renderError(node) {
    node.innerHTML = `
      <div class="economic-pulse-widget" role="status" aria-live="polite">
        <p class="economic-pulse-widget__title">Cost signals unavailable.</p>
        <p class="economic-pulse-widget__source">
          Data source: <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer">FRED</a>.
        </p>
      </div>
    `;
  }

  function renderPulse(node, data) {
    const indicators = Array.isArray(data.indicators) ? data.indicators : [];

    node.innerHTML = `
      <div class="economic-pulse-widget">
        <p class="economic-pulse-widget__title">Cost of normal, with receipts</p>
        <div class="economic-pulse-widget__grid">
          ${indicators.map(renderIndicator).join("")}
        </div>
        <p class="economic-pulse-widget__source">
          Source: <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer">Federal Reserve Economic Data</a>
        </p>
      </div>
    `;
  }

  function renderIndicator(indicator) {
    const badge = getBadge(indicator.key);

    return `
      <article class="economic-pulse-widget__card">
        <div class="economic-pulse-widget__heading">
          <p class="economic-pulse-widget__label">${escapeHtml(indicator.label)}</p>
          <span class="economic-pulse-widget__badge" aria-hidden="true">${escapeHtml(badge)}</span>
        </div>
        <p class="economic-pulse-widget__value">
          <span>${escapeHtml(indicator.displayValue)}</span>
          ${renderDelta(indicator.delta)}
        </p>
        ${renderIndicatorVisual(indicator)}
        <p class="economic-pulse-widget__note">${escapeHtml(indicator.ok === false ? "Signal unavailable right now" : indicator.note)}</p>
        ${indicator.date ? `
          <p class="economic-pulse-widget__date">
            ${escapeHtml(indicator.date)}
            ${indicator.comparisonLabel ? `<span>${escapeHtml(indicator.comparisonLabel)}</span>` : ""}
          </p>
        ` : ""}
        <a class="economic-pulse-widget__link" href="${escapeHtml(indicator.sourceUrl)}" target="_blank" rel="noopener noreferrer">FRED receipt</a>
      </article>
    `;
  }

  function renderDelta(delta) {
    if (!delta || !delta.direction || delta.direction === "flat") {
      return "";
    }

    const symbol = delta.direction === "up" ? "▲" : "▼";
    const label = `${delta.direction} ${delta.displayChange || ""}`.trim();
    const tone = delta.tone === "good" ? "good" : delta.tone === "bad" ? "bad" : "flat";

    return `
      <span class="economic-pulse-widget__delta economic-pulse-widget__delta--${escapeHtml(tone)}" aria-label="${escapeHtml(label)}">
        <span aria-hidden="true">${escapeHtml(symbol)}</span>
      </span>
    `;
  }

  function renderIndicatorVisual(indicator) {
    if (indicator.ok === false || !Number.isFinite(indicator.value)) {
      return "";
    }

    if (indicator.key === "inflation") {
      const basketValue = Math.round(indicator.value);

      return `
        <div class="economic-pulse-widget__basket" aria-label="CPI translated to a household basket">
          <span>
            <strong>$100</strong>
            <small>1982-84 basket</small>
          </span>
          <span class="economic-pulse-widget__arrow" aria-hidden="true">-&gt;</span>
          <span>
            <strong>$${escapeHtml(basketValue)}</strong>
            <small>same basket now</small>
          </span>
        </div>
      `;
    }

    if (indicator.key === "sentiment") {
      const moodValue = Math.max(0, Math.min(100, indicator.value));

      return `
        <div class="economic-pulse-widget__meter" aria-label="Consumer mood compared with the 100-point baseline">
          <div class="economic-pulse-widget__meter-track">
            <span style="width: ${escapeHtml(moodValue.toFixed(1))}%"></span>
          </div>
          <div class="economic-pulse-widget__meter-labels">
            <span>sour</span>
            <strong>${escapeHtml(indicator.value.toFixed(1))} vs. 100 baseline</strong>
          </div>
        </div>
      `;
    }

    return "";
  }

  function getBadge(key) {
    if (key === "inflation") return "CPI";
    if (key === "mortgage") return "APR";
    if (key === "sentiment") return "VIBE";
    return "FRED";
  }

  async function loadWidget(node) {
    const endpoint = node.getAttribute("data-endpoint") || defaultEndpoint;

    renderLoading(node);

    try {
      const response = await fetch(endpoint, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Economic pulse endpoint failed");
      }

      const data = await response.json();

      if (!Array.isArray(data.indicators)) {
        throw new Error(data.error || "Economic pulse data unavailable");
      }

      renderPulse(node, data);
    } catch (error) {
      console.error(error);
      renderError(node);
    }
  }

  document.querySelectorAll(selector).forEach(loadWidget);
})();
