WRAP DISTRICT — SITE-WIDE PROMO SYSTEM
======================================

Replace the files in this ZIP at the same paths in your repository.

FILES
-----
app.js
styles.css
home.js
menu-page.js
order-page.js
order.html
checkout.js
checkout.html
deals.html
admin.js
admin.css
netlify/functions/order-pricing.js

WHAT THE PROMO SYSTEM DOES
--------------------------
1. Admin can create a promo for any menu product.
2. Supported promo types:
   - Percentage discount
   - Fixed amount discount
   - Set promotional price
   - Buy X, get Y free
   - Free product/drink with purchase
   - Message-only product promotion
   - General website campaign
3. Start/end dates are required and shown to customers.
4. Only promos inside their scheduled date window become active.
5. A product promo appears across:
   - global website promo ribbon
   - homepage hero
   - homepage menu cards
   - menu page product card
   - product/order builder
   - cart
   - checkout
   - downloaded PDF receipt
   - order email summary
   - admin order details
   - Promo page
6. Buy-X-get-Y pricing is recalculated server-side before payment.
7. Free-item promos automatically add the selected gift to the cart.
8. Free promo items are recalculated server-side and cannot be charged.
9. Product promo cards show the offer and date range clearly.
10. The promo popup appears once per browser session for the active promo.

EXAMPLES
--------
Shawarma:
Offer type: Buy X, get Y free
Buy quantity: 2
Free quantity: 1

Loaded Fries:
Offer type: Free item with purchase
Buy quantity: 1
Free quantity: 1
Free item: Coca Cola (or any other product/drink selected by admin)

IMPORTANT
---------
Deploy the Netlify function change together with the frontend files.
The server-side pricing file is what prevents a customer from editing
promo totals in the browser before paying.

Existing EmailJS purchase templates already receive order_items. Promo
information is appended to those order item lines, so the customer/admin
email shows the applied promo without creating another EmailJS template.
