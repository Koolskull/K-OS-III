# NOTES app (K-OS III)

Personal notebook with **per-note to-do lists**.

## Behaviour

| Feature | Detail |
|--------|--------|
| **Private by default** | New notes are only visible under **MINE** for your local profile |
| **Publish** | Toggle **PUBLISH** to put a note on the **PUBLIC** feed |
| **To-dos** | Checklist items live on each note entry |
| **Profile name** | Click your name in the toolbar — used as author on public notes |
| **Local-first** | Stored in `localStorage` (`kos-notes-v1`) — works offline, no accounts required |

## Privacy model

- Each browser profile gets a stable local user id (`kos-notes-user-v1`).
- Private notes are scoped to that id — other profiles on the same machine do not see them.
- Public notes are readable by every profile that shares the same browser storage (same install).
- This matches K-OS offline-first philosophy. True multi-device multi-user cloud sync is a separate deploy path (see Grok Build cloud Notes if you need account-backed sharing).

## Desktop

- Icon: **NOTES** (`✎`)
- App id: `notes`
- Default window: 860×620

## Shortcuts

- `Ctrl/Cmd+N` — new note
