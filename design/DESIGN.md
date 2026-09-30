# K-Logistics Hub — App Design (UI/UX)

Interactive design canvas (all screens, clickable): https://claude.ai/artifact/HZaDXZrpnfzgh4joyEetDc

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
| Red | `#B42318` on `#FDECEA` | Owes, failed, errors |
| Blue | `#1D4ED8` on `#EAF0FE` | In progress / on delivery, syncing |

Fonts: **Poppins** (titles and money figures) and **DM Sans** (body). Both are on Google Fonts / `@expo-google-fonts`.
Touch targets are at least 44px. Orange buttons use navy text (white on orange fails contrast).

## Who uses the app

| Role | Home screen | Bottom tabs |
|---|---|---|
| Admin / Owner | Dashboard (money + stock + operations) | Home · Stock · Sales · Customers · More |
| Manager | Dashboard without money figures | Same as Admin; Finance/Expenses/Reports only if the owner allows |
| Rider | Today's assigned deliveries | Deliveries · History · Profile |

The "Users & access" screen holds the permission table and the owner's switches for what managers can see.

## Screens (28)

1. **Start, home & settings** — Sign in (with demo role picker), Admin dashboard, Manager dashboard, Sync centre, More menu, Business settings (logo, expense categories, units, low-stock alert, own words for "sale"/"rider"), Style guide.
2. **Stock & daily record** — Stock list, Product detail (Opening + Received − Delivered = Closing, cost/sell/profit, last 5 days), Receive stock, Daily record (any past day), Close the day (closing stock carried into tomorrow's opening stock).
3. **Sales, deliveries & customers** — Sales list, New sale (customer, items, rider + bike, payment, balance), Customers (total owed), Customer profile (Bought / Paid / Owes, running balance, most bought).
4. **Expenses, staff & riders** — Expenses (by category and Daily/Weekly/Monthly/One-time), Add expense, Staff & pay, Riders & bikes, Add a rider (personal → bike → ID & login).
5. **Finance, reports & access** — Finance (Day/Week/Month), Reports (filter by period, product, customer, staff, rider; export PDF/Excel/share), Users & access.
6. **Rider app** — Deliveries today, Confirm delivery (items, cash/transfer collected, photo, signature), History, Profile.

## Automatic sums shown in the design

- Closing stock = Opening stock + Received − Delivered. Closing stock of a day becomes the next day's opening stock when the day is closed.
- Profit = Sales − Cost of goods sold − Expenses. (Cost of goods comes from each product's cost price. The brief's simpler "Sales − Expenses" would count the goods themselves as profit, so the design shows cost of goods separately — to be confirmed with the business.)
- Customer owes = Total bought − Total paid.

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
