(function () {
  const selector = "[data-national-debt]";
  const embedOrigin = "https://govspending.org";
  const embedUrl = `${embedOrigin}/embed/debt-counter/`;

  function render(node, index) {
    const counterTitleId = `debt-counter-title-${index}`;
    const translationTitleId = `debt-translation-title-${index}`;

    node.innerHTML = `
      <div class="debt-widget">
        <aside class="debt-counter-card" aria-labelledby="${counterTitleId}">
          <div class="debt-counter-card__heading">
            <div>
              <p class="debt-eyebrow">Live debt clock</p>
              <h3 id="${counterTitleId}">This number does not clock out</h3>
            </div>
            <a href="https://govspending.org/debt-clock/" target="_blank" rel="noopener noreferrer">View the full clock</a>
          </div>
          <iframe
            class="debt-counter-card__frame"
            src="${embedUrl}"
            width="100%"
            height="200"
            frameborder="0"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            title="US National Debt — Live Counter — via GOVSPENDING.org"
          ></iframe>
        </aside>

        <section class="debt-translation" aria-labelledby="${translationTitleId}">
          <div class="debt-translation__heading">
            <p class="debt-eyebrow">Put it on a kitchen table</p>
            <h3 id="${translationTitleId}">If Washington brought home $100,000</h3>
            <p>Using FY2025 proportions, it would spend about $134,000—and borrow the $34,000 gap.</p>
          </div>

          <div class="debt-family__comparison" aria-label="Federal budget scaled to household income: $100,000 coming in plus $34,000 borrowed equals $134,000 going out">
            <div class="debt-family__amount">
              <span>Comes in</span>
              <strong>$100,000</strong>
            </div>
            <div class="debt-family__operator" aria-hidden="true">+</div>
            <div class="debt-family__amount debt-family__amount--debt">
              <span>Borrowed</span>
              <strong>≈ $34,000</strong>
            </div>
            <div class="debt-family__operator" aria-hidden="true">=</div>
            <div class="debt-family__amount debt-family__amount--spending">
              <span>Goes out</span>
              <strong>≈ $134,000</strong>
            </div>
          </div>

          <p class="debt-family__takeaway">For every <strong>$100</strong> coming in, roughly <strong>$134</strong> goes out.</p>
        </section>

        <p class="debt-caveat"><strong>A country is not literally a household.</strong> This comparison shows the scale and direction of one year's budget—not household-style bankruptcy.</p>

        <p class="debt-sources">
          Household comparison: <a href="https://www.cbo.gov/publication/61307" target="_blank" rel="noopener noreferrer">Congressional Budget Office, FY2025</a>.
          Counter: <a href="https://govspending.org/debt-clock/" target="_blank" rel="noopener noreferrer">GOVSPENDING.org</a>, anchored to Treasury Debt to the Penny.
        </p>
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
      const frame = widget.querySelector(".debt-counter-card__frame");
      if (frame && event.source === frame.contentWindow) frame.style.height = `${Math.ceil(height)}px`;
    });
  });
})();
