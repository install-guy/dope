# One-Page Website Starter

A clean, responsive one-page marketing site built with semantic HTML, CSS variables, and minimal vanilla JavaScript.

## File structure

- `index.html` – page layout, semantic sections, sticky navigation, hero, content sections, and footer.
- `styles.css` – design system tokens (CSS variables), reset, responsive layout, and component styles.
- `script.js` – mobile menu toggle, active section highlighting, reveal-on-scroll, and footer year.
- `site/README.md` – existing repository file (left unchanged).

## Where to replace logo, image, and text

In `index.html`:

1. **Logo placeholder**
   - Find the `<a class="logo">` image near the top navigation.
   - Replace its `src` and `alt` with your real logo asset.

2. **Hero image + overlay content**
   - Find `<section class="hero">`.
   - Replace `img.hero-image` source URL and alt text.
   - Update hero kicker, headline, paragraph, and CTA button text/link.

3. **Section content**
   - Edit text in `#about`, `#services`, `#gallery`, and `#contact`.
   - For the gallery, swap placeholder image URLs for real images.

## How section anchors work

- Navigation links use same-page IDs (example: `href="#services"`).
- Matching sections use `id="services"`, etc.
- Sticky nav is handled with:
  - CSS: `position: sticky` on `.top-nav`
  - CSS: `scroll-margin-top` on `.content-section` so anchor jumps do not hide headings behind the nav.
- Smooth scrolling is enabled on `html { scroll-behavior: smooth; }` and automatically reduced for users who prefer reduced motion.

## How to customize breakpoints, colors, and fonts

All key design tokens are in `:root` in `styles.css`:

- **Colors**: `--color-*`
- **Spacing scale**: `--space-*`
- **Font sizes**: `--font-size-*`
- **Radius + container**: `--radius-*`, `--container-max`
- **Breakpoint reference tokens**: `--bp-mobile`, `--bp-tablet`, `--bp-desktop`

To customize quickly:

1. Change brand color by updating `--color-primary` and `--color-primary-dark`.
2. Change typography by editing `--font-family-base`.
3. Adjust section density by tuning `--space-*` variables.
4. Update responsive behavior in media queries near the bottom of `styles.css`.

## Notes

- JavaScript is intentionally lightweight and easy to remove.
- Reveal animation can be disabled by removing `.reveal` classes in `index.html` and the related CSS/JS blocks.
- The template is static and production-friendly as a starter for most simple landing pages.