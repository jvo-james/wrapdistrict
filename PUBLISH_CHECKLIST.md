# Wrap District — Publish Checklist

This repo now includes the production payment/recovery/admin changes. Complete these service-side steps before taking live orders.

## 1. Netlify environment variables

Add these in **Netlify → Site configuration → Environment variables**:

- `PAYSTACK_SECRET_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Do not place any of those secret values in browser files.

## 2. Paystack webhook

After the site is deployed, add this webhook in the correct Paystack mode (Test or Live):

`https://wrapdistrict.food/.netlify/functions/paystack-webhook`

Opening that URL in a normal browser should return **Method Not Allowed**. That is expected because Paystack sends a POST request.

## 3. Firebase rules

Deploy the included `firestore.rules`. The new rules cover pending orders, abandoned carts, notifications, activity, customers and payment-reference deduplication.

## 4. Firebase admin authorization

The business admin must have:

- an Email/Password Firebase Authentication user; and
- an `admins/{uid}` Firestore document using that Authentication UID.

District Control now uses the UID document as the authoritative permission, so the admin can change her own login email later without losing access.

## 5. Persistent admin login

Firebase Auth is configured with LOCAL persistence. The admin stays signed in after closing/reopening the browser until she explicitly clicks **Sign out**.

## 6. Test before Live Mode

In Paystack Test Mode, verify one order from start to finish:

1. Fill checkout details.
2. Click Pay and confirm a Firestore `orders` document appears immediately with `payment: Pending` and `status: Awaiting Payment`.
3. Complete test payment.
4. Confirm the same order becomes `payment: Paid`, has a Paystack reference and `serverVerified: true`.
5. Confirm `paymentReferences`, `customers`, `notifications` and `activity` receive records.
6. Confirm its abandoned cart is marked `recovered`.
7. Confirm District Control shows the order under **Paid orders**, not **Pending payments**.

Also test a cancelled payment and confirm it remains recoverable under **Pending payments / Abandoned carts**.

## 7. Feed the Street donations

The Paystack webhook also understands `donation_id` metadata. A successful donation can therefore be written server-to-server even if the donor closes the browser immediately after payment.

## 8. EmailJS / Cloudinary / public keys

Fill the remaining `YOUR_...` values in `config.js` for:

- Paystack public key
- EmailJS public key/service/templates

Cloudinary is already configured in the supplied repo. Keep secret keys out of `config.js`.
