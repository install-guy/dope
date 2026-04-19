# DOPE Site

A one-page campaign-style website being developed for the DOPE initiative.

This project is currently in active build/refinement. The core structure is in place, key brand assets are live, and selected sections are partially populated, but several areas still use placeholder content while messaging, styling, and integrations are being finalized.

## Current project status

### Live / real assets in place
- published logo in header
- published hero/header image
- site structure and navigation
- countdown bar
- hero layout
- Why It Matters content section

### In progress
- hero headline/body copy
- hero CTA copy and destination strategy
- Why It Matters styling polish
- feed/XML integration fix

### Still placeholder
- Priorities section and 4 cards
- much of the remaining site content
- contact / call-to-action details
- footer details as needed

## File structure

- `index.html`  
  Main page structure including header, countdown, hero, Why It Matters, Priorities, feed section, CTA area, and footer.

- `styles.css`  
  Global styles, layout, color variables, button treatments, card styles, feed panel styles, responsive behavior, and section presentation.

- `script.js`  
  Handles mobile navigation, active section highlighting, countdown logic, reveal-on-scroll behavior, footer year, and feed loading logic.

## Section-by-section status

### Header / Navigation
The header and navigation are in place and functioning.  
The logo is no longer a placeholder asset.

### Countdown Bar
The countdown is active and controlled through `script.js`.

Current settings:

    const countdownTargetDate = '2029-01-22T12:00:00-05:00';
    const countdownExpiredMessage = 'We are live.';

### Hero
The hero layout is live and using the published image asset.  
Current messaging is considered working draft content and is still being tightened up.

Areas still being refined:
- headline
- supporting paragraph copy
- CTA language
- CTA strategy / destination

### Why It Matters
This section contains actual site messaging and is not placeholder copy.

Current focus here is visual/styling refinement, including:
- hierarchy
- spacing
- emphasis treatment
- overall polish

### Priorities
The Priorities section is currently placeholder content.

The existing 4-card layout is structural only and should be treated as temporary until final content is written.

### Feed / Updates
The feed section is intended to use an XML source URL, but it is not currently working as expected.

Current status:
- structure is in place
- URL is assigned
- JavaScript attempts to support XML/RSS feed loading
- feed output is not yet functioning properly in the current implementation

This should be treated as an active integration issue, not a completed feature.

### CTA / Get Involved
This section is still placeholder and will need final content, actions, and contact details once the site direction is further locked in.

### Footer
Footer structure is present, but supporting content may still need final updates depending on launch needs.

## Brand and messaging notes

The site is being built around the DOPE framework:

- Dare
- Overcome
- Persist
- Elevate

This language is currently most visible in:
- hero messaging
- Why It Matters section

Messaging is still being tuned for tone, clarity, and strength.

## Known issues / open items

- hero copy needs refinement
- hero CTA needs refinement
- Why It Matters styling needs polish
- Priorities content is placeholder
- XML feed is not currently working
- remaining site sections still need content replacement
- README should continue to be updated as the site moves from structure to finalized content

## Local development

This is a static HTML / CSS / JavaScript project.

To run locally with a lightweight server:

    python -m http.server 8000

Then open:

    http://localhost:8000

## Recommended next steps

1. finalize hero message direction
2. tighten hero CTA copy and link behavior
3. polish Why It Matters styling
4. replace Priorities placeholder content
5. debug and fix XML feed integration
6. replace remaining placeholder sections
7. update README again once content status changes

## Notes

This README reflects the site as a work in progress, not a finished launch-ready build.