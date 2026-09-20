# Freshlane — Web Analytics Project

An original Blinkit-style grocery prototype by Harsh Mhatre. All products, prices, addresses, delivery estimates and orders are illustrative. No real payment, delivery, login or inventory service is provided.

## What works

- 24 products across eight grocery categories, responsive layouts and original locally hosted SVG illustrations.
- Debounced search, category filters, price/discount sorting, product details, quantity controls (maximum 20 per product) and a persistent browser basket.
- FRESH10 coupon: 10% off items, capped at ₹75. Standard demo delivery: ₹25 below ₹199 subtotal, free from ₹199; priority: ₹35. Delivery threshold uses pre-coupon subtotal. No additional tax is charged in this demo.
- Sample address selection → delivery selection → simulated payment → review → demo order confirmation and JSON receipt.
- Analytics Lab: local KPIs, an ordered session funnel, basket favourites, event payload inspection, three related CSV exports and raw JSON.
- A new-session control preserves the basket and starts a fresh demo session. Reset requires a second in-app confirmation and clears basket, coupon and local event data.

## Data boundaries

No GTM container or Google Analytics script is loaded. No external analytics account is connected. The site hosts its own scripts, artwork and styles. No product-page third-party network requests are required.

Events are written to `window.dataLayer` and browser localStorage. `demo_mode: true` labels all events. Only the latest 3,000 events are retained. Browser clearing, private browsing or unavailable storage can remove data. Export frequently. This is a browser-scoped project dataset, not a shared server database or a complete historical analytics warehouse.

Session IDs are random UUIDs stored in sessionStorage and survive refreshes in a tab. New demo session creates a new ID. This explicit tab-session definition is for the local demo; it is not GA4's own session calculation. Opening a duplicated tab can inherit sessionStorage, so use New demo session for an independent test journey.

No personal address, name, email, phone, card data, GPS, referrer or URL query string is tracked. Address and payment choices are fixed samples. Search values are only retained if every space-separated word belongs to the grocery catalog vocabulary; otherwise `search_term` is `[unmatched query]`. Search result count is still recorded. Raw unrecognised search text is displayed in the UI but not persisted or tracked.

All original art and packaging are Freshlane assets. Freshlane is a student demo brand, unaffiliated with Blinkit. Static private hosting is enforced by Sites access controls, not by robots directives.

## Event dictionary

Every event includes `event_id`, UTC ISO `timestamp`, random `session_id`, `page_path` and `demo_mode`.

| Action | Event name | Main parameters |
|---|---|---|
| Start tab / new demo session | session_start | session_id |
| Page load / new demo session | page_view | page_title, page_path |
| At least 50% of cards enter viewport | view_item_list | ecommerce.items, item_list_id, item_list_name |
| Open product details | select_item, then view_item | ecommerce.items, currency, value, list context |
| Submit/debounce a nonempty search | search | search_term (sanitised), result_count |
| Choose category | select_category | category |
| Choose filter | filter_products | filter_type |
| Change sort | sort_products | sort_order |
| Choose sample delivery area | select_delivery_area | delivery_area |
| Add one unit | add_to_cart | ecommerce.items (changed units), value, currency, interaction_source |
| Decrease or remove units | remove_from_cart | ecommerce.items (removed units), value, currency |
| Open cart | view_cart | ecommerce.items (entire cart), value, coupon |
| Enter checkout | begin_checkout | ecommerce.items, value, coupon |
| Continue after delivery choice | add_shipping_info | ecommerce.shipping_tier, items, value; address_type |
| Continue after demo payment choice | add_payment_info | ecommerce.payment_type, items, value |
| Place demo order | purchase | transaction_id, currency, value, shipping, tax, coupon, items, order_total |
| Offer enters viewport / is clicked | view_promotion / select_promotion | promotion_id, promotion_name, creative_slot |
| Apply / remove promo | apply_coupon / remove_coupon | coupon, discount_value when applied |
| Invalid code | coupon_error | error_type (no raw entered code) |

Product impressions are generated on visibility, not each quantity change. A new catalog/filter render creates a new impression opportunity. Search logs once per changed, nonempty input after 450 ms or form submit. A completed purchase empties the basket; refresh, return clicks and repeated confirmation clicks do not create another purchase. Editing the basket returns an active checkout to its basket stage.

`ecommerce.value` is merchandise value after coupon discounts, excluding shipping and tax. Purchase `order_total` = `value + shipping + tax`. INR values are numbers, never currency-formatted strings. Add/remove actions represent the changed quantity at the catalog unit price; cart/checkout/purchase events represent the full basket with an applied coupon. Displayed catalog markdowns compare illustrative MRP with current selling price; `items.discount` represents only the additional coupon allocation.

Discounts are allocated in whole paise across units. If rounding creates two unit prices for the same SKU, the export contains two item lines. Sum `price × quantity`; do not assume one line per product. Full UUID transaction IDs begin `DEMO-`; the confirmation screen uses a shortened display ID. Raw JSON preserves the full ID.

Before each event, `dataLayer.push({ ecommerce: null })` clears stale ecommerce fields. The following record contains `event` and the current payload. This allows later GTM Custom Event triggers.

## Power BI / Tableau model

Download `freshlane_events.csv`, `freshlane_items.csv` and `freshlane_products.csv` from Analytics Lab → Export data. Import UTF-8 CSVs. Treat IDs as text; quantities as whole numbers; prices, discount and value as decimal numbers; timestamps as UTC datetimes. An `event_date` UTC date is already present for events.

