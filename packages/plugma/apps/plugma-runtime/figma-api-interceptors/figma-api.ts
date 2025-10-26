/**
 * References to native Figma functions.
 * Since our runtime code is injected after all Vite transformations,
 * we can safely access Figma APIs directly.
 */
export const figmaApi = {
  resize: figma.ui.resize.bind(figma.ui),
  showUI: figma.showUI.bind(figma),
  reposition: figma.ui.reposition.bind(figma.ui),
} as const;
