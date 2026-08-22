# Wrap District — Website + District Control

This version uses:

- **Firebase Authentication** for admin sign-in.
- **Cloud Firestore** for shared site data (products, promos, hero slides, reviews, gallery, team, orders, donations, contact messages and subscribers).
- **Cloudinary** for admin image uploads. Firebase Storage is intentionally not used.
- **Paystack InlineJS v2** for checkout and Feed the Street donations.
- **EmailJS** with exactly **two templates**: one customer template and one admin template.
- **jsPDF** in the browser to generate the Feed the Street thank-you PDF card.
- `images.js` as the single place for every default/static image used by the site.

## 1. Edit `config.js`

The Firebase web configuration for `wrapdistrict-gh` is already included.

Fill these placeholders:

```js
adminEmails: ['your-admin@email.com'],

cloudinary: {
  cloudName: 'YOUR_CLOUDINARY_CLOUD_NAME',
  uploadPreset: 'YOUR_UNSIGNED_UPLOAD_PRESET',
  folder: 'wrapdistrict'
},

emailjs: {
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templates: {
    customer: 'YOUR_CUSTOMER_TEMPLATE_ID',
    admin: 'YOUR_ADMIN_TEMPLATE_ID'
  }
},

paystackPublicKey: 'YOUR_PAYSTACK_PUBLIC_KEY'
```

Do **not** put a Cloudinary API secret, Paystack secret key, Firebase service-account key or EmailJS private key in browser files.

## 2. Firebase setup

### Enable Firestore

Firebase Console → Build → Firestore Database → Create database.

Deploy/copy the rules from `firestore.rules` into the Firestore Rules tab and publish them.

### Enable admin authentication

Firebase Console → Build → Authentication → Sign-in method → enable **Email/Password**.

Create the admin user in Authentication → Users.

Copy that user's **UID**.

In Firestore create:

```text
collection: admins
document ID: <THE FIREBASE AUTH UID>
```

The document can contain something simple such as:

```json
{
  "role": "owner",
  "email": "your-admin@email.com"
}
```

Then put the same email address inside `adminEmails` in `config.js`.

The security rules use the existence of `/admins/{uid}` to authorize admin writes. The email allowlist is an additional client-side dashboard gate.

### Seed the initial content

Open `admin.html`, sign in, open **Settings**, then click **Seed defaults to Firestore** once.

This copies the default products, promos, hero slides, reviews, Feed the Street gallery and team data into Firestore. After that, the admin dashboard controls the shared cloud copy.

## 3. Cloudinary setup

Cloudinary Console → Settings → Upload → Upload presets → create a preset.

Recommended preset:

- Signing mode: **Unsigned**
- Asset folder: `wrapdistrict`
- Allowed formats: `jpg,jpeg,png,webp,avif`
- Maximum file size: about 8 MB (or less)
- Use unique filenames
- Disallow custom public IDs if you do not need them

Copy the **Cloud name** and **unsigned upload preset name** into `config.js`.

The admin dashboard uploads directly to Cloudinary and stores each returned `secure_url` in Firestore.

Cloudinary folders used by the dashboard include:

```text
wrapdistrict/products
wrapdistrict/promos
wrapdistrict/hero
wrapdistrict/feed-gallery
wrapdistrict/team
```

## 4. All default images are in `images.js`

`images.js` is now the image map for the entire static/default site. Every image has a comment explaining what it controls.

Examples:

```js
homeHeroShawarma: 'images/hero1.jpg', // Home hero slide
menuHero: '...',                      // Menu page hero
contactPhoto: '...',                  // Contact page food photo
feedGallery01: 'images/p1.jpeg',      // Feed gallery image 01
teamFounder: '...',                   // Founder profile image
```

Changing one of these values changes the matching default image without hunting through HTML/CSS/JS files.

Images uploaded later through District Control are cloud data and therefore live in Cloudinary + Firestore rather than `images.js`.

## 5. EmailJS — only two templates

Create exactly two EmailJS templates.

### Customer template

Use one flexible customer template for:

- `purchase`
- `feedback`
- `subscription`
- `donation`
- `contact`

The code always sends an `event_type` variable, plus the variables relevant to that event. Build conditional/general wording in your EmailJS template around the values you want to display.

Common variables include:

```text
{{event_type}}
{{customer_name}}
{{customer_email}}
{{customer_phone}}
{{order_id}}
{{order_items}}
{{order_total}}
{{payment_reference}}
{{donation_id}}
{{donor_name}}
{{donor_email}}
{{amount}}
{{topic}}
{{message}}
{{subscriber_email}}
{{review_text}}
{{rating}}
```

### Admin template

The admin template is sent only for:

- purchases
- donations
- contact messages

It receives the same event-specific variables plus:

```text
{{recipient_type}} = admin
{{business_email}}
{{site_name}}
```

Set the admin template's recipient address inside EmailJS to the business/admin email you want to receive notifications.

## 6. Paystack

Add your **public key** in `config.js`.

Checkout uses Paystack InlineJS v2 and sends the amount in pesewas (`GHS × 100`). The normal checkout still displays the site's current processing fee.

Feed the Street donations do **not** add a site processing fee: if a donor enters `100`, the Paystack transaction amount sent by the website is exactly `GHS 100.00`.

After a successful donation the site:

1. records the donation,
2. sends the EmailJS notification(s),
3. opens the designed thank-you modal,
4. lets the donor download an A5 PDF gratitude card.

### Important production verification note

Paystack's browser `onSuccess` callback drives the user experience, but authoritative payment verification must be done server-side using Paystack's **secret key** and the transaction reference. Never put the secret key in `config.js` or any frontend file.

If you later add a backend (Vercel/Netlify/Cloudflare/server), verify the Paystack transaction there before treating a payment as financially reconciled in your back office.

## 7. District Control features

`admin.html` now includes responsive controls for:

- overview metrics
- order status management
- products + availability + Cloudinary uploads
- promotions
- home hero slides
- review approval/moderation
- Feed the Street gallery uploads
- donations
- team members and per-person social platforms
- contact messages
- newsletter subscribers
- public business/social settings
- service configuration status
- initial Firestore seeding

On mobile the sidebar becomes an off-canvas navigation panel and the cards/forms collapse cleanly.

## 8. Firebase Storage

Firebase Storage is not required by this version. `storage.rules` intentionally denies all Firebase Storage access so the architecture is unambiguous: **Cloudinary is the media store**.

## 9. Run locally

Because Firebase/Auth and browser APIs behave best over HTTP rather than `file://`, run a local server from the repo directory, for example:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

and the admin dashboard at:

```text
http://localhost:8080/admin.html
```

## 10. Before launch

- Add your admin email to `config.js`.
- Create the Firebase Auth admin user and `/admins/{uid}` document.
- Publish `firestore.rules`.
- Add Cloudinary cloud name + unsigned preset.
- Add EmailJS public key, service ID, customer template ID and admin template ID.
- Add Paystack public key.
- Seed defaults to Firestore once.
- Test one checkout in Paystack test mode.
- Test one Feed the Street donation in Paystack test mode.
- Test purchase, donation, contact, feedback and subscription emails.
- Replace any placeholder social links/details.
- When taking real money, add server-side Paystack verification.