| File | Grain | Key / relationship |
|---|---|---|
| events | One row per interaction | event_id unique → items.event_id (one-to-many) |
| items | One product-price line per ecommerce event | Composite event_id + line_index; item_id → products.item_id |
| products | One row per SKU | item_id unique |

Use single-direction dimension-to-fact relationships for `products → items` and `events → items`. Avoid summing event revenue on a flattened event/items join: it duplicates event values. Filter purchase rows for sales and use the items table for product/category revenue. Nonpurchase events also have monetary values; those are not sales.

Recommended first dashboard:

| Visual | Definition |
|---|---|
| Demo sessions | Distinct events.session_id |
| Demo orders | Distinct nonblank events.transaction_id where event_name = purchase |
| Demo item revenue | Sum events.value where event_name = purchase |
| Average order value | Demo item revenue / demo orders, with zero-safe division |
| Conversion rate | Distinct sessions with purchase / all distinct sessions |
| Add-to-cart rate | Distinct sessions with add_to_cart / sessions with view_item_list |
| Category / product revenue | Sum items.line_value where event_name = purchase, grouped by category / SKU |
| Units purchased | Sum items.quantity where event_name = purchase |
| Search no-result rate | Search events with result_count = 0 / all search events |
| Coupon usage | Demo purchase events with FRESH10 / all demo purchase events |
| Delivery preferences | Distinct purchases by shipping_tier |
| Trend | Purchase merchandise revenue by UTC event_date |

The built-in funnel is strict and session-ordered: `view_item_list → view_item → add_to_cart → begin_checkout → purchase`. It counts distinct sessions that complete each prefix in that order. Users can add directly from cards without viewing details; these paths are intentionally excluded from later funnel steps. For an inclusive shopping funnel, omit `view_item` and enforce order by timestamp per session. Do not calculate a funnel by simply counting unordered events.

Power BI DAX examples (tables renamed `events` and `items`):

```dax
Demo Sessions = DISTINCTCOUNT(events[session_id])
Demo Orders = CALCULATE(DISTINCTCOUNT(events[transaction_id]), events[event_name] = "purchase")
Demo Revenue = CALCULATE(SUM(events[value]), events[event_name] = "purchase")
Demo AOV = DIVIDE([Demo Revenue], [Demo Orders], 0)
Purchased Units = CALCULATE(SUM(items[quantity]), items[event_name] = "purchase")
Converted Sessions = CALCULATE(DISTINCTCOUNT(events[session_id]), events[event_name] = "purchase")
Conversion Rate = DIVIDE([Converted Sessions], [Demo Sessions], 0)
```

Tableau equivalents: filter purchase rows, use COUNTD(transaction_id) for orders and SUM(value) for revenue in the events logical table; use relationships rather than an inner flattened join. Use items for category/product measures. Search rates must filter to search events, not all interactions.

## Future GA4 and Google Tag Manager connection — only after owner approval

Nothing below has been connected or executed. Use a dedicated student/test GA4 property to keep simulated revenue separate from real business data.

1. After approval, create/select the test GA4 property and GTM web container; then install that container in the page. Do not add a Google tag separately if GTM already sends it.
2. Configure a Google tag with the test Measurement ID. Configure consent and retention appropriately for the actual audience before external data collection.
3. Add GTM Custom Event triggers for the ecommerce and custom events you need. Use the event names above, not DOM-click triggers: semantic events already exist and click triggers would duplicate them.
4. Configure a GA4 Event tag using the event name and ecommerce data from the data layer. Map currency/value/items and event-specific parameters such as transaction_id, shipping, coupon, shipping_tier and payment_type. Data-layer variable examples: `ecommerce.currency`, `ecommerce.value`, `ecommerce.items`, `search_term`, `result_count`, `demo_mode`.
5. Keep local `session_start` out of the GTM event allowlist; GA4 manages its own sessions. Avoid duplicate `page_view`: use either Google tag automatic page views or a manual page_view trigger, never both. If using the manual local `search` event, disable automatic site-search enhanced measurement that would duplicate it. Do not map this app's random session_id to GA4's internal ga_session_id.
6. Register low-cardinality custom definitions only as needed (for example demo_mode, category, shipping tier, result count). Do not register event IDs or transaction IDs as custom dimensions.
7. Use GTM Preview/Tag Assistant and GA4 DebugView to verify item arrays, INR values, purchase uniqueness, shipping separation, coupon values and that personal information is absent. Debug mode is for test validation, not permanent production configuration.
8. Publish the GTM container only with owner approval. Keep the site owner-private unless a broader audience is explicitly approved. Owner authentication may constrain which test visitors can reach the site.

Official references:
- https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
- https://developers.google.com/tag-platform/tag-manager/datalayer

## Demo walkthrough for your presentation

Open Analytics Lab and start a new demo session. Close it. Search for milk, open Fresh Toned Milk, add two units, then remove one. Browse categories and add bread, bananas and eggs. Open My cart and apply FRESH10. Choose a sample delivery address and delivery tier. Choose a simulated payment method, review and place a demo order. Open Analytics Lab to inspect the purchase payload and explain why value excludes delivery. Export the three tables and build your first dashboard.

This demonstrates discovery, basket edits, offer usage, checkout stages, conversion, event validation and a relational analytics model in one working prototype.

## Run locally

Requires Python 3 for a static server (no frontend packages or build required):

```sh
python -m http.server 3000 --directory public
```

Open http://localhost:3000. Do not open index.html directly as a file; ES modules require HTTP. The local server serves public; `npm run build` copies those files to dist for Sites. The Sites deployment serves the dist directory and enforces its own access policy. Source and deployment identity are tracked in `.openai/hosting.json`.
