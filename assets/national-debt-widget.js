(function () {
  const selector = "[data-national-debt]";
  const embedOrigin = "https://govspending.org";
  const embedUrl = `${embedOrigin}/embed/debt-counter/`;

  function render(node, index) {
    const panelTitleId = `debt-panel-title-${index}`;
    const comparisonTitleId = `debt-comparison-title-${index}`;

    node.innerHTML = `
      <div class="debt-widget">
        <section class="debt-panel" aria-labelledby="${panelTitleId}">
          <div class="debt-panel__heading">
            <h3 id="${panelTitleId}">National debt right now</h3>
            <a href="https://govspending.org/debt-clock/" target="_blank" rel="noopener noreferrer">View live source</a>
          </div>

          <iframe
            class="debt-panel__frame"
            src="${embedUrl}"
            width="100%"
            height="200"
            frameborder="0"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            title="US National Debt — Live Counter — via GOVSPENDING.org"
          ></iframe>

          <div class="debt-comparison" aria-labelledby="${comparisonTitleId}">
            <div class="debt-comparison__heading">
              <h3 id="${comparisonTitleId}">Picture a family earning $100,000 a year</h3>
              <p>Here is what Washington's debt and FY2025 budget would look like on that income.</p>
            </div>

            <dl class="debt-metrics" aria-label="Federal finances scaled to a family income of $100,000">
              <div class="debt-metric">
                <dt>Existing debt</dt>
                <dd>≈ $765,000</dd>
              </div>
              <div class="debt-metric">
                <dt>Yearly income</dt>
                <dd>$100,000</dd>
              </div>
              <div class="debt-metric">
                <dt>Interest this year</dt>
                <dd>≈ $19,600</dd>
              </div>
              <div class="debt-metric">
                <dt>Total spending</dt>
                <dd>≈ $134,000</dd>
              </div>
              <div class="debt-metric">
                <dt>Added debt</dt>
                <dd>≈ $34,000</dd>
              </div>
            </dl>

            <p class="debt-comparison__summary">
              The family already owes more than seven times its yearly income. Nearly 20% of what it earns goes to interest, yet it still spends $34,000 more than it makes and adds that amount to the debt. That is not a plan to pay debt down. It is a plan to keep it growing.
            </p>
          </div>
        </section>
      </div>
    `;
  }

  const widgets = Array.from(document.querySelectorAll(selector));
  widgets.forEach(render);

  window.addEventListener("message", function (event) {
    if (event.origin !== embedOrigin || event.data?.type !== "govspending:embed-height") return;
    const height = Number(event.data.height);
    if (!Number.isFinite(height) || height < 160 || height > 600) return;

    widgets.forEach(function (widget) {
      const frame = widget.querySelector(".debt-panel__frame");
      if (frame && event.source === frame.contentWindow) frame.style.height = `${Math.ceil(height)}px`;
    });
  });
})();
