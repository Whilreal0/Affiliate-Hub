# Linkcraft — AI Affiliate Hub

A responsive SvelteKit 2 + Svelte 5 workspace for copying affiliate links, organizing AI prompts, and publishing community posts. Convex provides private storage and the shared public feed; Better Auth provides Google sign-in. Installable as a PWA.

## Start locally

Requires Node 22.14+ and npm. From this folder:

```powershell
npm ci
if (-not (Test-Path -LiteralPath '.env.local')) { Copy-Item -LiteralPath '.env.example' -Destination '.env.local' }
npm run dev
```

Open http://localhost:5173. With `PUBLIC_CONVEX_URL` empty, the app runs in **local demo mode**: six sample prompts, no invented affiliate links, and records stored only in this browser’s local storage. Your own affiliate links retain their original tracking parameters. Demo data is separate from cloud accounts and is not automatically uploaded.

### Dummy login for testing

Click **Demo sign in** at the top right. Use:

- Email: `demo@linkcraft.test`
- Password: `Demo123!`

You can also click **Fill demo credentials**, then **Log in**. The demo profile is **Demo Creator**. Sign-in persists across reloads in the current browser tab; **Sign out** clears it. This simulates login in local demo mode and does not authenticate against Google or grant access to Convex. When Convex is configured, the app uses the real Google sign-in flow instead.

## Super admin: registered users

Open `/admin`. For the local preview, use **admin@linkcraft.test** / **Admin123!**, or click **Fill admin credentials** in the demo login window. The **Super admin** menu appears after admin login. The preview shows only the two built-in demo accounts; these are clearly labeled and are not live registrations.

In production, set **`SUPER_ADMIN_EMAILS` in the Convex deployment** to your Google email. For multiple owners, use a comma-separated list. Sign in through Google with a verified email matching that list. Keep this setting server-side; there is no public environment variable or self-service promotion control. A blank list grants nobody super admin access.

The directory reads from Better Auth’s actual user records, including accounts created before this dashboard was added. It displays name, email, verification status, registration time in Asia/Manila, and member/super-admin role. Use **Load more users** to see older registrations. Search applies to the loaded accounts; summary cards are explicitly labeled as loaded counts.

The directory is read-only. Guests and ordinary members cannot query it, even by calling the backend directly. A valid unexpired session, verified email, and explicit server allowlist match are all required. Session tokens, provider tokens, passwords, and other authentication secrets are excluded from the directory response.

## Included

- Overview, Affiliate Links, Favorites, Text to Image, Image to Video, and Settings menus.
- Add, search, filter, favorite, inspect, copy, delete, and export links/prompts.
- Product placeholders such as `[PRODUCT]` in reusable sample prompts.
- Compact mobile bottom navigation (Home, Community, Links, Prompts, More), responsive cards, and dialogs that become bottom sheets on small screens with 4px left/right/bottom spacing and rounded top corners. Tap outside a sheet to dismiss it. Prompts (`/prompts`) and More (`/more`) are full pages, with categories, favorites, settings, installation, and authorized admin access. Menu destinations have their own URLs and support browser back/forward navigation.
- Google OAuth configuration, auth proxy routes, and Convex auth integration.
- Authenticated Convex reads and writes, an owner index, and ownership checks before updates/deletion.
- PWA manifest, PNG and maskable icons, service worker, install guidance, offline status, and an offline navigation page.

This app organizes prompts to paste into AI tools. It does not call generation APIs, create affiliate accounts, or fabricate affiliate URLs. No AI provider keys are required.

## Public Community feed

Open `/community` or select **Community** in the navigation. Visitors can browse and copy public posts without signing in. Filters separate links, image prompts, and video prompts. The Convex feed is live and paginated; **Load more posts** retrieves older posts. Search and filters apply to loaded posts.

Sign in, then select **Create public post**, choose Affiliate Link or Prompt, and submit with **Public — everyone** selected. Existing private items can be published from their detail window using **Publish to Community**. Use **Make private** to withdraw a post while keeping it in your own workspace. Deleting your item removes it from both places.

