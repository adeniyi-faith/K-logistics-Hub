# K-Logistics Hub app

The phone app built from the approved design in `../design`. It is made with **Expo**, a toolkit that lets one set of code run as an Android app, an iPhone app and a web page.

## Try it

You need Node.js installed.

```bash
cd app
npm install
npm run web      # opens the app in your browser
npm start        # shows a QR code: scan it with the Expo Go app on your phone
```

Without any setup the app runs in **demo mode**: on the sign-in screen, tap **Admin** or **Rider** under "Demo" to open the app as that person, with sample data kept on the phone.

To use the real, synced app (real accounts, data shared between phones), follow [docs/SETUP.md](../docs/SETUP.md) to connect Supabase and PowerSync. The synced app runs on Android and iPhone; the browser version stays in demo mode for now.

## What works now

- **Sign in** with a real email and password (Supabase), or the demo buttons in demo mode.
- **Admin home**: today's sales, cost of goods, expenses and profit; deliveries; stock totals; riders out.
- **Stock**: every product with Opening + Received − Delivered = Closing, filters (low stock, product group), and the **Received** tab listing every stock delivery under its date.
- **Product detail**: today's stock sum, price and profit, NAFDAC number, supplier, nearest expiry.
- **Edit prices** (Admin): change any product's cost price, selling price and low-stock alert at any time. Profit figures use the new cost price straight away.
- **Receive stock**: pick a product, enter quantity, cost price, batch and expiry. Stock goes up straight away.
- **Sales**: today's orders with totals and a rider filter; the **Delivered** tab searches every delivered order by customer, phone, area or order number.
- **New sale**: pick or add a customer, add products (it won't sell more than is in stock), and the rider who last delivered to that customer is picked for you. Payment is paid by transfer or pay on delivery.
- **Order / Delivery proof**: who took the order, the rider, who received it, a timeline, **Share on WhatsApp**, and **New order with the same rider**.
- **Customers** and **Customer profile**: total bought, orders, who usually delivers to them (with a one-tap new order for that rider), delivery history and most-bought products.
- **Rider app**: today's deliveries, call and directions buttons, **Confirm delivery** (who received it, cash/transfer/paid before, amount). Confirming moves the goods out of stock and adds to the rider's earnings.
- **Rider history**: earnings per day and every delivery.
- **Sync badge and Sync centre**: every change is saved on the phone first. The badge shows Synced, Syncing, or Offline · N changes waiting.

Everything is saved on the phone, so it keeps working with no internet. In demo mode, **More → Reset sample data** puts the sample numbers back.

## Build plan

1. **First screens (done).** Sign-in, Admin home, Stock, Product detail, Receive stock, and the rider's deliveries, confirm delivery and history.
2. **Online database and real sign-in (Supabase + PowerSync, chosen 1 Oct 2026).** Supabase is the online database: it holds the shared data, the user accounts (sign-in) and the delivery photos. PowerSync keeps a full copy of that data on each phone and uploads or downloads changes whenever there is internet, so the app keeps working offline. Done in code: the database tables and access rules (`supabase/`), the sync rules (`powersync/`), real sign-in, and the app reading and writing through PowerSync. Still to do: create the Supabase and PowerSync accounts and test on a real phone (see docs/SETUP.md). Note: PowerSync needs its own phone build of the app (a "development build"), so the plain Expo Go app will no longer be enough to try it on a phone. The browser version keeps working.
3. **Sales and customers (done, except photo and signature).** New sale (with the customer's usual rider), Orders list, Delivered orders, Delivery proof with WhatsApp sharing, Customers and Customer profile. Still to do: delivery photo and signature (needs the phone camera and Supabase file storage).
4. **Daily record and close the day.** The daily record page, closing stock becoming tomorrow's opening stock, and the last-5-days history on each product.
5. **Money.** Expenses, Staff & pay, Riders & bikes, Rider earnings, Finance (day/week/month) and Reports with export.
6. **Staff app and access control.** Staff roles, Off/View/Edit per area, per-person changes, and the Me screen.
7. **Settings, sync clashes and release.** Business settings, the Sync centre's "pick a value" for clashes, then building the Android and iPhone apps for the stores.

## Still to confirm with the business

- Real cost price for each product (₦14,000 is a placeholder; Admin can now change each one in the app).
- Rider pay per delivery (₦5,000 is a placeholder).
- The profit formula: the app shows Profit = Sales − Cost of goods − Expenses.

## Where the code lives

- `src/app/` – one file per screen (the file path is the screen's address, e.g. `src/app/admin/stock.tsx` is `/admin/stock`).
- `src/components/` – shared pieces such as buttons, cards and the sync badge.
- `src/lib/stock.ts` – the automatic sums (stock, profit, rider earnings).
- `src/store/AppStore.tsx` – the app's memory: live mode (Supabase + PowerSync) or demo mode.
- `src/live/` – the Supabase and PowerSync connection (`engine.native.ts` is used on phones).
- `../supabase/` – the online database tables, access rules and starting products.
- `../powersync/sync-rules.yaml` – which data each phone downloads.
- `src/data/sample.ts` – the sample products, riders and orders.
