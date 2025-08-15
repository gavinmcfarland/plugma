import { defineManifest } from 'plugma/utils';

export default defineManifest(() => {
	return {
		id: 'com.plugma-sandbox',
		name: 'plugma-sandbox',
		main: 'src/main.ts',
		ui: 'src/ui.ts',
		editorType: ['figma', 'figjam', 'slides'],
		networkAccess: {
			allowedDomains: ['none'],
			devAllowedDomains: ['http://localhost:*', 'ws://localhost:9001', 'https://example.com'],
		},
		api: '1.0.0',
	};
});
