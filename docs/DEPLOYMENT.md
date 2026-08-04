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

## Target 2 — `2kool.tv` (domain root on Apache/GCE)

### If you see: "Application error: a client-side exception has occurred while loading 2kool.tv"

That is almost always a **partial static deploy**:

- `index.html` was updated to a new Next.js build id
- some `/_next/static/chunks/*.js` files from that build were **not** uploaded
- the browser throws `ChunkLoadError` → Next shows the black client-side exception screen

**Fix:** replace the **entire** document root with one complete `out/` from CI (never mix builds).

1. Actions → latest green **Sync and build 2kool.tv** → download artifact **`2kool-tv-root-zip`**
2. On the server (GCE Apache at the 2kool.tv A record):

```bash
unzip 2kool-tv-root.zip -d /tmp/2kool-out
# point path at your real docroot (often /var/www/html or /var/www/2kool.tv)
rsync -avz --delete /tmp/2kool-out/ user@YOUR_SERVER:/var/www/html/
```

`--delete` is required so orphaned old chunks and a mismatched `index.html` cannot coexist.

3. Hard-refresh the phone (or clear site data). Prefer **https://2kool.tv/** once TLS is set on Apache.

**Working mirror while the domain is broken:**  
https://koolskull.github.io/K-OS-III/  (GitHub Pages build — includes EDUCATION)

### Branch + CI

### Legacy note (path `/k-os`)

Earlier docs assumed `2kool.tv/k-os`. Live Apache serves the app at **/**. CI now builds **root** (`NEXT_PUBLIC_BASE_PATH` empty, brand `2kool`).

## Target 2 — `2kool.tv/k-os`

### Branch + CI (already wired)

1. Branch **`2kool.tv`** tracks `master`.
2. On every push to **`master`**, workflow **Sync and build 2kool.tv** (`sync-2kool-branch.yml`):
   - Fast-forwards / merges `master` → `2kool.tv`
   - Builds with `NEXT_PUBLIC_BASE_PATH=/k-os`
   - Uploads artifact **`2kool-tv-k-os`**
   - (Build is in the same workflow because GitHub does not re-trigger workflows from `GITHUB_TOKEN` pushes to `2kool.tv`.)
3. Manual rebuild: Actions → **Build 2kool.tv /k-os export** → Run workflow (ref `2kool.tv`).
4. Optional later: secret **`TWOKOOL_DEPLOY_KEY`** to push `out/` into an external `2kool.tv` Pages repo under `/k-os/`.

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
| `2kool.tv/k-os` | `2kool.tv` (synced from master) | `/k-os` | `sync-2kool-branch.yml` (sync+build); `deploy-2kool.yml` (manual) |
| Local dev | any | _(empty)_ | `npm run dev` |

One codebase, two deploy prefixes. EDUCATION lessons and MCQ progress work on both once the static export includes `public/education/**` (it does).

---

## Server-side SSH checklist (GCE Apache → 2kool.tv)

CI **does not** SSH into your box yet. Every push to `master` builds a full static export
and uploads GitHub Actions artifacts (`2kool-tv-root` + `2kool-tv-root-zip`). **You**
(or a deploy key + future workflow step) must place that export on the server.

### A. One-time on the server

1. **SSH access works as a non-root deploy user** (example `deploy`):

```bash
# from your laptop
ssh-keygen -t ed25519 -C "2kool-deploy" -f ~/.ssh/2kool_deploy -N ""
ssh-copy-id -i ~/.ssh/2kool_deploy.pub deploy@YOUR_SERVER_IP
ssh -i ~/.ssh/2kool_deploy deploy@YOUR_SERVER_IP
```

2. **Document root + permissions** (Apache common paths):

```bash
# on server
sudo mkdir -p /var/www/2kool.tv
sudo chown -R deploy:www-data /var/www/2kool.tv
sudo chmod -R u+rwX,g+rX /var/www/2kool.tv
```

3. **Apache vhost** points `2kool.tv` at that docroot, with `AllowOverride All`
   (so the shipped `.htaccess` SPA rewrite works) and HTTPS (Certbot / your TLS).

4. **Confirm rewrite modules**:

```bash
sudo a2enmod rewrite headers
sudo systemctl reload apache2
```

### B. Every release (manual today)

1. GitHub → **Actions** → latest green **Sync and build 2kool.tv**
2. Download artifact **`2kool-tv-root-zip`**
3. From a machine that can SSH:

```bash
unzip 2kool-tv-root.zip -d /tmp/2kool-out
rsync -avz --delete -e "ssh -i ~/.ssh/2kool_deploy" \
  /tmp/2kool-out/ deploy@YOUR_SERVER_IP:/var/www/2kool.tv/
```

`--delete` is mandatory so old `/_next/static` chunks cannot mix with a new `index.html`.

4. Hard-refresh clients (or clear site data). Prefer `https://2kool.tv/`.

### C. Optional later: automated SSH from Actions

Not wired yet. When you want zero-touch deploys:

1. Create a dedicated ed25519 key pair used **only** for deploy.
2. Install the **public** key in `deploy@server:~/.ssh/authorized_keys`.
3. Put the **private** key in repo secret `TWOKOOL_SSH_KEY` (and host as `TWOKOOL_SSH_HOST`, user as `TWOKOOL_SSH_USER`, path as `TWOKOOL_DOCROOT`).
4. Add a final job step to `sync-2kool-branch.yml` that uses `appleboy/scp-action` or
   `rsync` over SSH with those secrets. Keep `rsync --delete` semantics.
5. Restrict the key with `from="GitHub Actions IP ranges"` if you can, and never reuse
   personal SSH keys as deploy secrets.

### D. Branch rule (lessons → 2kool.tv)

| Step | Action |
|---|---|
| 1 | Land EDUCATION lessons + code on **`master`** (not only on feature branches) |
| 2 | Wait for **Sync and build 2kool.tv** to go green (auto on push) |
| 3 | Confirm branch `2kool.tv` tip equals `master` |
| 4 | Redeploy artifact to Apache with full `rsync --delete` |

You do **not** need a separate push of lesson files into `2kool.tv` by hand — the sync
workflow mirrors `master`. What you *do* need is step 4 until SSH auto-deploy exists.

### E. Education progress / profiles (client)

Lesson completions are recorded in the browser:

| Key | Contents |
|---|---|
| `kos-education-progress-v1` | Per-lesson quiz status |
| `kos-user-profile-v1` | Display name, handle, mirrored education map |

EDUCATION home → **YOUR PROFILE · EDUCATION TRANSCRIPT** → set name/handle, copy share
card, or download JSON. Static host has no multi-user server profiles yet; the share
card is how operators show completions publicly until a backend profile service exists.

