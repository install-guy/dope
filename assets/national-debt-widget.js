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
            <h3 id="${counterTitleId}">The National Debt, Right Now</h3>
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
            <h3 id="${translationTitleId}">If This Were Family Debt</h3>
            <p>Before this family earns or spends another dollar, it already owes about:</p>
          </div>

          <div class="debt-family__burden" aria-label="Existing family debt and annual interest at the federal government's scale">
            <div class="debt-family__balance">
              <span>Existing family debt</span>
              <strong>≈ $765,000</strong>
            </div>
            <div class="debt-family__interest">
              <span>Interest alone</span>
              <strong>≈ $19,600/year</strong>
              <small>About $1,635 every month—nearly 20% of income before the debt comes down by a dollar.</small>
            </div>
          </div>

          <h4 class="debt-family__year-title">Then the year begins.</h4>

          <div class="debt-family__flow" aria-label="Annual federal finances scaled to a family income of $100,000">
            <div class="debt-family__amount">
              <span>Income</span>
              <strong>$100,000</strong>
            </div>
            <div class="debt-family__amount debt-family__amount--spending">
              <span>Spending</span>
              <strong>≈ $134,000</strong>
            </div>
            <div class="debt-family__amount debt-family__amount--borrowing">
              <span>New debt</span>
              <strong>+ $34,000</strong>
            </div>
          </div>

          <div class="debt-family__takeaway">
            <strong>This is not a payoff plan.</strong>
            <span>Pay the interest. Refinance the balance. Borrow again.</span>
          </div>

          <p class="debt-family__closer">At household scale, no financial adviser would call that a path out of debt. At the federal level, it is the current path.</p>
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
      const frame = widget.querySelector(".debt-counter-card__frame");
      if (frame && event.source === frame.contentWindow) frame.style.height = `${Math.ceil(height)}px`;
    });
  });
})();
