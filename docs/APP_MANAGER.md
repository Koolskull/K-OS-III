# App Manager

**Status:** v1 shipped (local installs)  
**Catalog:** `src/lib/apps/catalog.ts`  
**Install store:** `src/lib/apps/installs.ts` (`localStorage` key `kos-app-installs-v1`)

## Product rule

The desktop is **not** a dump of every app in the monorepo.

| Tier | Behavior |
|------|----------|
| **Core** | Always on the desktop. Cannot uninstall. App Manager, Manual, Account. |
| **Bundled** | Code ships in the build; user must **Install** in App Manager before the icon appears. |
| **Remote** (later) | Download package on install; versioned CDN/WASM. |

This keeps the shell calm, forces intentional installs, and lets each package carry its **own version + docs path**.

## Per-app compartmentalization

Each entry in `APP_CATALOG` has:

| Field | Purpose |
|-------|---------|
| `id` | Stable package id (`datamoshpit`, `shotlist`, …) |
| `version` | Package semver — bump when that app’s surface changes |
| `docsPath` | Repo path for long-form docs (e.g. `docs/SHOTLIST_SPEC.md`) |
| `manualSlug` | Optional in-OS MANUAL article |
| `requiresCloud` | Hidden/blocked without Node `/api` |

**Shell version** (`SHELL_VERSION` in catalog) is separate from package versions. A shell bump does not force every app version to change.

## Install flow (v1)

1. Open **APP MANAGER** (core icon or Start menu).
2. **Install** on a package → written to `localStorage` → desktop icon appears.
3. **Open** / double-click desktop icon → app launches (gate: must be installed).
4. **Uninstall** removes icon; data files for that app are not wiped (local-first).
5. **Update** marks `versionInstalled` to current catalog version (UI + future badges).

Guests work offline. Logged-in cloud sync of install sets is **not** required for v1 (planned: `user_app_installs` / PocketBase or existing profile store).

## Documentation index (packages)

| App | Docs |
|-----|------|
| App Manager | `docs/APP_MANAGER.md` (this file) |
| Account | `docs/ACCOUNTS_SPEC.md`, `docs/K_WALLET_SPEC.md` |
| Datamoshpit | `docs/DATAMOSHPIT_GUIDE.md`, `docs/DATAMOSHPIT_VIDEO_SPEC.md` |
| Shotlist | `docs/SHOTLIST_SPEC.md` |
| Notes | `docs/NOTES.md` |
| Education | `EDUCATION.md` |
| NodeMap | `docs/NODEMAP.md` |
| Stance | `docs/EPISTEMIC_STANCE.md` |
| Chat | `docs/CHAT_SPEC.md` |
| Manual | In-app articles under `src/lib/doc/` |

When you ship a meaningful change to an app:

1. Bump that package’s `version` in `catalog.ts`.
2. Update its docs path content (changelog paragraph at top is fine).
3. Users with an older `versionInstalled` see **UPDATE** in App Manager.

## Later

- Cloud-backed install lists + badges (design plan Phase A/B).
- True remote packages (WASM games, sample banks) with download progress.
- In-OS markdown viewer for `docsPath` without leaving the shell.
