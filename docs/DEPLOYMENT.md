# Deployment

K-OS III ships as a **static export** — a single `out/` folder of HTML, JS, CSS, and assets that any web host can serve. The same export works for `koolskull.github.io/K-OS-III`, `2kool.tv/k-os`, Cloudflare Pages, Netlify, or a plain S3/R2 bucket.

The build is parameterized by two env vars:

| Variable | Purpose | Example |
|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | URL path prefix the app is served under | `/k-os` or `/K-OS-III` |
| `NEXT_PUBLIC_ASSET_BASE` | Absolute URL of the assets host *(optional)* | `https://koolskull.github.io/k-os-assets` |
| `NEXT_PUBLIC_GAMES_BASE` | Absolute URL where WASM game bundles live *(optional)* | `https://github.com/Koolskull/K-OS-III/releases/download/v0.2.0-beta.1` |

Local dev (`npm run dev`) leaves all three unset — the app serves from `/` against `public/` like normal.

---

## Branch layout

| Branch | Role |
|---|---|
| **`master`** | Primary development. GitHub Pages for the project site builds from here (`.github/workflows/pages.yml`). |
| **`2kool.tv`** | Mirror kept in sync with `master` for the 2kool.tv deploy path. Auto-updated by `.github/workflows/sync-2kool-branch.yml` on every push to `master`. Builds `/k-os` export via `.github/workflows/deploy-2kool.yml`. |

**EDUCATION app, sovereignty / culture-machines lessons, quizzes, and desktop icon all live on both branches once sync has run.**

Do not land long-lived feature work only on `2kool.tv` — land on `master` and let sync carry it.

---

## Target 1 — GitHub Pages (project site)

### One-time manual setup

1. **Enable Pages with the Actions source.** Settings → Pages → Source → "GitHub Actions".
2. **Push to `master`.** Workflow `.github/workflows/pages.yml` builds with `NEXT_PUBLIC_BASE_PATH=/K-OS-III` (repo name path).

```
https://koolskull.github.io/K-OS-III/
```

Open desktop → **EDUCATION** (`§`) after boot.

### When the build fails

- **404 on /fonts/ files**: the CSS-patch step in `pages.yml` should handle this.
- **`Failed to fetch /education/...`**: lesson paths must go through `assetUrl(...)` (the EDUCATION app already does).

---

## Target 2 — `2kool.tv/k-os`

### Branch + CI (already wired)

1. Branch **`2kool.tv`** tracks `master` (sync workflow).
2. On every push to `2kool.tv`, **Build 2kool.tv /k-os export** runs:
   - `NEXT_PUBLIC_BASE_PATH=/k-os`
   - `K_OS_EXPORT=true npm run build`
   - Uploads artifact **`2kool-tv-k-os`** (download from the Actions run)
3. Optional: if secret **`TWOKOOL_DEPLOY_KEY`** is set, the same workflow pushes `out/` to `Koolskull/2kool.tv` → `main` → subdirectory `k-os/`.

### Option A — External GitHub Pages repo for the domain

If `2kool.tv` is a Pages site (e.g. `Koolskull/2kool.tv` + CNAME):

1. `ssh-keygen -t ed25519 -C "K-OS deploy to 2kool" -f deploy-key -N ""`
2. Public key → `Koolskull/2kool.tv` → Settings → Deploy keys → Allow write access
3. Private key → `Koolskull/K-OS-III` → Secrets → Actions → `TWOKOOL_DEPLOY_KEY`
4. Delete local key files
5. Push to `master` (sync → `2kool.tv` → deploy workflow)

### Option B — Cloudflare Pages / Netlify / Vercel

Connect the repo, set:

- Build: `K_OS_EXPORT=true NEXT_PUBLIC_BASE_PATH=/k-os npm run build`
- Output: `out`
- Prefer branch `2kool.tv` or `master` (same content after sync)

### Option C — VPS / rsync

```bash
# From a machine with the repo, or download artifact 2kool-tv-k-os from Actions
NEXT_PUBLIC_BASE_PATH=/k-os K_OS_EXPORT=true npm run build
rsync -avz --delete out/ user@2kool.tv:/var/www/2kool.tv/k-os/
```

Or extract the **`2kool-tv-k-os`** artifact from the latest "Build 2kool.tv /k-os export" run.

---

## Optional: separate assets repo

See prior notes: `NEXT_PUBLIC_ASSET_BASE` / `NEXT_PUBLIC_GAMES_BASE` for large WASM. EDUCATION markdown under `public/education/` is small and ships inside the main export — no assets-repo change required.

---

## Local preview of production paths

```bash
# GitHub project pages path
NEXT_PUBLIC_BASE_PATH=/K-OS-III K_OS_EXPORT=true npm run build
npx serve out -l 3000
# open http://localhost:3000/K-OS-III/

# 2kool.tv path
NEXT_PUBLIC_BASE_PATH=/k-os K_OS_EXPORT=true npm run build
npx serve out -l 3001
# open http://localhost:3001/k-os/
```

---

## Summary

| Target | Branch | BASE_PATH | Workflow |
|---|---|---|---|
| `koolskull.github.io/K-OS-III` | `master` | `/K-OS-III` | `pages.yml` |
| `2kool.tv/k-os` | `2kool.tv` (synced from master) | `/k-os` | `sync-2kool-branch.yml` + `deploy-2kool.yml` |
| Local dev | any | _(empty)_ | `npm run dev` |

One codebase, two deploy prefixes. EDUCATION lessons and MCQ progress work on both once the static export includes `public/education/**` (it does).
