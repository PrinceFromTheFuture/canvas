"use client";

import * as React from "react";

export type RenderTarget = "web" | "pdf";

const RenderTargetContext = React.createContext<RenderTarget>("web");

/**
 * The render target the current subtree is being rendered for. Vocabulary
 * components branch on this to return DOM (web) or @react-pdf primitives
 * (pdf). The AI-authored report never reads this; it is an implementation
 * detail of the components.
 */
export function useRenderTarget(): RenderTarget {
  return React.useContext(RenderTargetContext);
}

export function RenderTargetProvider({
  target,
  children,
}: {
  target: RenderTarget;
  children: React.ReactNode;
}) {
  return <RenderTargetContext.Provider value={target}>{children}</RenderTargetContext.Provider>;
}
