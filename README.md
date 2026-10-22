test

## Affiliate links and preview images

Add an optional JPG, PNG, WebP, or AVIF preview when saving an affiliate link. The browser resizes it to at most 640 pixels on its longest edge and converts it to WebP, with a maximum output size of 100 KB. Inputs above 12 MB are rejected. The thumbnail appears beside the link name, and **Copy link** copies the full saved URL, including tracking parameters.

Cloud previews are stored in Convex file storage; the original image is not uploaded. Only authenticated users can upload, and link records retain their existing ownership checks. Deleting a link deletes its stored preview. Public Community posts include their preview. Convex image URLs are bearer URLs: someone given an image URL can view that image, even when its link record is private. Local demo previews stay in browser storage.

## Netlify deployment

This project runs SvelteKit 2, Convex, Google sign-in, and an installable PWA. Netlify uses Node functions for server-rendered pages and `/api/auth/*`.

1. Import the GitHub repository into Netlify. If `ai-affiliate-hub` is the repository root, leave Base directory empty. If it is a subfolder, set Base directory to `ai-affiliate-hub`.
2. The committed `netlify.toml` sets Build command to `npm run build:netlify`, Publish directory to `build`, and Node to 22. No `npm start`, `HOST`, `PORT`, or `ORIGIN` setting is required on Netlify. Use a Git deployment so functions are built; do not upload only the static output or add a catch-all SPA rewrite.
3. In the Netlify dashboard, add these variables with **Builds and Functions** scopes (or all scopes), then deploy:

   | Variable                 | Current test deployment value             |
   | ------------------------ | ----------------------------------------- |
   | `PUBLIC_CONVEX_URL`      | `https://fast-barracuda-520.convex.cloud` |
   | `PUBLIC_CONVEX_SITE_URL` | `https://fast-barracuda-520.convex.site`  |
   | `PUBLIC_SITE_URL`        | `https://affiliate-hub-mer.netlify.app`   |

   These URLs are public configuration. Keep `.env.local` and `.env.convex.local` out of Git. Google credentials, `BETTER_AUTH_SECRET`, and `SUPER_ADMIN_EMAILS` remain in Convex. Changing dashboard environment values requires a new deploy to update running functions.

4. On the existing Google OAuth Web client, retain the localhost entries and add:
   - Authorized JavaScript origin: `https://affiliate-hub-mer.netlify.app`
   - Authorized redirect URI: `https://affiliate-hub-mer.netlify.app/api/auth/callback/google`
5. The shared test Convex deployment uses `SITE_URL=https://affiliate-hub-mer.netlify.app` and `AUTH_TRUSTED_ORIGINS=http://localhost:5173`. OAuth callbacks resolve from an exact allowed request host, so both origins can sign in. Add future domains explicitly; arbitrary Netlify preview hosts are not allowed.
6. On the stable HTTPS site URL, test Google sign-in, refresh, private link creation, Community publishing, and the admin directory. Install the PWA from that domain to test offline fallback. Live login needs both the Netlify environment and Google callback configured.

This test site shares the existing **development Convex deployment** and its records. For a separate production backend, configure that deployment's secrets and origins, run `npm run backend:deploy`, and replace the two Netlify Convex URLs with production URLs. Netlify frontend builds do not deploy Convex functions; no Convex deploy key is required for this frontend-only build.

### Local checks

```powershell
npm ci
npm run check
npm run check:backend
npm test
npm run build
npm run test:e2e
npm run build:netlify
```

`npm run build` creates a standalone Node server; `npm run build:netlify` creates Netlify assets in `build/` and SSR/auth functions under `.netlify/`. Both outputs are ignored by Git. The CI workflow checks both targets. Local `npm run dev` remains available at `http://localhost:5173`.

See the official [Netlify SvelteKit setup](https://docs.netlify.com/build/frameworks/framework-setup-guides/sveltekit/) and [function environment settings](https://docs.netlify.com/build/functions/environment-variables/).
