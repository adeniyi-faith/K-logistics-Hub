# Architecture

This page explains how the app is put together and why. It's written to be readable without much technical background. Technical words are explained when they first show up.

## The big picture

```
   Phone (Android / iPhone)                     Supabase (online)
 ┌─────────────────────────────┐          ┌──────────────────────────┐
 │ Screens (React Native)      │          │ Postgres database        │
 │        │  read / write      │          │  + access rules (RLS)    │
 │        ▼                    │          │ Sign-in (accounts)       │
 │ Local database (SQLite)     │◄────────►│ File storage (photos)    │
 │        ▲                    │  sync    │ Edge functions:          │
 │ Sync (src/live/sync.ts)─────┼──────────┤   assistant (Gemini)     │
 └─────────────────────────────┘          │   manage-login           │
                                          └──────────────────────────┘
```

Two words worth knowing:

- **SQLite** is a small database that lives inside the phone. The app keeps a full copy of the business data in it.
- **Postgres** is the main database on the server. Supabase hosts it.

## Why the app reads from the phone, not the server

Riders work in places with weak or no mobile signal. If every screen asked the server for its data, the app would stop working whenever the signal dropped. So the screens only ever talk to the database on the phone. That makes them fast and means they work with no internet. A separate sync step handles the server.

This is usually called **offline-first**.

## The sync

The sync lives in [`app/src/live/sync.ts`](../app/src/live/sync.ts). It runs about every 20 seconds while the app is open and has two halves:

- **Upload.** Each change made on the phone is first written to a small waiting list (the "outbox"). The sync sends the list to the server, oldest first. If there is no internet, it stops and tries again later.
- **Download.** For each table, the sync asks the server for rows that changed since last time. Deleted rows are tracked in their own table so they can be removed on the other phones too. Any row that still has a change waiting to upload is skipped, so a download can never wipe out something just typed on the phone.

**Clashes.** If two people change the same thing while offline, the Admin gets a screen that shows both versions and lets them pick one. Nothing is silently overwritten.

### Why we wrote our own

The first plan used PowerSync, a ready-made sync service. It couldn't connect reliably to the Supabase database (an IPv6 connection was refused and the connection pooler kept rejecting the login). Rather than keep fighting it, the sync was written directly against Supabase. It's roughly one file, there is no extra service to pay for or sign up to, and it can be tested without a phone: [`app/scripts/check-sync.ts`](../app/scripts/check-sync.ts) runs it against an in-memory database.

## Who can do what

There are three kinds of people: Admin (the owner), Staff and Riders. Staff get a role (Manager, Accounts, Store keeper, Sales) as a starting point, and the Admin can change individual areas for one person.

The rules are enforced in two places on purpose:

1. **In the app**, buttons and screens a person isn't allowed to use are hidden.
2. **On the server**, using Postgres row level security (RLS). These are rules attached to the tables themselves, saying which rows each signed-in person may read or change. Even if someone bypassed the app, the database would still refuse.

For example, riders never receive cost prices, and staff without the "see cost prices and profit" permission don't either.

The rules are in [`supabase/migrations`](../supabase/migrations), mainly `…_staff_access.sql`.

## The AI assistant

The owner types a question. The app sends it to a Supabase edge function (a small piece of server code), which holds the Gemini API key and passes the question on. Gemini can ask for figures ("sales for this week"), and those look-ups run **on the phone** against the local database, so the server never needs a copy of the business data. The assistant is read-only: it can answer questions but can't change anything. See [AI-ASSISTANT.md](AI-ASSISTANT.md).

## Other choices

- **Demo mode.** With no Supabase settings, the app runs on sample data stored on the device. This lets anyone try it, and it's how the browser version works.
- **Closing the day.** When the Admin closes a day, its figures are locked. Reopening is a deliberate, separate action.
- **Photos.** Delivery proof and expense receipts are shrunk on the phone before uploading, to save mobile data.
- **Plain words.** Screen text is short and simple, and some business words (like "rider") can be changed in settings to suit the business.
- **Releases.** The Android and iPhone builds are made in Expo's cloud and started by hand from a GitHub Action. See [RELEASE.md](RELEASE.md).

## Folder guide

| Folder | What's in it |
|---|---|
| `app/src/app` | The screens. File names are the routes (Expo Router). |
| `app/src/components` | Buttons, cards and other shared pieces. |
| `app/src/lib` | Plain logic: money, stock, reports, access checks. |
| `app/src/live` | The synced version: local database, sync, Supabase calls. |
| `app/src/store`, `app/src/data` | Demo mode data and state. |
| `supabase/migrations` | The database, built up one dated file at a time. |
| `supabase/functions` | The assistant and the login-management functions. |
