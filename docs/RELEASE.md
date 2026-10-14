# Putting the app in the Play Store and App Store

The app is built in Expo's cloud (called **EAS**), so nobody needs Android Studio or a Mac. Do these steps after the Supabase setup in [SETUP.md](SETUP.md) works on a test phone.

Commands run in the `app` folder on a computer with Node.js installed.

## What you need first

| What | Cost | Why |
|---|---|---|
| Expo account (expo.dev) | Free | Builds the app in the cloud |
| Google Play developer account | $25, once | To publish on Android |
| Apple Developer Program | $99 a year | To publish on iPhone (optional; Android first is fine) |
| A privacy policy web page | Free (e.g. a Google Doc made public) | Both stores ask for it because the app stores names, phone numbers and photos |

## Building from GitHub (no computer needed)

There's a button on GitHub that starts a build. It runs the same commands as the steps below.

1. On expo.dev, open your account settings, then **Access tokens**, and create a **robot** token. Copy it.
2. On GitHub, open the repository, then **Settings → Secrets and variables → Actions → New repository secret**. Name it `EXPO_TOKEN` and paste the token.
3. The Supabase connection details are already in `app/eas.json`, so there is nothing to add on expo.dev (see step 2 below).
4. On GitHub, open **Actions → Build the app → Run workflow**. Pick:
   - **Which phones**: android, ios or all.
   - **preview** for a test app you install from a link (Android), or **production** for the stores.
   - **Send to the store** only once the store keys are set up in Expo (step 4 below).
5. The build runs in Expo's cloud. The link to follow it (and to download the app when it's done) is in the GitHub run's log and on expo.dev under **Builds**.

The first run creates the project on Expo. It shows a note with the project's id: add it to `app/app.json` (or run step 1 below once from a computer) so later runs use the same project.

iPhone builds need the Apple account linked to Expo first: run step 5 below once from a computer, because Apple asks you to sign in. After that, GitHub can build iPhone apps too.

## 1. Link the app to your Expo account (once)

```
npx eas-cli@latest login
npx eas-cli@latest init
```

`init` adds the project's Expo id to `app.json`. Commit that change.

## 2. The connection details (already done)

`.env.local` stays on your computer, so the cloud builds can't see it. Instead, the Supabase project URL and the **anon public** key are written in `app/eas.json`, under each build profile's `env`. They are safe to keep in the repository: the anon key is meant to ship inside the app, and Supabase's access rules decide who can see what.

If you ever move to a different Supabase project, change those two lines in `app/eas.json` and build again. (Values set on expo.dev under **Environment variables** with the same names take priority over `eas.json`.)

Only ever use the **anon public** key here. The **service_role** key, the secret key and the database password must never go into the app, into `eas.json`, or into Expo.

If a build opens in demo mode (the Admin / Staff / Rider buttons on the sign-in screen), these values were missing.

## 3. Try a test build on Android phones

```
npx eas-cli@latest build --profile preview --platform android
```

When it finishes, Expo gives a link. Open it on each Android phone to install the app (the phone may ask to allow installing from the browser). Use this to test with real staff and riders before going to the store.

## 4. Build for the Play Store

```
npx eas-cli@latest build --profile production --platform android
```

This makes an `.aab` file (the format Google Play wants). The version number goes up by itself on every production build.

Then in the Google Play Console:

1. Create the app ("K-Logistics Hub"), free, app (not game).
2. Fill in the store listing: short and full description, icon (`app/assets/icon.png`), and at least two phone screenshots.
3. Fill in **Data safety**: the app collects names, phone numbers and photos, sends them to your own online database, and doesn't share them with anyone else.
4. Add the privacy policy link.
5. Upload the `.aab` from step 4 to **Internal testing** first (up to 100 testers by email), then to **Production** when you're happy.

Google checks new apps before they go live; it can take a few days the first time. Note: new personal developer accounts must run a closed test with at least 12 testers for 14 days before Production is unlocked. An organisation account (with a D-U-N-S number) doesn't need this.

Later builds can be sent straight from the computer with `npx eas-cli@latest submit --platform android` once a Google service account key is set up (Expo asks for it the first time).

## 5. Build for the App Store (optional)

```
npx eas-cli@latest build --profile production --platform ios
npx eas-cli@latest submit --platform ios
```

Expo asks you to sign in with the Apple Developer account and sets up the certificates by itself. The build then shows in App Store Connect, where you add the description, screenshots and privacy policy link and send it for review.

## Updating the app later

Make the change, merge it, then run step 4 (and 5) again and upload the new build. Phones get the new version through the store.

## Good to know

- The **development** build in SETUP.md is for testing code changes; it's not the one to give staff.
- The browser version is always demo mode.
- Changing the app's name or icon: `app/app.json` and `app/assets/`.
