export function showUI(options, data) {
	if (typeof __html__ === 'undefined') {
		throw new Error('No UI defined');
	}

	const html = `<div id="create-figma-plugin"></div><script>document.body.classList.add('theme-${figma.editorType}');const __FIGMA_COMMAND__='${typeof figma.command === 'undefined' ? '' : figma.command}';const __SHOW_UI_DATA__=${JSON.stringify(typeof data === 'undefined' ? {} : data)};</script>${__html__}`;

	figma.showUI(html, {
		...options,

		themeColors: typeof options.themeColors === 'undefined' ? true : options.themeColors,
	});
}
