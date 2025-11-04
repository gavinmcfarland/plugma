import { defineManifest } from 'plugma';

export default defineManifest(() => {
	return {
		id: 'com.plugma-sandbox',
		name: 'plugma-sandbox',
		main: 'src/main.ts',
		ui: 'src/ui.ts',
		editorType: ['figma', 'figjam', 'slides'],
		networkAccess: {
			allowedDomains: ['none'],
		},
	};
});
