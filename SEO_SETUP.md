# Wrap District SEO launch setup

The repo is prepared for `https://wrapdistrict.food` with page titles, descriptions, canonical links, Open Graph metadata, a production sitemap, robots.txt and structured data on the homepage.

## Google Search Console

1. Open Google Search Console and add `wrapdistrict.food` as a Domain property.
2. Google will give you a DNS TXT verification record. Add that TXT record where the domain DNS is managed.
3. After verification, submit this sitemap: `https://wrapdistrict.food/sitemap.xml`.
4. Use URL Inspection for the homepage, menu, Feed the Street, gallery, team and contact pages and request indexing after the production deployment is live.
5. Do not add a made-up Google verification meta tag to this repo. Use the exact verification value Google gives you.

## Google Business Profile

If Wrap District serves customers from a physical pickup location or delivery area, create or complete the Google Business Profile. Keep the business name, phone, location/service area, opening hours and website URL consistent with the site.

## After launch

Check Search Console for indexing issues, Core Web Vitals and mobile usability. Keep menu descriptions useful and specific. When you replace placeholder images, use clear real photos and useful alt text. Compress large photos before upload so the site stays fast on mobile data.

The admin page is blocked from indexing through `robots.txt` and also includes a `noindex,nofollow` meta tag.