- Affiliate links have no prompt category. Only prompts use Text to Image or Image to Video.
- Items created in your workspace default to private. Existing records remain private until explicitly published.
- Public posts include their content, tool/brand, display name, and publication date. Public queries omit owner identifiers and personal favorite state.
- Only the owner can change visibility or delete a post; Convex enforces this on the server.
- **Local demo:** publishing is simulated using this browser’s storage. It is explicitly labeled and does not share data across users/devices. Connect and deploy Convex using the setup below to enable the real shared feed. The dummy login grants no Convex access.

## Connect Convex and Google

1. Run `npm run backend` in another terminal. Sign in to Convex and select/create a project. Keep it running to sync backend changes. The CLI maintains generated API files in `src/convex/_generated/`; commit these files with the source and do not edit them manually.
2. Set `PUBLIC_CONVEX_URL` in `.env.local` to your `https://YOUR-DEPLOYMENT.convex.cloud` URL. `npx convex dev` may write a Vite variable; this app specifically reads `PUBLIC_CONVEX_URL`. Keep `PUBLIC_SITE_URL=http://localhost:5173`. For local, self-hosted, or custom-domain Convex deployments, also set `PUBLIC_CONVEX_SITE_URL` to the HTTP actions URL. Cloud `.convex.site` URLs are derived automatically.
3. In the **Convex deployment** Settings → Environment Variables, add every variable from `.env.convex.example`:

   | Variable               | Value                                                                                                    |
   | ---------------------- | -------------------------------------------------------------------------------------------------------- |
   | `SITE_URL`             | `http://localhost:5173` in development; your HTTPS app origin in production                              |
   | `BETTER_AUTH_SECRET`   | A cryptographically random secret of at least 32 characters                                              |
   | `GOOGLE_CLIENT_ID`     | Google Web application OAuth client ID                                                                   |
   | `GOOGLE_CLIENT_SECRET` | Google Web application OAuth client secret                                                               |
   | `SUPER_ADMIN_EMAILS`   | Your verified Google email; comma-separated for multiple super admins; blank disables super admin access |

   Generate a secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Put the output directly in Convex; do not commit it.

4. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), configure the OAuth consent screen and create an OAuth **Web application**. Use these local settings:

   - Authorized JavaScript origin: `http://localhost:5173`
   - Authorized redirect URI: `http://localhost:5173/api/auth/callback/google`
   - Add your Google account as a test user while the consent screen is in testing.

   Add your production origin and its `/api/auth/callback/google` redirect before deploying. Use the app origin for OAuth callbacks because SvelteKit proxies `/api/auth/*` to Convex.

5. Restart `npm run dev`. Click **Sign in with Google**. Cloud accounts start with an empty private collection. Use Add Prompt or Add Affiliate Link to create your own records.

Google credentials and `BETTER_AUTH_SECRET` live in Convex, not in any `PUBLIC_` variable. `.env.local` is ignored by Git. The two example env files list every variable used by this implementation and optional Node hosting settings; unused AI provider secrets are intentionally unnecessary.

If you keep a private `.env.convex.local` file, you can upload its settings using `npx convex env set --from-file .env.convex.local`. This file is ignored by Git. Do not overwrite a configured `.env.local` with the example file: it contains your selected deployment and public connection URLs.

After connecting, open **http://localhost:5173** (use this exact origin), sign in with Google, and visit `/admin` with an allowlisted verified email. In Google Cloud, the development OAuth callback must be **http://localhost:5173/api/auth/callback/google**. The dummy accounts are available only when the Convex URL is blank; they do not authenticate to the real deployment.

## Environment reference

