/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'selector',
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			lineHeight: {
				tight: '1.1', // Custom value for tight line height
			},
		},
	},
	plugins: [
		function ({ addComponents }) {
			addComponents({
				'.bg-color': { backgroundColor: 'var(--color-bg)' },
				'.text-color': { color: 'var(--color-text)' },
				'.border-color': { borderColor: 'var(--color-border)' },
			});
		},
	],
}

