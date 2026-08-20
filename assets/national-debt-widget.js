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
            <p>A family bringing home $100,000 would spend about $134,000, finance the $34,000 gap, and keep paying interest on the balance it already carries.</p>
          </div>

          <div class="debt-family__comparison" aria-label="Federal finances scaled to a family income of $100,000">
            <div class="debt-family__amount">
              <span>Family income</span>
              <strong>$100,000</strong>
            </div>
            <div class="debt-family__amount debt-family__amount--spending">
              <span>Family spending</span>
              <strong>≈ $134,000</strong>
            </div>
            <div class="debt-family__amount debt-family__amount--debt">
              <span>Family debt carried</span>
              <strong>≈ $765,000</strong>
            </div>
            <div class="debt-family__amount debt-family__amount--interest">
              <span>Interest due</span>
              <strong>≈ $19,600/year</strong>
              <small>About $1,635 every month</small>
            </div>
          </div>

          <p class="debt-family__takeaway">That is like financing another <strong>≈ $34,000 purchase every year</strong> while interest keeps coming due on the family debt already on the books.</p>
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
