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
const truthFeed = document.getElementById('truth-feed');
const feedStatus = document.getElementById('feed-status');

// -------------------------------------------------
// Truth feed settings (single obvious edit location)
// Paste your JSON feed endpoint URL below.
// Expected shape:
// 1) [{ date, content, link? }, ...]
// or
// 2) { posts: [{ date, content, link? }, ...] }
// -------------------------------------------------
const truthFeedUrl = truthFeed?.dataset.feedUrl || '';
const truthFeedRefreshMs = 5 * 60 * 1000;
const truthFeedMaxPosts = 10;

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

function formatFeedDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent update';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function normalizePosts(payload) {
  const rawPosts = Array.isArray(payload) ? payload : payload?.posts || payload?.items || [];

  return rawPosts
    .map((post) => ({
      date: post.date || post.publishedAt || post.published_at || post.created_at || post.createdAt,
      content: post.content || post.text || post.body || post.message,
      link: post.link || post.url || post.permalink,
    }))
    .filter((post) => post.content)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, truthFeedMaxPosts);
}

function renderPosts(posts) {
  if (!truthFeed) return;

  if (posts.length === 0) {
    if (feedStatus) {
      feedStatus.textContent = 'No feed posts found yet. Showing starter placeholders.';
    }
    return;
  }

  const markup = posts
    .map(
      (post) => `
      <article class="feed-post">
        <p class="feed-date">${formatFeedDate(post.date)}</p>
        <p>${post.content}</p>
        ${post.link ? `<a class="feed-link" href="${post.link}" target="_blank" rel="noopener noreferrer">Read post</a>` : ''}
      </article>
    `
    )
    .join('');

  truthFeed.innerHTML = markup;

  if (feedStatus) {
    feedStatus.textContent = `Showing latest ${posts.length} post${posts.length === 1 ? '' : 's'}. Auto-refreshes every 5 minutes.`;
  }
}

async function updateTruthFeed() {
  if (!truthFeed || !truthFeedUrl) {
    if (feedStatus) {
      feedStatus.textContent =
        'Add your feed endpoint to data-feed-url in index.html to auto-populate latest 10 posts.';
    }
    return;
  }

  try {
    const response = await fetch(truthFeedUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Feed request failed (${response.status})`);
    }

    const payload = await response.json();
    const posts = normalizePosts(payload);
    renderPosts(posts);
  } catch (error) {
    if (feedStatus) {
      feedStatus.textContent = 'Feed refresh failed. Keeping existing posts visible.';
    }
    console.error(error);
  }
}

updateTruthFeed();
if (truthFeed && truthFeedUrl) {
  setInterval(updateTruthFeed, truthFeedRefreshMs);
}

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