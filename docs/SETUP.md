# Connecting the app to Supabase

**Supabase** is the online database. It also handles the accounts people sign in with.

The app has its own sync built in (no other service to sign up for). Every phone keeps a full copy of its data in a small database on the phone. When there's internet, the app uploads the changes made on that phone and downloads the changes made on other phones, about every 20 seconds while it's open. This is why the app keeps working with no signal.

Until these steps are done, the app runs in **demo mode** with sample data that stays on the phone. The browser version always runs in demo mode for now.

## 1. Create the Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project. Pick the region closest to Nigeria (for example, Europe West).
2. Open **SQL Editor**. Paste in each file in [`supabase/migrations`](../supabase/migrations) in date order (the number at the start of its name), pressing **Run** after each one. They create the tables and the rules about who can see and change what.
3. Paste in [`supabase/seed.sql`](../supabase/seed.sql) and press **Run**. This adds the 27 products. Their prices start at ₦14,000 cost and ₦21,500 selling, and you can change each one in the app.
4. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key. Keep the **service_role** key secret. Never put it in the app.

## 2. Create the accounts

For each person:

1. In Supabase go to **Authentication → Users → Add user** and enter their email and a password. Copy the user's **UID**.
2. In **SQL Editor**, run one of these, putting in the UID you copied:

```sql
-- Admin (Kasim)
insert into profiles (id, name, role) values ('PASTE-UID-HERE', 'Kasim', 'admin');

-- A staff member: first add them in the app (More → Users & access → Add staff),
-- then link the account to them. What they can see comes from their role in the app.
insert into profiles (id, name, role, staff_id)
select 'PASTE-UID-HERE', name, 'staff', id from staff where name = 'Kemi Eze';

-- A rider: add the rider first, then link the account to them
with r as (
  insert into riders (name, initials, phone, bike, rate_per_delivery)
  values ('Emeka Obi', 'EO', '0803 456 7788', 'Bike 1 · PHC-234KA', 5000)
  returning id
)
insert into profiles (id, name, role, rider_id) select 'PASTE-UID-HERE', 'Emeka Obi', 'rider', id from r;
```

If you already added the rider in the app (**More → Riders & bikes → Add rider**), just link the account to them:

```sql
insert into profiles (id, name, role, rider_id)
select 'PASTE-UID-HERE', name, 'rider', id from riders where name = 'Ibrahim Sule';
```

**Easier way for staff and riders:** only the Admin account needs the SQL above. Deploy the sign-in function once:

```bash
npx supabase functions deploy manage-login
```

Then, in the app, Admin types an email and password when adding a staff member or rider (Add staff, Add a rider), or later opens them (More → Users & access, or More → Riders & bikes) and fills in **Sign-in details**. The same card changes the email or resets the password later. The function uses Supabase's secret service-role key, which stays on Supabase's servers and never goes in the app.

To stop someone signing in, set `can_sign_in` to `false` on their profile.

## 3. Point the app at Supabase

In the `app` folder, copy `.env.example` to `.env.local` and fill in the two values from step 1 (the Project URL and the anon public key). `.env.local` stays on your computer and is never uploaded to GitHub.

## 4. Put the app on a phone

The app keeps its data in a database on the phone (`expo-sqlite`). The free Expo Go app may not match the version this app needs, so use a build of this app.

- **Easiest:** in the `app` folder run `npx eas-cli@latest build --profile development --platform android`. This builds in Expo's cloud and gives you a link to install the app on an Android phone. After that, `npm start` sends your code changes to it.
- **With Android Studio installed:** run `npx expo run:android` with a phone plugged in.

## Good to know

- Profit is worked out from each product's **current** cost price. Change a cost price and today's profit figures update to match.
- Receiving stock at a new cost price also updates that product's cost price.
- **Delivery photos** are off at first. Admin turns them on in **More → Business settings**. When they're on, riders must take a photo before confirming a delivery. The photo is kept on the rider's phone and uploads to Supabase Storage (the private `delivery-photos` folder the migration files create) as soon as there's internet.
- **Paying staff and riders** (More → Staff & pay) is saved as a "Staff pay" expense, so it counts in Finance and profit. Receipt photos on expenses go to the same private storage folder as delivery photos.
- **Staff access** (More → Users & access) is checked twice: the app hides what a person can't use, and Supabase refuses changes they aren't allowed to make. Staff phones still download the business's data, so someone very technical could read hidden figures from their own phone's storage. In the same way, a rider's sign-in can read the products table, cost prices included, if someone very technical asked the server directly. The app itself never shows riders cost prices.
- Every change is saved on the phone first. The badge at the top shows **Synced**, **Syncing**, or **Offline · N** (N changes still waiting to upload). Tap it to see them.
- **Business settings** (logo, lists, words) are kept with the business row, so every phone gets them. A new logo, rider photos and receipt photos go in the same private storage folder as delivery photos.
- **Riders can change their own details** (phone, address, next of kin, where to pay them, photo). The server stops them changing their name, ID, bike, pay rate or status. When a rider changes where to pay them, the server writes down the day so Admin sees a notice.
- **Sync clashes**: changes to existing records (products, customers, riders, staff, roles, business settings) go through the `save_change` function in the migration files. It saves each changed value unless another phone changed it meanwhile; then it keeps the value already there and writes the other into `sync_clashes` for Admin to pick in the Sync centre. Only Admin phones download clashes.
- **How sync works**: each change made on a phone is noted in a waiting list (`sync_outbox`) and sent oldest first, so orders arrive before the things that depend on them. Each table has an `updated_at` time that the server sets (see the `own_sync` migration), and each phone asks only for rows changed since it last looked. Deleted rows are written to `sync_deletes` so other phones can remove them too. A download never overwrites a change still waiting to upload from this phone.
- **Deleting** (Admin only): a sale, expense, stock entry, customer, product, rider or staff member, plus **Clear old data** in Business settings. Run the `admin_deletes` migration first, or the server refuses the deletes. Deleting a rider or staff member also removes their sign-in through `manage-login`, so deploy the latest version of that function again. The same migration also lets riders upload the stock record for a delivery they confirm.
- **Rider documents** (licence, ID, bike papers) are photos in the same private storage folder, listed on the rider's row. Run the `rider_documents` migration before installing an app build that has this, or the phone's sync will stop with a missing-column error.
- **Putting the app in the stores**: see [RELEASE.md](RELEASE.md).
- If the server refuses a change (for example, a rider trying something they aren't allowed to do), that change is dropped and the phone's copy is put back in line with the server.
