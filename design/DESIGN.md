# K-Logistics Hub — App Design (UI/UX)

This folder holds the approved look and flow for the first Expo (React Native) app.
The numbers on the screens are sample data only.

## The business

- **CEO / Owner:** Kasim (the Admin account in the design).
- **Area served:** Port Harcourt and wider Rivers State. Delivery areas (GRA, Rumuola, Trans-Amadi, Rumuokoro, Mile 1, D-Line, Ada George, Choba, Eleme, Outside PH) are editable in Business settings.
- **What they sell:** herbal and health products (mostly Bioharb), not food items.

## Products (27)

5 Vitamin C, Baysel, Boazem, Cazibin, Dark Spot, Devano, Fibnova, Facial Soap, Glow Serum, Hair Plus Formula,
Kojic Acid, Menopause Support, Mvera, Mullein (herbal tea), Orafix, Prostdesx, Proxan, Sootra, Soluvia, Sovana,
Swanky, Sabana Pro, Visura, Zouwa, Kidney Support (tea), Zudes Capsule, Zemora Tea.

- Selling price in the design: **₦21,500 per unit** (each product's price can be changed on its own).
- Cost price in the design: **₦14,000** — a placeholder until the real cost prices are known.
- Product groups: Capsules, Herbal teas, Skin care, Oral care, Hair care, Women's health, Men's health.
- Health products need extra fields, which the design includes: **NAFDAC registration number**, **supplier**, **batch number** and **expiry date** (captured when stock is received).

## Brand

| Token | Hex | Use |
|---|---|---|
| Navy | `#0F1E3B` | Headers, text, main buttons |
| Orange | `#E97D01` | The one key action per screen, highlights |
| Orange text | `#A85A00` | Orange words on white (the bright orange is too light for small text) |
| Background | `#F4F6FA` | Screen ground; cards are white with `#E3E7EF` borders |
| Muted text | `#5A6378` | Labels and secondary text |
| Green | `#1B7A43` on `#E8F6EE` | Paid, delivered, profit |
| Red | `#B42318` on `#FDECEA` | Failed, errors |
| Blue | `#1D4ED8` on `#EAF0FE` | In progress / on delivery, syncing |

Fonts: **Poppins** (titles and money figures) and **DM Sans** (body). Both are on Google Fonts / `@expo-google-fonts`.
Touch targets are at least 44px. Orange buttons use navy text (white on orange fails contrast).

## Who uses the app

There are exactly three kinds of user: **Admin, Staff and Rider**. Manager, Accounts, Store keeper and Sales are not separate apps — they are *staff roles*, i.e. ready-made access settings inside the one Staff app.

| User | Home screen | Bottom tabs |
|---|---|---|
| Admin (Kasim, CEO) | Full dashboard (money + stock + operations) | Home · Stock · Sales · Customers · More |
| Staff | A home built from what that person is allowed to use | Only the areas they can use, plus **Me** |
| Rider | Today's assigned deliveries | Deliveries · History · Profile |

### How staff access works

- Admin gives each staff member a **staff role** as a starting point: Manager, Accounts, Store keeper, Sales, or a new one Admin creates.
- For every area (Stock, Sales & deliveries, Customers, Riders & bikes, Expenses, Staff & pay, Finance & profit, Reports, Business settings) access is **Off** (hidden), **View** (look only) or **Edit** (add and change).
- **Extra permissions** are single switches: see cost prices and profit, give discounts (with a limit), record customer payments, cancel/change a saved sale, close the day, export reports, decide sync clashes.
- Admin can change any of these **for one person** without changing the role. So two staff with the same role can still have different access (e.g. Kemi is a Manager but can also close the day).
- Changing a role updates everyone who has it, except the things changed for one person.
- Staff can see their own access on the **Me** screen. Every access change is logged. Changes reach a staff phone on its next sync; turning off "Can sign in" blocks the person straight away when online.
- Rider and Admin access are fixed.

## Screens (36)

1. **Start, home & settings** — Sign in (with demo picker: Admin, Staff, Rider), Admin dashboard, Sync centre, More menu, Business settings (logo, expense categories, units, low-stock alert, own words for "sale"/"rider"), Style guide.
2. **Stock & daily record** — Stock list (In store / Received tabs), **Stock received** (every delivery of stock on one page, grouped under a clear date such as 30/09/2026, with product, quantity, batch, expiry and who received it), Product detail (Opening + Received − Delivered = Closing, cost/sell/profit, last 5 days), Receive stock, Daily record (includes each rider's earnings for that day), Close the day.
3. **Sales, deliveries & customers** — Orders list (All orders / Delivered tabs), **Delivered orders** (search by customer, phone, area or order number; each shows date and time, rider and bike, area, who received it, photo and signature — to settle "it wasn't delivered" calls), **Delivery proof** (one delivered order with timeline; share on WhatsApp; new order with the same rider), New sale (picks the rider who last delivered to that customer; payment is paid by transfer or pay on delivery), Customers, Customer profile (total bought, orders, "usually delivered by" rider with a one-tap new order for that rider, delivery history with date, area, rider and items).
4. **Expenses, staff & riders** — Expenses (by category and Daily/Weekly/Monthly/One-time), Add expense, Staff & pay, Riders & bikes, **Rider earnings** (per rider, day by day: Date · Deliveries · Earnings, plus all riders for a day), Add a rider (personal → bike → ID & login).
5. **Finance & reports** — Finance (Day/Week/Month), Reports (filter by period, product, customer, staff, rider; export PDF/Excel/share).
6. **Rider app** — Deliveries today, Confirm delivery (items, cash/transfer collected, photo, signature), History (with a day-by-day earnings table), Profile, Edit profile. Riders change their own photo, phone, address, next of kin, pay account and password straight away (a new phone number is confirmed by code; Admin is told when the pay account changes). Name, ID and bike/plate are checked by Admin, so the rider taps "Ask to change" instead.
7. **Staff app** — Staff home (shown for Kemi, who has Manager access: stock, sales, riders, no money; the home and tabs change with each person's access), Me (my access and pay).
8. **Access control (Admin)** — Users & access (everyone labelled Admin, Staff or Rider, plus a side-by-side comparison of staff access), Edit one staff member's access, Staff roles.

## Automatic sums shown in the design

- Closing stock = Opening stock + Received − Delivered. Closing stock of a day becomes the next day's opening stock when the day is closed.
- Profit = Sales − Cost of goods sold − Expenses. (Cost of goods comes from each product's cost price. The brief's simpler "Sales − Expenses" would count the goods themselves as profit, so the design shows cost of goods separately — to be confirmed with the business.)
- Customers do not owe: every order is either paid by transfer or paid on delivery (the rider collects the money). There is no debt or balance column.
- Rider earnings = deliveries completed × the rider's rate (₦5,000 per delivery in the design — to be confirmed).

## Offline first

- Every save goes to the phone first, then uploads in the background. Nothing waits for the internet.
- A small badge in the top bar is always visible: **Synced** (green), **Offline · 3** (orange, count of waiting changes), **Syncing** (blue). Tapping it opens the Sync centre.
- Records not yet uploaded carry a "Not synced" mark.
- When the same thing was changed on two phones, the Sync centre shows both values and lets an Admin pick one. Sales, payments and expenses are new records (added, never overwritten), so they rarely clash; stock numbers are worked out from movements rather than typed in, which keeps clashes rare.
- Riders can confirm deliveries with no signal; the proof (photo, signature, amount collected) uploads later.

## Files here

- `screens/` — the canvas source (`canvas.json` and one `.dc.html` per screen).
- `generator/` — the Python script that writes those files (`python3 build.py` inside `generator/`, output goes to `canvas/project/`).
- `../assets/brand/logo.jpg` — the logo.
