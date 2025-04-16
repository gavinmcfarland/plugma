import { writable } from 'svelte/store';
import { createHighlighter } from 'shiki';

export const highlighter = writable(null);

// Initialize the highlighter immediately
createHighlighter({
	themes: [{
		name: 'github-dark',
		settings: [{
			scope: ['*'],
			settings: {
				foreground: 'var(--code-foreground)',
				background: 'var(--code-background)'
			}
		}, {
			scope: ['keyword', 'keyword.control'],
			settings: {
				foreground: 'var(--code-keyword)'
			}
		}, {
			scope: ['string'],
			settings: {
				foreground: 'var(--code-string)'
			}
		}, {
			scope: ['number'],
			settings: {
				foreground: 'var(--code-number)'
			}
		}, {
			scope: ['comment'],
			settings: {
				foreground: 'var(--code-comment)'
			}
		}, {
			scope: ['entity.name.function'],
			settings: {
				foreground: 'var(--code-function)'
			}
		}, {
			scope: ['variable'],
			settings: {
				foreground: 'var(--code-variable)'
			}
		}, {
			scope: ['operator'],
			settings: {
				foreground: 'var(--code-operator)'
			}
		}],
	}],
	langs: ['javascript', 'typescript', 'bash', 'json', 'markdown', 'jsonc', 'html', 'css']
}).then((h) => {
	highlighter.set(h);
});
