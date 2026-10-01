/*
 *                    ☦
 *      K-OS REACT95 THEME TOKENS
 *
 *  A monochrome black/white palette for the React95 component library,
 *  aligned with K-OS's UI rules (no gradients, no rounded corners, no
 *  anti-aliasing — enforced globally by src/app/globals.css).
 *
 *  Where to use: wrap any subtree in <React95Provider> from this folder,
 *  then React95 primitives (Button, MenuList, Tabs, ProgressBar, etc.)
 *  inside will pick up these tokens automatically.
 *
 *  What this theme is NOT: a replacement for the bespoke K-OS AppWindow
 *  chrome. AppWindow.tsx stays authoritative for desktop window framing.
 *  React95's own <Window> is available for app authors who want to hand-
 *  roll a secondary window style (dialogs, inspectors, etc.) but should
 *  not be swapped in for AppWindow without maintainer sign-off.
 */

// React95's Theme type is not re-exported at runtime in a way that's easy
// to import from consumer code; we type the tokens loosely here and rely
// on React95's runtime to consume whichever keys it recognizes.
export const kOsTheme = {
  name: "k-os",

  // Links / focus
  anchor: "#ffff00",
  anchorVisited: "#888800",
  focusSecondary: "#ffff00",

  // Frame edges — monochrome stepping, darkest to lightest
  borderDarkest: "#000000",
  borderDark: "#222222",
  borderLight: "#444444",
  borderLightest: "#666666",

  // "Canvas" surfaces (inputs, scrollviews)
  canvas: "#000000",
  canvasText: "#ffffff",
  canvasTextDisabled: "#555555",
  canvasTextDisabledShadow: "#1a1a1a",
  canvasTextInvert: "#000000",

  // Check / radio marks
  checkmark: "#ffffff",
  checkmarkDisabled: "#555555",

  // Desktop background (when React95 paints one — K-OS normally owns this)
  desktopBackground: "#000000",

  // Flat panel edges
  flatDark: "#222222",
  flatLight: "#444444",

  // Titlebar / header
  headerBackground: "#000000",
  headerNotActiveBackground: "#1a1a1a",
  headerNotActiveText: "#888888",
  headerText: "#ffffff",
  hoverBackground: "#222222",

  // "Material" — the main panel body
  material: "#000000",
  materialDark: "#1a1a1a",
  materialText: "#ffffff",
  materialTextDisabled: "#555555",
  materialTextDisabledShadow: "#000000",
  materialTextInvert: "#000000",

  // Progress bars, tooltips
  progress: "#ffff00",
  tooltip: "#1a1a1a",
};
