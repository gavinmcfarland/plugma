export function resizeFigmaBridge() {
  // const domEltargetNode = document.getElementById('app')
  const domEltargetNode = document.body;
  // Experiment to listen for changes to window size
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      // Access the size of the entry (the window in this case)
      const { width, height } = entry.contentRect;
      console.log('|||||resize the window', width, height);
      parent.postMessage(
        {
          pluginMessage: {
            event: 'PLUGMA_RESIZE_WINDOW',
            data: { width, height: 100 },
          },
          pluginId: '*',
        },
        '*',
      );
      // parent.postMessage({
      // 	pluginMessage: { event: 'RESIZE_WINDOW', data: { width, height: 100 } },
      // 	pluginId: "*"
      // }, '*');
    }
  });

  // Observe changes on the body or any element related to the window size
  resizeObserver.observe(domEltargetNode);
}
