(function () {
  const voteCards = document.querySelectorAll(".vote-card");
  const baseUrl = "https://vote.gov/register";

  if (!voteCards.length) {
    return;
  }

  voteCards.forEach((card) => {
    const stateSelect = card.querySelector(".vote-select");
    const registerLink = card.querySelector(".vote-cta");

    if (!stateSelect || !registerLink) {
      return;
    }

    stateSelect.addEventListener("change", () => {
      const slug = stateSelect.value;
      const selectedName = stateSelect.options[stateSelect.selectedIndex]?.text || "your state";

      registerLink.href = slug ? `${baseUrl}/${slug}` : baseUrl;
      registerLink.textContent = slug ? `Register in ${selectedName}` : "Register to vote";
    });
  });
})();
