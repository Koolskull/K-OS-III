"use client";

/*
 *                    ☦
 *      STYLED-COMPONENTS REGISTRY (Next.js App Router)
 *
 *  Collects the styled-components stylesheet during SSR and flushes it
 *  into the document head on the server-rendered pass, so there's no
 *  flash of unstyled content when React95 primitives first render.
 *
 *  Only needed when a subtree uses styled-components at all — which
 *  right now means anywhere React95 is used. Mount via React95Provider,
 *  not directly.
 */

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") {
    return <>{children}</>;
  }

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
