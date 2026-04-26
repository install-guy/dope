const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('primary-menu');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('main section[id]');
const revealElements = document.querySelectorAll('.reveal');

// -------------------------------------------------
// Countdown settings
// -------------------------------------------------
const countdownTargetDate = '2029-01-22T12:00:00-05:00';
const countdownExpiredMessage = 'We are live.';

const countdownContainer = document.getElementById('countdown');
const countdownExpired = document.getElementById('countdown-expired');
const daysEl = document.getElementById('days');
const hoursEl = document.getElementById('hours');
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const truthFeed = document.getElementById('truth-feed');
const feedStatus = document.getElementById('feed-status');

// -------------------------------------------------
// Truth feed settings
// Supports JSON or XML/RSS
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

function truncateText(value, maxLength = 200) {
  const text = String(value || '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}…`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeJsonPosts(payload) {
  const rawPosts = Array.isArray(payload)
    ? payload
    : payload?.posts || payload?.items || [];

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

function normalizeXmlPosts(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'application/xml');

  const parseError = xml.querySelector('parsererror');
  if (parseError) {
    throw new Error('Unable to parse XML feed.');
  }

  const items = Array.from(xml.querySelectorAll('item, entry'));

  return items
    .map((item) => {
      const title =
        item.querySelector('title')?.textContent?.trim() || '';

      const description =
        item.querySelector('description')?.textContent?.trim() ||
        item.querySelector('content')?.textContent?.trim() ||
        item.querySelector('content\\:encoded')?.textContent?.trim() ||
        item.querySelector('summary')?.textContent?.trim() ||
        '';

      const linkNode = item.querySelector('link');
      const link =
        linkNode?.getAttribute('href') ||
        linkNode?.textContent?.trim() ||
        '';

      const date =
        item.querySelector('pubDate')?.textContent?.trim() ||
        item.querySelector('published')?.textContent?.trim() ||
        item.querySelector('updated')?.textContent?.trim() ||
        '';

      const content = description || title;

      return {
        date,
        content,
        link,
      };
    })
    .filter((post) => post.content)
    .slice(0, truthFeedMaxPosts);
}

function renderPosts(posts) {
  if (!truthFeed) return;

  if (posts.length === 0) {
    truthFeed.innerHTML = `
      <article class="feed-post">
        <p class="feed-date">No updates yet</p>
        <p>No feed posts were found. Keeping the feed area ready for future updates.</p>
      </article>
    `;

    if (feedStatus) {
      feedStatus.textContent = 'No feed posts found.';
    }
    return;
  }

  const markup = posts
    .map((post) => {
      const safeDate = escapeHtml(formatFeedDate(post.date));
      const safeContent = escapeHtml(truncateText(post.content, 250));
      const safeLink = post.link ? escapeHtml(post.link) : '';

      return `
        <article class="feed-post">
          <p class="feed-date">${safeDate}</p>
          <p>${safeContent}</p>
          ${safeLink ? `<a class="feed-link" href="${safeLink}" target="_blank" rel="noopener noreferrer">Read post</a>` : ''}
        </article>
      `;
    })
    .join('');

  truthFeed.innerHTML = markup;

  if (feedStatus) {
    feedStatus.textContent = `Showing latest ${posts.length} post${posts.length === 1 ? '' : 's'}. Auto-refreshes every 5 minutes.`;
  }
}

async function updateTruthFeed() {
  if (!truthFeed || !truthFeedUrl) {
    if (feedStatus) {
      feedStatus.textContent = 'Add your feed endpoint to data-feed-url in index.html to auto-populate latest posts.';
    }
    return;
  }

  try {
    if (feedStatus) {
      feedStatus.textContent = 'Loading latest updates…';
    }

    const response = await fetch(truthFeedUrl, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`Feed request failed (${response.status})`);
    }

    const payload = await response.json();
    const posts = normalizeJsonPosts(payload);

    renderPosts(posts);
  } catch (error) {
    if (feedStatus) {
      feedStatus.textContent = 'Feed refresh failed. Keeping existing feed content visible.';
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

async function loadWtfjhtFeed() {
  const feedPanel = document.querySelector("#wtfjht-feed");

  if (!feedPanel) {
    return;
  }

  try {
    const response = await fetch("/api/wtfjht");

    if (!response.ok) {
      throw new Error("Unable to load WTFJHT feed");
    }

    const data = await response.json();
    const items = Array.isArray(data.items) ? data.items : [];

    if (!items.length) {
      feedPanel.innerHTML = `
        <article class="feed-post">
          <p>No approved updates yet.</p>
        </article>
      `;
      return;
    }

    feedPanel.innerHTML = items
      .map((item) => {
        const date = item.date
          ? new Date(item.date).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric"
            })
          : "";

        return `
          <article class="feed-post">
            ${date ? `<p class="feed-date">${date}</p>` : ""}
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <a class="feed-link" href="${item.url}" target="_blank" rel="noopener">
              Read the full post
            </a>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    feedPanel.innerHTML = `
      <article class="feed-post">
        <p>WTFJHT feed unavailable right now.</p>
      </article>
    `;
  }
}

loadWtfjhtFeed();