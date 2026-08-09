# PRODEV

Modular Production Development Tool for K-OS-III

See original prompt in ARCHITECTURE.md

**Status:** this directory is the original design skeleton (kept for history/reference). The real, running implementation lives in the main app:

- Schema: `../db/schema.sql` (`prodev_projects`, `prodev_shots`, `prodev_checklist_items`, `prodev_shot_credits`, `prodev_members`)
- API: `../src/app/api/prodev/`
- UI: `../src/components/apps/prodev/PRODEVApp.tsx` (the "PRODEV" desktop app)

`src/core/types.ts`'s `ChecklistItem`/`Shot`/`Project` interfaces are the ones actually built against — `owner`/`credits` are no longer free-form strings, they key off real K-OS user accounts (see `../docs/ACCOUNTS_SPEC.md` § 4.2). `src/blockchain/ledger.ts` and `src/ui/ChecklistComponent.tsx` are still unbuilt placeholders — the checklist UI is `PRODEVApp.tsx` instead, and the ledger's offline-signed-attestation design is still just a plan (§ 4.1), not yet code.