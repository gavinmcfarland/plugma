function a() {
  figma.showUI(__html__, { width: 300, height: 260, themeColors: !0 }),
    (figma.ui.onmessage = (e) => {
      if (e.type === 'CREATE_RECTANGLES') {
        let o = 0,
          n = [];
        while (o < e.count) {
          const t = figma.createRectangle();
          (t.x = o * 150),
            (t.y = 0),
            t.resize(100, 100),
            (t.fills = [
              {
                type: 'SOLID',
                color: { r: Math.random(), g: Math.random(), b: Math.random() },
              },
            ]),
            n.push(t),
            o++;
        }
        figma.viewport.scrollAndZoomIntoView(n);
      }
    });
  function i() {
    const e = figma.currentPage.selection.length;
    figma.ui.postMessage({ type: 'POST_NODE_COUNT', count: e });
  }
  figma.on('selectionchange', i);
}
a();
