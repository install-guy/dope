(function () {
  const selector = "[data-national-debt]";
  const embedOrigin = "https://govspending.org";
  const embedUrl = `${embedOrigin}/embed/debt-counter/`;

  function render(node) {
    node.innerHTML = `
      <div class="debt-widget">
        <article class="debt-family" aria-labelledby="debt-family-title">
          <p class="debt-family__kicker">If Washington were a household earning $100,000</p>
          <h3 id="debt-family-title">It would spend $135,000—and borrow the other $35,000.</h3>

          <div class="debt-family__comparison" aria-label="Federal budget scaled to a household income of $100,000">
            <div class="debt-family__amount">
              <span>Comes in</span>
              <strong>$100,000</strong>
            </div>
            <div class="debt-family__operator" aria-hidden="true">→</div>
            <div class="debt-family__amount debt-family__amount--spending">
              <span>Goes out</span>
              <strong>$135,000</strong>
            </div>
            <div class="debt-family__operator" aria-hidden="true">+</div>
            <div class="debt-family__amount debt-family__amount--debt">
              <span>New debt</span>
              <strong>$35,000</strong>
            </div>
          </div>

          <p class="debt-family__owed">And it would already owe about <strong>$769,000</strong>.</p>
          <p class="debt-family__note">Same proportions as the FY2025 federal budget. Smaller numbers.</p>
        </article>

        <aside class="debt-counter-card" aria-labelledby="debt-counter-title">
          <div class="debt-counter-card__heading">
            <div>
              <p class="debt-eyebrow">The running total</p>
              <h3 id="debt-counter-title">Watch the national debt move</h3>
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

        <p class="debt-caveat"><strong>A country is not literally a household.</strong> This comparison explains the scale and direction of the budget—not household-style bankruptcy.</p>

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
