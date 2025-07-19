figma.on('run', () => {
	const selection = figma.currentPage.selection;

	if (selection.length === 0) {
	  figma.notify("Select at least one layer to flatten.");
	  figma.closePlugin();
	  return;
	}

	try {
	  const vector = figma.flatten(selection);
	  figma.currentPage.selection = [vector];
	  figma.viewport.scrollAndZoomIntoView([vector]);
	  figma.notify("Selection flattened to a vector.");
	} catch (e) {
	  figma.notify("Failed to flatten selection.");
	  console.error(e);
	}

	figma.closePlugin();
  });
