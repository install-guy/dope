(function () {
  const stateSelect = document.getElementById("vote-state");
  const registerLink = document.getElementById("vote-register-link");
  const baseUrl = "https://vote.gov/register";

  if (!stateSelect || !registerLink) {
    return;
  }

  stateSelect.addEventListener("change", () => {
    const slug = stateSelect.value;
    const selectedName = stateSelect.options[stateSelect.selectedIndex]?.text || "your state";

    registerLink.href = slug ? `${baseUrl}/${slug}` : baseUrl;
    registerLink.textContent = slug ? `Register in ${selectedName}` : "Register to vote";
  });
})();
