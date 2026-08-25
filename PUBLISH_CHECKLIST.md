# Wrap District — Final Launch Checklist

The storefront, admin, reviews, promotions, order preparation, payment verification, donations and EmailJS routing are wired in this repo. Before accepting real money, complete the owner-only service settings below.

## 1. Switch Paystack to Live Mode

`config.js` currently contains a **Paystack test public key** (`pk_test_...`). Replace it with the business's **live public key** when you are ready to launch.

In Netlify → Site configuration → Environment variables, set the matching **live** secret key as:

- `PAYSTACK_SECRET_KEY`

Never put the Paystack secret key in `config.js` or any browser file.

## 2. Firebase Admin environment variables

Add these to Netlify as server-side environment variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

The secure order preparation, chronological order IDs, payment verification, webhook handling and donation verification depend on these values.

## 3. Paystack webhook

In the same Paystack mode you are using for the site, set the webhook URL to:

`https://wrapdistrict.food/.netlify/functions/paystack-webhook`

A normal browser visit to that address should return **Method Not Allowed**. That is expected because Paystack sends a signed POST request.

## 4. Deploy Firebase rules

Deploy the included `firestore.rules` before launch. Browser code is not allowed to create paid orders directly; orders are prepared by the secure Netlify function and payment amounts are verified server-side.

## 5. Admin access

The business admin needs:

- an Email/Password Firebase Authentication user; and
- an `admins/{uid}` Firestore document using that user's Authentication UID.

## 6. Replace business placeholders

Before publishing, confirm the real values in `config.js` for:

- `businessEmail`
- `whatsapp`
- Instagram, TikTok, Snapchat, X and Facebook links

The supplied repo still contains placeholder social links and a placeholder WhatsApp number. They cannot be safely guessed by the code.

## 7. EmailJS

The repo uses the two-template plan as requested:

- **Customer template:** purchases, subscriptions, contact messages, feedback/reviews and donations
- **Admin template:** purchases and donations only

Make sure both EmailJS templates accept the variables used by those flows and that the configured service is allowed to send from the deployed domain.

## 8. Final payment tests

Before switching customers to Live Mode, complete these tests in Paystack Test Mode:

1. Place a normal food order and confirm a `WD-00001`-style order is created as **Pending** before Paystack opens.
2. Complete payment and confirm the same order becomes **Paid**, includes the Paystack reference and appears under Paid orders / Transactions / Sales analytics.
3. Cancel a payment and confirm the pending order remains visible for follow-up.
4. Activate each promotion type (discount, set price, Buy X Get Y, Free Item) and confirm the homepage/menu display and the server-calculated checkout total agree.
5. Mark a menu item unavailable: it should disappear from the homepage but remain visible as **Unavailable today** on the Menu page.
6. Submit a review and confirm it remains hidden publicly until approved in District Control.
7. Submit the contact form and newsletter form and confirm their loading/success states and EmailJS messages.
8. Complete a Feed the Street test donation and confirm payment verification, the success modal and automatic thank-you-card download.
9. Complete an order and confirm the confirmation modal and automatic receipt download.

## 9. Images and content

District Control can update menu, portion, extra, homepage, gallery and team images. Where no dedicated portion/extra image exists, the site deliberately uses the product image for portions and `images/placeholder-food.svg` for extras rather than showing an unrelated food image.
