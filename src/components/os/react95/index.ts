/*
 *                    ☦
 *      K-OS ↔ REACT95 BRIDGE
 *
 *  Thin re-export barrel. Prefer importing from here so call sites get
 *  the K-OS-themed primitives without having to remember the provider.
 *
 *  For React95's own components (Button, MenuList, Tabs, ProgressBar,
 *  TreeView, ColorInput, etc.), import directly from "react95" inside
 *  a subtree wrapped in <React95Provider>.
 *
 *  See React95Provider.tsx for the usage contract and why the provider
 *  is NOT auto-mounted at the app root.
 */

export { React95Provider } from "./React95Provider";
export { kOsTheme } from "./kOsTheme";
