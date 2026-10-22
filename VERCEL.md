# Deploy Office Survival 1999 to Vercel

The game is a static Next.js application. It needs no API keys, database, or environment variables. Progress is saved in each player's browser.

## Import from GitHub

1. Upload this prepared source to your GitHub repository, including `vercel.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`.
2. In Vercel, choose **Add New → Project**, then import the repository.
3. Use the folder containing `package.json` and `vercel.json` as the **Root Directory**. For the existing `shreyash1704/new` repository, this is the repository root (`.`).
4. Keep the **Next.js** framework preset. The included configuration sets the install command, build command, and `out` output directory. Node.js is pinned to **24.x** in `package.json`.
5. Click **Deploy**.

The source ZIP has `package.json` directly at its root. If you upload an enclosing folder into GitHub instead, select that folder as Vercel's Root Directory.

## Deploy from the terminal

Extract the source ZIP and run these commands in the folder containing `vercel.json`:

```sh
npx vercel
```

This creates a preview deployment. When ready to publish production:

```sh
npx vercel --prod
```

Sign in when prompted and choose your Vercel account or team.

## Build settings

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Node.js | 24.x |
| Install command | `npx --yes pnpm@11.8.0 install --frozen-lockfile` |
| Build command | `npx --yes pnpm@11.8.0 run build` |
| Output directory | `out` |
| Environment variables | None required |

The versioned install command prevents Vercel from selecting an older pnpm version from the lockfile format. The separate `videos/` project is excluded from the game build and CLI upload. Its dependencies are not needed to host the game.

The build exports `/`, `/desk`, and the 404 page. Vercel serves those files directly; no running application server or catch-all rewrite is needed.

## Verify locally

```sh
npx --yes pnpm@11.8.0 install --frozen-lockfile
npx --yes pnpm@11.8.0 test
npx --yes pnpm@11.8.0 run build
```

Official references: [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [package managers](https://vercel.com/docs/package-managers), and [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
