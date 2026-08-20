(function () {
  const selector = "[data-national-debt]";
  const endpoint = "/api/national-debt";
  const revenue = 5.2e12;
  const outlays = 7.0e12;
  const deficit = 1.8e12;
  const netInterest = 970e9;
  const familyIncome = 100000;

  const dollars = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function familyValue(amount) {
    return dollars.format((amount / revenue) * familyIncome);
  }

  function debtValue(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function renderShell(node, debt, officialDate, dailyChange, isLive) {
    const counterLabel = isLive ? "Estimated national debt now" : "$40 trillion reference scale";
    const pace = isLive
      ? `Recent pace: <strong>${dailyChange >= 0 ? "+" : "−"}${dollars.format(Math.abs(dailyChange))} per day</strong>`
      : "Treasury's live update is temporarily unavailable.";
    const counterNote = isLive
      ? `The counter estimates movement between Treasury updates using the latest daily change. Last official reading: ${formatDate(officialDate)}.`
      : "The family comparison remains available using the $40 trillion reference figure. This number is not being presented as a live reading.";

    node.innerHTML = `
      <div class="debt-widget">
        <div class="debt-counter-card">
          <p class="debt-counter-card__label"><span aria-hidden="true"></span> ${counterLabel}</p>
          <p class="debt-counter-card__number" data-debt-counter>${debtValue(debt)}</p>
          <p class="debt-counter-card__pace">${pace}</p>
          <p class="debt-counter-card__note">${counterNote}</p>
        </div>

        <div class="debt-family">
          <div class="debt-family__heading">
            <div>
              <p class="debt-eyebrow">If Washington were a family of three</p>
              <h3>$100,000 comes in. $135,000 goes out.</h3>
            </div>
            <span class="debt-family__badge">Same proportions. Smaller numbers.</span>
          </div>

          <div class="debt-family__grid">
            ${metric("Annual income", familyValue(revenue), "$5.2T federal revenue")}
            ${metric("Annual spending", familyValue(outlays), "$7.0T federal outlays")}
            ${metric("Added every year", familyValue(deficit), "$1.8T deficit")}
            ${metric("Already owed", familyValue(debt), "Live national debt", true)}
            ${metric("Interest every year", familyValue(netInterest), "$970B net interest")}
          </div>

          <p class="debt-family__bottom-line">
            Almost one dollar in every five earned goes to interest on old spending — before the principal meaningfully comes down.
          </p>
        </div>

        <div class="debt-caveat">
          <strong>A country is not a household.</strong>
          <p>The United States can tax a vast economy, issue debt in its own currency, and refinance continuously. This comparison explains scale and direction; it is not a prediction of household-style bankruptcy.</p>
        </div>

        <p class="debt-sources">
          Receipts, outlays, deficit, and interest: <a href="https://www.cbo.gov/publication/61307" target="_blank" rel="noopener noreferrer">Congressional Budget Office, FY2025</a>.
          Live debt: <a href="https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/debt-to-the-penny" target="_blank" rel="noopener noreferrer">U.S. Treasury, Debt to the Penny</a>.
        </p>
      </div>
    `;

    if (isLive) animateCounter(node.querySelector("[data-debt-counter]"), debt, dailyChange);
  }

  function metric(label, value, source, wide) {
    return `
      <article class="debt-metric${wide ? " debt-metric--danger" : ""}">
        <p>${label}</p>
        <strong>${value}</strong>
        <small>${source}</small>
      </article>
    `;
  }

  function animateCounter(counter, startingDebt, dailyChange) {
    if (!counter || !Number.isFinite(dailyChange) || dailyChange === 0) return;
    const started = Date.now();

    const update = function () {
      const elapsedSeconds = (Date.now() - started) / 1000;
      counter.textContent = debtValue(startingDebt + (dailyChange / 86400) * elapsedSeconds);
    };

    update();
    window.setInterval(update, 100);
  }

  function formatDate(value) {
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(date);
  }

  async function load(node) {
    node.innerHTML = '<div class="debt-widget debt-widget--loading" role="status">Counting the tab...</div>';

    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (!response.ok) throw new Error("Debt endpoint failed");
      const data = await response.json();
      if (!data.latest || !Number.isFinite(data.latest.value)) throw new Error("Debt data unavailable");
      renderShell(
        node,
        data.latest.value,
        data.latest.recordDate,
        Number(data.dailyChange) || 0,
        data.ok === true
      );
    } catch (error) {
      console.error(error);
      renderShell(node, 40e12, "", 0, false);
    }
  }

  document.querySelectorAll(selector).forEach(load);
})();
