# Connecting the app to Supabase and PowerSync

The app has two parts online:

- **Supabase** is the online database. It also handles the accounts people sign in with.
- **PowerSync** keeps a copy of the data on each phone. When there's internet, it uploads the changes made on that phone and downloads the changes made on other phones. This is why the app keeps working with no signal.

Until these steps are done, the app runs in **demo mode** with sample data that stays on the phone. The browser version always runs in demo mode for now.

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project. Pick the region closest to Nigeria (for example, Europe West).
2. Open **SQL Editor**, paste in all of [`supabase/migrations/20261001000000_init.sql`](../supabase/migrations/20261001000000_init.sql), and press **Run**. This creates the tables and the rules about who can see and change what.
3. Paste in [`supabase/seed.sql`](../supabase/seed.sql) and press **Run**. This adds the 27 products. Their prices start at ₦14,000 cost and ₦21,500 selling, and you can change each one in the app.
4. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key. Keep the **service_role** key secret. Never put it in the app.

## 2. Create the PowerSync instance

1. Sign up at [powersync.com](https://www.powersync.com) and create an instance.
2. Connect it to the Supabase database. In Supabase, **Connect → Direct connection** shows the details it needs.
3. Turn on **Use Supabase Auth** so PowerSync trusts the same accounts.
4. Open **Sync Rules**, paste in [`powersync/sync-rules.yaml`](../powersync/sync-rules.yaml), and deploy. This decides what each phone downloads:
   - Admin and Staff phones get everything.
   - Rider phones only get their own deliveries, and they don't get cost prices.
5. Copy the instance URL.

## 3. Create the accounts

For each person:

1. In Supabase go to **Authentication → Users → Add user** and enter their email and a password. Copy the user's **UID**.
2. In **SQL Editor**, run one of these, putting in the UID you copied:

```sql
-- Admin (Kasim)
insert into profiles (id, name, role) values ('PASTE-UID-HERE', 'Kasim', 'admin');

-- A staff member
insert into profiles (id, name, role) values ('PASTE-UID-HERE', 'Kemi', 'staff');

-- A rider: add the rider first, then link the account to them
with r as (
  insert into riders (name, initials, phone, bike, rate_per_delivery)
  values ('Emeka Obi', 'EO', '0803 456 7788', 'Bike 1 · PHC-234KA', 5000)
  returning id
)
insert into profiles (id, name, role, rider_id) select 'PASTE-UID-HERE', 'Emeka Obi', 'rider', id from r;
```

To stop someone signing in, set `can_sign_in` to `false` on their profile.

## 4. Point the app at them

In the `app` folder, copy `.env.example` to `.env.local` and fill in the three values from steps 1 and 2. `.env.local` stays on your computer and is never uploaded to GitHub.

## 5. Put the app on a phone

PowerSync stores data in its own database on the phone. The free Expo Go app doesn't include that database, so you need a build of this app.

- **Easiest:** in the `app` folder run `npx eas-cli@latest build --profile development --platform android`. This builds in Expo's cloud and gives you a link to install the app on an Android phone. After that, `npm start` sends your code changes to it.
- **With Android Studio installed:** run `npx expo run:android` with a phone plugged in.

## Good to know

- Profit is worked out from each product's **current** cost price. Change a cost price and today's profit figures update to match.
- Receiving stock at a new cost price also updates that product's cost price.
- Every change is saved on the phone first. The badge at the top shows **Synced**, **Syncing**, or **Offline · N** (N changes still waiting to upload). Tap it to see them.
- If the server refuses a change (for example, a rider trying something they aren't allowed to do), that change is dropped and the phone's copy is put back in line with the server.
