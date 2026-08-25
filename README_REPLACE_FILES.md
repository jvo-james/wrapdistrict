# Wrap District update pack

Replace the matching files in your repo with the files in this ZIP. Keep the folder structure for `netlify/functions/order-pricing.js`.

## Files changed
- `admin.html` — simplified desktop header, Drinks control, subscriber email composer, team add controls.
- `admin.css` — narrower desktop sidebar, smaller/rebalanced typography, cleaner panels, subscriber composer, drink controls, structured order drawer.
- `admin.js` — drink availability, tabulated order details, add/remove/reorder team members, subscriber bulk email sending.
- `data.js` — four drink products and team ordering metadata.
- `order-page.js` — optional drink chooser under every food; drink is added as its own cart item.
- `styles.css` — responsive drink selector: 4 across on desktop, 2×2 on mobile.
- `team-page.js` — dynamic team list; founder fixed first; added/removed members are respected.
- `netlify/functions/order-pricing.js` — server-side validation/pricing for the four drinks.

## Drink images
Put these files in your existing `images/` folder:
- `images/coke.jpg`
- `images/fanta.jpg`
- `images/sprite.jpg`
- `images/water.jpg`

If your Fanta image is literally named `fanta.jp`, rename it to `fanta.jpg`.

## Important: one EmailJS template edit for subscriber broadcasts
The admin bulk-email feature intentionally reuses your existing customer template `template_z5l8xns`.

1. In EmailJS, open `template_z5l8xns`.
2. Add the contents of `EMAILJS_BULK_TEMPLATE_UPDATE.html` near the top of the email body, before the normal subscription/welcome section.
3. Add the line from `EMAILJS_BULK_SUBJECT.txt` FIRST in the template Subject field, before the conditional subjects you already have.

The admin page then sends these variables per subscriber:
- `customer_email`
- `broadcast_subject`
- `broadcast_body`
- `event_type = broadcast`

The code sends one individual email at a time with a small delay, rather than exposing the full subscriber list to recipients. EmailJS plan/rate limits still apply.

## Admin changes
On desktop the top header now contains only:
- current page/tab name
- notification bell
- open-website arrow

Sync state and the Orders open/paused switch live in the sidebar footer instead. Mobile still keeps the hamburger/close controls because they are needed on small screens.

## Team behaviour
- Founder (`t1`) is permanent, fixed at position 1, and cannot be deleted.
- Other members can be added, removed, and assigned a numeric position.
- Deleted default members use a saved tombstone so they do not reappear after refresh.

## Drinks behaviour
- Drinks only appear inside food order builders, not on the main menu grid.
- The admin can turn each drink Available/Hidden in Store → Drinks.
- Hidden drinks disappear from every food builder.
- Selected drinks become independent cart/order/checkout/receipt items.
- Secure Netlify pricing validates drink prices and availability server-side.
