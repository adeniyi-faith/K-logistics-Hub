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

On the sign-in screen, tap **Admin** or **Rider** under "Demo" to open the app as that person.

## What works now

- **Sign in** with the demo buttons (Admin, Staff, Rider). Real accounts need the online database (step 2 below).
- **Admin home**: today's sales, cost of goods, expenses and profit; deliveries; stock totals; riders out.
- **Stock**: every product with Opening + Received − Delivered = Closing, filters (low stock, product group), and the **Received** tab listing every stock delivery under its date.
- **Product detail**: today's stock sum, price and profit, NAFDAC number, supplier, nearest expiry.
- **Receive stock**: pick a product, enter quantity, cost price, batch and expiry. Stock goes up straight away.
- **Rider app**: today's deliveries, call and directions buttons, **Confirm delivery** (who received it, cash/transfer/paid before, amount). Confirming moves the goods out of stock and adds to the rider's earnings.
- **Rider history**: earnings per day and every delivery.
- **Sync badge and Sync centre**: every change is saved on the phone first and counted as "waiting to upload".

Everything is saved on the phone, so it keeps working with no internet. The numbers start from sample data; **More → Reset sample data** puts them back.

## Build plan

1. **First screens (this step).** Sign-in, Admin home, Stock, Product detail, Receive stock, and the rider's deliveries, confirm delivery and history.
2. **Online database and real sign-in.** Choose where the data lives online (for example Supabase or Firebase), create real accounts for Admin, Staff and Riders, and make the waiting changes upload by themselves.
3. **Sales and customers.** New sale (with the customer's usual rider), Orders list, Delivered orders with proof, Delivery proof sharing on WhatsApp, Customers and Customer profile. Photo and signature on delivery.
4. **Daily record and close the day.** The daily record page, closing stock becoming tomorrow's opening stock, and the last-5-days history on each product.
5. **Money.** Expenses, Staff & pay, Riders & bikes, Rider earnings, Finance (day/week/month) and Reports with export.
6. **Staff app and access control.** Staff roles, Off/View/Edit per area, per-person changes, and the Me screen.
7. **Settings, sync clashes and release.** Business settings, the Sync centre's "pick a value" for clashes, then building the Android and iPhone apps for the stores.

## Still to confirm with the business

- Real cost price for each product (₦14,000 is a placeholder).
- Rider pay per delivery (₦5,000 is a placeholder).
- The profit formula: the app shows Profit = Sales − Cost of goods − Expenses.

## Where the code lives

- `src/app/` – one file per screen (the file path is the screen's address, e.g. `src/app/admin/stock.tsx` is `/admin/stock`).
- `src/components/` – shared pieces such as buttons, cards and the sync badge.
- `src/lib/stock.ts` – the automatic sums (stock, profit, rider earnings).
- `src/store/AppStore.tsx` – saves everything on the phone.
- `src/data/sample.ts` – the sample products, riders and orders.
