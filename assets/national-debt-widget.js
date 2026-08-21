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
              <h3 id="${comparisonTitleId}">At the scale of a family earning $100,000</h3>
              <p>The same proportions, translated into familiar numbers.</p>
            </div>

            <dl class="debt-metrics" aria-label="Federal finances scaled to a family income of $100,000">
              <div class="debt-metric">
                <dt>Existing debt</dt>
                <dd>≈ $765,000</dd>
              </div>
              <div class="debt-metric">
                <dt>Annual interest</dt>
                <dd>≈ $19,600</dd>
              </div>
              <div class="debt-metric">
                <dt>Annual income</dt>
                <dd>$100,000</dd>
              </div>
              <div class="debt-metric">
                <dt>Annual spending</dt>
                <dd>≈ $134,000</dd>
              </div>
              <div class="debt-metric">
                <dt>New borrowing</dt>
                <dd>≈ $34,000</dd>
              </div>
            </dl>

            <p class="debt-comparison__summary">
              Nearly one dollar in five goes to interest before the balance falls by a dollar, while spending continues to exceed income.
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