| Location           | Variable                                                                     | Purpose                                                       |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `.env.local`       | `PUBLIC_CONVEX_URL`                                                          | Convex client URL; blank enables local demo                   |
| `.env.local`       | `PUBLIC_CONVEX_SITE_URL`                                                     | Optional HTTP actions URL for nonstandard deployments         |
| `.env.local`       | `PUBLIC_SITE_URL`                                                            | App origin for your deployment configuration                  |
| `.env.local` / CLI | `CONVEX_DEPLOYMENT`                                                          | Selected Convex project/deployment                            |
| CI only            | `CONVEX_DEPLOY_KEY`                                                          | Optional Convex deployment credential                         |
| Node host          | `ORIGIN`                                                                     | Public app origin, e.g. `https://your-app.example`            |
| Node host          | `HOST`, `PORT`                                                               | Listening address/port                                        |
| Trusted proxy only | `PROTOCOL_HEADER`, `HOST_HEADER`, `ADDRESS_HEADER`, `XFF_DEPTH`              | Optional adapter-node forwarded-header settings               |
| Convex             | `SITE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Authentication configuration described above                  |
| Convex only        | `SUPER_ADMIN_EMAILS`                                                         | Verified emails allowed to view the registered-user directory |

## PWA and offline behavior

Use `npm run build` and `npm run preview` to test installation/service-worker behavior. The service worker is a production feature. HTTPS is required outside localhost. Chromium browsers can show an install prompt; Safari uses Share → Add to Home Screen.

Static application assets are cached. If an already-open local demo loses connectivity, you can continue working with its local records. A full navigation while offline shows the offline page; reconnect to reopen the workspace. Cloud reads, writes, and Google sign-in require internet. Auth endpoints and private HTML/data responses are never put in the service-worker cache. Updates activate after the older app windows close.

## Verify

```powershell
npm run check
npm run check:backend
npm run format:check
npm test
npm run build
npm audit
```

End-to-end browser tests:

```powershell
npx playwright install chromium
npm run build
npm run test:e2e
```

## GitHub and code maintenance

Use this `ai-affiliate-hub` folder as the repository root. Commit `package-lock.json`, the source, the generated Convex bindings, and the two placeholder environment examples. `.gitignore` excludes real environment files, dependencies, build output, screenshots, and test reports. Keep Google credentials and deployment keys in Convex or your hosting provider's secret settings.

`npm run format` formats authored code with Prettier and its Svelte plugin. `npm run format:check` checks formatting without changing files. `.editorconfig`, `.gitattributes`, and `.nvmrc` keep editor settings, line endings, and the Node major version consistent across machines.

The GitHub Actions workflow in `.github/workflows/ci.yml` runs formatting checks, frontend/backend type checks, unit tests, a production build, and browser tests on pushes and pull requests. Tests use demo data and a local authentication test server; CI needs no Google credentials, Convex deployment secrets, or live user records. The workflow validates code and does not deploy it.

This is a working MVP. Before growing the public service, plan for community moderation and posting limits, paginate large private libraries (currently loaded per account), and split the central workspace component into smaller views. Search on public posts and the user directory currently covers loaded records. No open-source license has been selected; choose one before inviting external reuse.

## Production

1. Create/configure a production Convex deployment, set its authentication secrets/settings, and configure `SUPER_ADMIN_EMAILS` for owner access.
2. Set production `PUBLIC_CONVEX_URL`, `PUBLIC_SITE_URL`, and optional `PUBLIC_CONVEX_SITE_URL` in your app host. Update Google origins/callbacks.
3. Run `npm run backend:deploy`, then `npm run build`.
4. Host the generated `build/` with Node: set `ORIGIN` to your real HTTPS origin, choose `HOST`/`PORT`, and run `node build`. Keep `.env.local` for development; the production Node process needs environment variables supplied by your host.

Use HTTPS, and only trust forwarded headers when your own proxy removes untrusted inbound copies. This repository includes configuration readiness; it does not provision external accounts or deploy itself.

## Official integration references

- [Convex + Better Auth for SvelteKit](https://labs.convex.dev/better-auth/framework-guides/sveltekit) — SvelteKit 2 differences are near the end.
- [Better Auth Google configuration](https://better-auth.com/docs/authentication/google)
- [SvelteKit service workers](https://svelte.dev/docs/kit/service-workers)
