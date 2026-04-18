# Momentum Landing Page Starter (Campaign-Style, Non-Political)

A bold, action-oriented one-page starter for launches, initiatives, events, movements, or brand messages.
Built with semantic HTML, CSS custom properties, and lightweight vanilla JavaScript.

## File structure

- `index.html` – sticky nav, countdown bar, hero, Why It Matters, Priorities, Updates/Truth Social placeholder, Get Involved, and Footer.
- `styles.css` – design tokens, reset/base styles, responsive layouts, section rhythm, buttons, feed cards, and footer styles.
- `script.js` – mobile nav toggle, active section highlighting, countdown logic, reveal-on-scroll (reduced-motion aware), and footer year.

## Replace logo and hero image

In `index.html`:

1. **Logo**
   - Find the `<a class="logo">` image near the top navigation.
   - Replace the placeholder image URL and alt text.

2. **Hero image**
   - Find `<img class="hero-image">` inside the hero section.
   - Replace `src` with your own asset and update alt text.

## Edit countdown target date

In `script.js` near the top:

```js
const countdownTargetDate = '2026-07-01T09:00:00';
const countdownExpiredMessage = 'The next phase has begun.';
Change countdownTargetDate to your launch/event time.

Keep format YYYY-MM-DDTHH:mm:ss.

Change countdownExpiredMessage for your preferred post-countdown text.

How section anchors work
Navigation links point to same-page section IDs.

Example: href="#priorities" matches id="priorities".

Sticky nav stays visible while scrolling.

Each section uses scroll-margin-top so anchor jumps do not hide headings behind the sticky nav.

Update colors, fonts, spacing
In styles.css, edit :root variables:

colors (--color-*)

spacing (--space-*)

type scale (--font-size-*)

radius (--radius-*)

shadows (--shadow-*)

max content width (--container-max)

Truth Social placeholder/feed section setup
The #updates section is intentionally feed-ready but currently static:

Uses styled placeholder update cards (.feed-post).

Does not claim an official full timeline embed.

Can be swapped later without rebuilding the full page.

Perpetual auto-feed (latest 10 posts)
The page now supports automatic feed population and refresh in script.js.

In index.html, set your endpoint on the feed panel:

<div class="feed-panel" id="truth-feed" data-feed-url="https://your-feed-endpoint.example/posts.json">
script.js will fetch and render the latest 10 posts on load.

It refreshes automatically every 5 minutes (perpetual polling while page is open).

Expected JSON shape:

[
  { "date": "2026-04-18T12:00:00Z", "content": "Post text", "link": "https://example.com/post-1" }
]
or:

{
  "posts": [
    { "date": "2026-04-18T12:00:00Z", "content": "Post text", "link": "https://example.com/post-1" }
  ]
}
Update placeholder feed cards
In index.html, edit the cards inside .feed-panel:

.feed-date

post text

optional .feed-link

Optional official Truth Social follow button
A commented block is provided in the Updates section:

<div data-truth-social-follow-button data-username="USERNAME"></div>
<script async src="https://embed.truthsocial.com/embed.js"></script>
To enable:

Uncomment the block.

Replace USERNAME with your account.

Future dynamic feed options
You can later replace placeholder cards using:

Manual CMS-managed updates.

RSS-to-JSON pipeline rendered client-side.

Server-side proxy/custom API integration.

Approved third-party social aggregation tools.

Notes
This template is intentionally bold and urgent in tone, but generic/non-partisan.

Keep major section comments in index.html so non-developers can edit safely.

All core behavior is plain HTML/CSS/JS to keep maintenance simple.

