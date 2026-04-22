# Screenshots

This folder holds the screenshots and GIFs referenced from the top of the project README and from `docs/`.

Keeping them under `public/` means Next.js serves them at `/screenshots/<file>` if anything in the OS itself ever wants to display them, and lets the README image links resolve both on GitHub and on the live demo.

## What goes here

The README hero row expects four images, in this order:

| File | What it should show | Notes |
|---|---|---|
| `boot.png` | The K-OS III boot sequence mid-scroll — Rosary text or Psalms visible, terminal styling unmistakable | Capture early so the screen has black background and the cursor is visible |
| `datamoshpit-phrase.png` | The Datamoshpit phrase editor with at least one channel filled in, Slimentologika or hex visible | Make it look like a real working session, not an empty grid |
| `sprite-editor.png` | The sprite editor with a frame open and the tool palette visible | Bonus points for an in-progress pixel piece |
| `desktop.png` | The K-OS III desktop with **multiple** windows open — at least Datamoshpit + one other app, taskbar visible | This is the elevator-pitch shot. Make it dense |

Animated GIFs are welcome and encouraged for the same slots — name them `.gif` and update the README link if you go that route.

## How to contribute a screenshot

1. Run the project locally (`npm run dev`).
2. Get the OS into the state described above.
3. Capture at native resolution — do not upscale, do not anti-alias, do not add a drop shadow. K-OS is pixel-correct; the screenshots have to be too.
4. Save as PNG (or animated GIF / APNG / WebP if you want motion). Keep file sizes reasonable; under ~500 KB per still.
5. Drop the file into this folder with the exact filename above.
6. Open a PR. Reference the issue from `docs/SEED_ISSUES.md` if there is one.

## Other shots that would help the project

These are not in the hero row but are wanted elsewhere — in `docs/`, social posts, grant applications:

- The Bible reader on a chapter page
- The boot sequence in a `.gif` so people see the scroll motion
- A handheld photo (Miyoo Mini / Anbernic / Steam Deck) running K-OS III in the browser
- The desktop on a 4K display showing the responsive scaling
- The instrument screen (F4) with a custom FM patch visible

If you contribute one of these, drop it here with a clear name and link it from the doc that uses it.

---

*Every pixel earns its place.*
