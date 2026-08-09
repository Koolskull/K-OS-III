# App Manager — Spec

**Status:** Restored + extended (2026-08-09). Local installs + badges + usage clock; account sync via Postgres profile (not only PocketBase).

## Goals

- Keep the OS shell always available without login.
- Do not put every app on the desktop by default.
- Users **install** bundled apps via App Manager; icons appear after install.
- Award **local badges** on install.
- Measure **time spent** per app (client focus clock).
- Optionally publish installs / time / badges on **public profile**.

## Tiers

| Tier | Behavior |
|------|----------|
| `core` | Always installed; cannot uninstall. App Manager, Manual, Education, Account (if backend). |
| `bundled` | Code ships in the shell; install toggles desktop visibility. |

## Pre-install defaults

Fresh session: **Education**, **Bible**, **KoolDraw**, plus all core apps.

## Storage

| Key / field | Role |
|-------------|------|
| `localStorage` `kos-app-installs-v1` | Install set |
| `localStorage` `kos-user-badges-v1` | Earned badges |
| `localStorage` `kos-app-usage-v1` | Time totals (ms) |
| `profiles.apps_activity` JSONB | Cloud mirror after sync |
| `profiles.show_install_list` | Public installs (default **false**) |
| `profiles.show_time_stats` | Public time (default **false**) |
| `profiles.show_badges` | Public badges (default **true**) |

## Modules

| Path | Role |
|------|------|
| `src/lib/apps/catalog.ts` | Package registry + versions + docs |
| `src/lib/apps/installStore.ts` | Install / uninstall / desktop list |
| `src/lib/apps/badges.ts` | Install badges |
| `src/lib/apps/usageClock.ts` | Focus timers |
| `src/lib/apps/activitySync.ts` | POST payload builder |
| `src/app/api/apps/activity` | Sync to profile |
| `src/components/apps/appmanager/AppManagerApp.tsx` | UI |
| `src/components/os/Desktop.tsx` | Icons from install set |
| `src/app/page.tsx` | Launch gate + usage focus |

## Launch gate

If `launchApp(id)` and app is not installed → open **App Manager** with that package highlighted.

## Public profile

`GET /api/users/[id]` includes `apps.installs` / `apps.usage` / `apps.badges` only when the owner’s privacy flags allow (or viewer is self).

## What happened historically

Phase A was built 2026-08-07 in session but **never committed** to a durable branch; a thinner reimplementation (local install only) landed later. This spec’s full stack is restored on `deploy/2kool-app-merged` with usage + profile privacy wired to the existing Auth.js/Neon path.
