# Deployment

K-OS III ships as a **static export** — a single `out/` folder of HTML, JS, CSS, and assets that any web host can serve. The same export works for `koolskull.github.io/k-os`, `2kool.tv/k-os`, Cloudflare Pages, Netlify, or a plain S3/R2 bucket.

The build is parameterized by two env vars:

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | URL path prefix the app is served under | `/k-os` |
| `NEXT_PUBLIC_ASSET_BASE` | Absolute URL of the assets host *(optional)* | `https://koolskull.github.io/k-os-assets` |
| `NEXT_PUBLIC_GAMES_BASE` | Absolute URL where WASM game bundles live *(optional)* | `https://github.com/Koolskull/K-OS-III/releases/download/v0.2.0-beta.1` |

Local dev (`npm run dev`) leaves all three unset — the app serves from `/` against `public/` like normal.

---

## Target 1 — `koolskull.github.io/k-os` (GitHub Pages)

### One-time manual setup

You need to do these three things in the browser; they can't be scripted.

1. **Rename the repo** (if it isn't already): `K-OS-III` → `K-OS` (any casing — GitHub URLs are case-insensitive). Settings → General → Repository name → "Rename".
   - This makes the project pages URL naturally land at `koolskull.github.io/K-OS/` (which lowercases to `/k-os/` in URLs).
   - If you'd rather keep the repo named `K-OS-III`, edit `NEXT_PUBLIC_BASE_PATH` in `.github/workflows/pages.yml` to `/K-OS-III` instead. The same artifact still deploys, just at a different path.

2. **Enable Pages with the Actions source.** Settings → Pages → Source → "GitHub Actions". (Not "Deploy from a branch" — that's the older mode.)

3. **Push to `master`.** The workflow at `.github/workflows/pages.yml` auto-runs, builds the export, and publishes. First deploy takes ~3 minutes; subsequent deploys ~90 seconds.

### After the first successful deploy

The URL will be in the workflow run's deploy step output. You can also find it under Settings → Pages.

```
https://koolskull.github.io/k-os/
```

Anything you push to `master` triggers a redeploy automatically.

### When the build fails

- **404 on /fonts/ files**: the CSS-patch step in `pages.yml` should handle this. If you change `NEXT_PUBLIC_BASE_PATH`, double-check the `sed` step rewrote your URLs (look at `out/_next/static/css/*.css` after a manual local build).
- **Mixed-content errors on assets**: only happens if `NEXT_PUBLIC_ASSET_BASE` points to an http:// (not https://) origin.
- **`Failed to fetch /Instruments/...`**: a literal `/`-path snuck in somewhere new. Run `grep -rn 'fetch("/' src` and wrap it in `assetUrl(...)` from `@/lib/assets`.

---

## Target 2 — `2kool.tv/k-os` (your own domain)

Same `out/` artifact. How you ship it depends on how 2kool.tv is hosted.

### Option A — 2kool.tv is on GitHub Pages with a custom domain

If `2kool.tv` itself is a Pages site (e.g. you have a `Koolskull/2kool.tv` repo with a CNAME), you can put K-OS at `/k-os/` by including the K-OS export inside that repo.

The cleanest pattern: a workflow in **K-OS-III** that pushes the built `out/` folder to a `k-os/` subdirectory inside the **2kool.tv** repo.

```yaml
# .github/workflows/deploy-2kool.yml — add when ready
- name: Deploy to 2kool.tv
  uses: peaceiris/actions-gh-pages@v4
  with:
    deploy_key: ${{ secrets.TWOKOOL_DEPLOY_KEY }}
    external_repository: Koolskull/2kool.tv
    publish_branch: main
    publish_dir: ./out
    destination_dir: k-os
```

Setup steps for this:
1. `ssh-keygen -t ed25519 -C "K-OS deploy to 2kool" -f deploy-key -N ""`
2. Public key (`deploy-key.pub`) → `Koolskull/2kool.tv` → Settings → Deploy keys, "Allow write access" ✓
3. Private key (`deploy-key`) → `Koolskull/K-OS-III` → Settings → Secrets and variables → Actions → name `TWOKOOL_DEPLOY_KEY`
4. Delete the local key files

### Option B — 2kool.tv is on Cloudflare Pages / Netlify / Vercel

These hosts can build directly from a Git remote OR accept an `out/` upload via API/CLI.

- **Cloudflare Pages**: connect the K-OS-III repo as a Pages project, set the framework preset to "Next.js (Static HTML Export)", env vars per the table above. Build command: `npm run build`, output dir: `out`. Set up a custom domain rewrite from `2kool.tv/k-os/*` to the Pages project (Cloudflare lets you do path-based routing).
- **Netlify**: same idea via netlify.toml. Set `[build] command = "npm run build"` and `publish = "out"`. For the `/k-os` path, use a redirect or split-test config.

### Option C — 2kool.tv is on a VPS / shared hosting

Build locally then rsync:

```bash
NEXT_PUBLIC_BASE_PATH=/k-os K_OS_EXPORT=true npm run build
rsync -avz --delete out/ user@2kool.tv:/var/www/2kool.tv/k-os/
```

Or extract the artifact from the GitHub Actions run (it's stored as `github-pages` artifact) and rsync from CI directly.

---

## Optional but recommended: separate assets repo

The K-OS-III repo's `public/` folder is currently 483 MB (mostly because SuperTux's WASM data file is 235 MB and isn't in git). For deploys that should include the game data, a separate **assets repo** is the easiest fix.

### Setup

1. **Create** `Koolskull/k-os-assets` (any visibility). Empty repo.
2. **Initialize** with everything from `K-OS-III/public/` that's static and rarely changes — sprites, fonts, Instruments, bible, gifs:
   ```bash
   cd /tmp && mkdir k-os-assets && cd k-os-assets
   git init
   cp -r /path/to/K-OS-III/public/{sprites,fonts,bible,gifs,Instruments} .
   git add . && git commit -m "Initial assets"
   git remote add origin git@github.com:Koolskull/k-os-assets.git
   git push -u origin main
   ```
3. **Enable Pages** on `Koolskull/k-os-assets` → Settings → Pages → Source: Deploy from branch → main.
4. **Set `NEXT_PUBLIC_ASSET_BASE`** in `.github/workflows/pages.yml`:
   ```yaml
   NEXT_PUBLIC_ASSET_BASE: https://koolskull.github.io/k-os-assets
   ```
5. **Push K-OS-III** — the next build pulls assets from the separate host.

### Bonus: ship SuperTux via GitHub Releases

The 235 MB `supertux2.data` file exceeds GitHub's 100 MB per-file repo limit. **Releases artifacts** can be 2 GB per file.

1. **Tag a release** in `Koolskull/K-OS-III`: `v0.2.0-beta.1` or whatever.
2. **Upload `supertux2.data`** + the rest of the SuperTux WASM package as release artifacts via the GitHub UI or `gh release upload`.
3. **Set `NEXT_PUBLIC_GAMES_BASE`** in the workflow:
   ```yaml
   NEXT_PUBLIC_GAMES_BASE: https://github.com/Koolskull/K-OS-III/releases/download/v0.2.0-beta.1
   ```
4. **Push a re-deploy.** SuperTux now actually loads.

(Note: WASM threading via SharedArrayBuffer needs `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` HTTP headers — GitHub Pages doesn't let you set these. SuperTux may not work even with the data file present; verify in dev mode first. Cloudflare Pages can set the headers if needed.)

---

## Local "preview the production build" check

To verify everything works at `/k-os` before pushing:

```bash
NEXT_PUBLIC_BASE_PATH=/k-os K_OS_EXPORT=true npm run build
npx serve out -l 3000
# open http://localhost:3000/k-os/
```

Don't open `http://localhost:3000/` directly — it'll 404. The basePath is a real prefix.

---

## Summary table

| Target | Build env | Where the work happens |
|---|---|---|
| `koolskull.github.io/k-os` | `NEXT_PUBLIC_BASE_PATH=/k-os` | `.github/workflows/pages.yml` (already wired) |
| `2kool.tv/k-os` | same | Add `.github/workflows/deploy-2kool.yml` once 2kool.tv hosting is decided |
| `koolskull.github.io/k-os-assets` (assets host, optional) | n/a | Separate repo, just static files |
| Local `npm run dev` | nothing | served from `/`, assets from `/public/` |

The point of the env-var design: the **same `out/` artifact** ships to GitHub Pages, 2kool.tv, and any future host that mounts at `/k-os`. One build, many destinations.
