# Contributing

This is a personal project, but this is how changes are made so the history stays easy to follow.

## Running it on your machine

You need Node.js 22 or newer.

```bash
cd app
npm install
npm run web        # opens the demo in your browser
npm run typecheck  # checks the code for TypeScript errors
```

No Supabase account is needed for the demo. See [docs/SETUP.md](docs/SETUP.md) if you want the real, synced version.

## Branches and pull requests

- `main` is always in a working state. Don't commit to it directly.
- Make a branch for each change, named for what it does, for example `fix-stock-count` or `add-discounts`.
- Open a pull request into `main`. The **Check** workflow must pass before it is merged.
- Keep a pull request to one idea. Smaller ones are easier to read and easier to undo.

## Commit messages

- Start with a short line in the present tense: "Add receipt photo to expenses", not "Added" or "Adding".
- Use the lines after that to say *why* the change was made, if it isn't obvious.

## Database changes

Never edit an old file in `supabase/migrations`. Add a new one with a later date at the start of its name, so everyone's database ends up the same.

## Wording

The app is used by people who are not technical, so screen text stays short and plain. The app says "orders", not "sales".
