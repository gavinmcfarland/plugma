import { __html__ } from "plugma/frameworks/common/main/interceptHtmlString";
import { saveFigmaStyles } from "plugma/frameworks/common/main/saveFigmaStyles";

// Your app code below

figma.showUI(__html__, { width: 300, height: 500, themeColors: true });

saveFigmaStyles();
