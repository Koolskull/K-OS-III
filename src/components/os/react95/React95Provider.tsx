"use client";

/*
 *                    ☦
 *      REACT95 PROVIDER — K-OS THEMED
 *
 *  Opt-in wrapper that enables React95 primitives (Button, MenuList,
 *  Tabs, ProgressBar, TreeView, ColorInput, etc.) for any subtree.
 *
 *  Usage:
 *
 *      import { React95Provider } from "@/components/os/react95/React95Provider";
 *      import { Button } from "react95";
 *
 *      export function MyApp() {
 *        return (
 *          <React95Provider>
 *            <Button>Click me</Button>
 *          </React95Provider>
 *        );
 *      }
 *
 *  The provider wires up three things:
 *    1. styled-components SSR registry (no FOUC on the first paint)
 *    2. React95's styleReset (normalizes cross-browser defaults)
 *    3. K-OS's monochrome theme tokens (no gradients, black/white base,
 *       yellow for interactive, aligned with the UI rules in
 *       koolskull-os-ui-notes.md and enforced by globals.css)
 *
 *  The provider is deliberately NOT mounted at the root of the app. The
 *  bespoke AppWindow chrome and existing OS shell stay authoritative.
 *  React95 is a toolbox for secondary UI (dialogs, menus, inspectors,
 *  future app primitives) — wrap the specific subtree that needs it.
 */

import React from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { styleReset } from "react95";
import { kOsTheme } from "./kOsTheme";
import { StyledComponentsRegistry } from "./StyledComponentsRegistry";

// React95's styleReset + a minimal K-OS override. We re-zero border-radius
// here because styled-components is higher-specificity than globals.css in
// some cases; keeping a local guard avoids a rounded-corner sneaking in.
const GlobalStyles = createGlobalStyle`
  ${styleReset}
  *, *::before, *::after {
    border-radius: 0 !important;
  }
  img { image-rendering: pixelated; }
`;

export function React95Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={kOsTheme}>
        <GlobalStyles />
        {children}
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
}
