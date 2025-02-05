/**
 * References to native Figma functions.
 * Since our runtime code is injected after all Vite transformations,
 * we can safely access Figma APIs directly.
 */
export declare const figmaApi: {
    readonly resize: (width: number, height: number) => void;
    readonly showUI: (html: string, options?: ShowUIOptions) => void;
    readonly reposition: (x: number, y: number) => void;
};
