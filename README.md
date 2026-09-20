# 🛒 Freshlane — Grocery Store & Web Analytics Project

Freshlane is a responsive grocery shopping prototype inspired by quick-commerce websites such as Blinkit. It demonstrates the customer journey from browsing products to completing a simulated order, while recording interactions for web analytics.

Developed by **Harsh Mhatre** for an **M.Sc. Data Analytics Web Analytics project**.

> Educational prototype only. No real payments, deliveries or purchases occur. Freshlane is not affiliated with Blinkit.

## Project Objectives

- Build an interactive grocery shopping experience.
- Capture customer interactions as structured events.
- Study product discovery, cart activity and checkout behaviour.
- Identify drop-offs in the shopping journey.
- Export data for Power BI or Tableau dashboards.
- Provide tracking points for Google Tag Manager and Google Analytics 4.

## Features

### Grocery Storefront

- Responsive layout for desktop and mobile.
- 24 sample products across eight categories.
- Product search and category filters.
- Sorting by price and discount.
- Product details and locally hosted SVG illustrations.

### Shopping Cart

- Add products, change quantities and remove items.
- Save the basket in browser storage.
- Calculate subtotals, discounts and delivery charges.
- Apply `FRESH10` for 10% off merchandise, capped at ₹75.

### Demo Checkout

- Select a sample delivery address.
- Choose standard or priority delivery.
- Select a simulated payment method.
- Review and confirm a demo order.
- Download a JSON receipt.

### Analytics Lab

- View local KPIs and the shopping funnel.
- Inspect recorded event payloads.
- Start a new demo session.
- Export events, item details and product data as CSV.
- Export raw event data as JSON.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Page structure |
| CSS3 | Styling and responsive layout |
| JavaScript ES modules | Storefront, cart and checkout logic |
| localStorage | Browser basket and event storage |
| sessionStorage | Local demo session identifier |
| SVG | Product illustrations |
| Python HTTP server | Local development |
| Flask | Optional PythonAnywhere hosting wrapper |
| Google Tag Manager / GA4 | Optional external analytics integration |
| Power BI / Tableau | Analysis of exported data |

## Project Files

| File or folder | Purpose |
|---|---|
| `index.html` | Main website |
| `style.css` | Website styling |
| `app.js` | Storefront and shopping interactions |
| `catalog.js` | Sample product catalogue |
| `analytics.js` | Event recording and analytics utilities |
| `assets/` | SVG images and icons |
| `ANALYTICS_GUIDE.md` | Event definitions and dashboard guidance |

The supplied website ZIP contains the frontend files. A Flask wrapper can be added for PythonAnywhere hosting.

## Run Locally

1. Download and extract the project ZIP.
2. Open the extracted folder in VS Code.
3. Open a terminal in the folder containing `index.html`.
4. Run:

```bash
python -m http.server 5500
```

On Windows, if `python` is unavailable:

```bash
py -m http.server 5500
```

Open:

```text
http://localhost:5500
```

Press `Ctrl + C` in the terminal to stop the server.

No npm installation or frontend build is required. Use an HTTP server rather than opening `index.html` directly because the project uses JavaScript modules.

## Optional PythonAnywhere Hosting

Create a Flask web app on PythonAnywhere. Place the frontend files inside a `public` folder next to `flask_app.py`.

Use this code in `flask_app.py`:

```python
from pathlib import Path
from flask import Flask, send_from_directory

PUBLIC = Path(__file__).resolve().parent / "public"

app = Flask(
    __name__,
    static_folder=str(PUBLIC),
    static_url_path=""
)

@app.route("/")
def home():
    return send_from_directory(str(PUBLIC), "index.html")
```

Keep the web app's WSGI configuration pointing to:

```python
from flask_app import app as application
```

Reload the application from PythonAnywhere's Web tab.

This wrapper serves the existing website; cart and analytics data remain browser-based.

## Analytics Events

| Event | Recorded interaction |
|---|---|
| `view_item_list` | Product cards become visible |
| `select_item` | Product selected |
| `view_item` | Product details opened |
| `search` | Product search performed |
| `select_category` | Category selected |
| `add_to_cart` | Product added |
| `remove_from_cart` | Product quantity removed |
| `view_cart` | Cart opened |
| `begin_checkout` | Checkout started |
| `add_shipping_info` | Delivery selection confirmed |
| `add_payment_info` | Demo payment selection confirmed |
| `purchase` | Demo order completed |
| `apply_coupon` | Coupon applied |

Events are written to `window.dataLayer` and local browser storage.

**External analytics status:** The supplied ZIP does not install a GTM container or connect to GA4. Those services require separate configuration and verification.

All recorded events include `demo_mode: true`.

## Dashboard Data

Export these files from Analytics Lab:

- `freshlane_events.csv` — one row per interaction.
- `freshlane_items.csv` — product lines associated with events.
- `freshlane_products.csv` — product catalogue.

Connect events to items using `event_id`, and products to items using `item_id`.

Suggested dashboard metrics:

- Total demo sessions and orders.
- Purchase conversion rate.
- Demo merchandise revenue.
- Average order value.
- Product and category performance.
- Checkout funnel drop-offs.
- Searches with no results.
- Coupon usage.

Filter to `purchase` events when calculating revenue. Avoid summing event-level revenue after joining it to multiple item rows, as this can duplicate totals.

## Demo Walkthrough

1. Start a new demo session in Analytics Lab.
2. Search for milk and open its product details.
3. Add products to the basket.
4. Change quantities and apply `FRESH10`.
5. Complete the simulated checkout.
6. Inspect the purchase event in Analytics Lab.
7. Export the CSV files for dashboard analysis.

## Limitations

- Products, prices and delivery estimates are illustrative.
- No real payment gateway, authentication or inventory service.
- No shared database for orders or visitor analytics.
- Local event history retains only the latest 3,000 events.
- Clearing browser storage can erase saved data.
- Friends' interactions remain in their own browsers unless external analytics is configured.

## Future Improvements

- Configure and validate GA4 tracking through GTM.
- Add a database-backed order system.
- Introduce user accounts and an administration panel.
- Build Power BI or Tableau dashboards.
- Expand the product catalogue.

## Author

**Harsh Mhatre** 
M.Sc. Data Analytics  
Pillai University New Panvel
