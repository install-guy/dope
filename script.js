const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('primary-menu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main section[id]');
const revealElements = document.querySelectorAll('.reveal');

// -------------------------------------------------
// Countdown settings (single obvious edit location)
// Update this date/time for your launch or event.
// Format example: YYYY-MM-DDTHH:mm:ss (local time)
// -------------------------------------------------
const countdownTargetDate = '2026-07-01T09:00:00';

// Message shown once countdown reaches zero.
const countdownExpiredMessage = 'The next phase has begun.';

const countdownContainer = document.getElementById('countdown');
const countdownExpired = document.getElementById('countdown-expired');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navToggle.setAttribute('aria-label', expanded ? 'Open menu' : 'Close menu');
    navMenu.classList.toggle('open');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

if (sections.length > 0 && navLinks.length > 0) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute('id');

        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      });
    },
    {
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0,
    }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

function startCountdown() {
  if (!countdownContainer || !countdownExpired) return;

  const target = new Date(countdownTargetDate).getTime();

  if (Number.isNaN(target)) {
    countdownExpired.hidden = false;
    countdownExpired.textContent = 'Invalid countdown date. Update countdownTargetDate in script.js.';
    return;
  }

  function updateCountdown() {
    const distance = target - Date.now();

    if (distance <= 0) {
      countdownContainer.hidden = true;
      countdownExpired.hidden = false;
      countdownExpired.textContent = countdownExpiredMessage;
      clearInterval(timer);
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((distance / (1000 * 60)) % 60);
    const seconds = Math.floor((distance / 1000) % 60);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  const timer = setInterval(updateCountdown, 1000);
}

startCountdown();

if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('visible'));
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
