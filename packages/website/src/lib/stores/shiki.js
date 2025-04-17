import { writable } from 'svelte/store';
import { createHighlighter } from 'shiki';
import { createHighlighterCoreSync } from 'shiki/core'
import js from '@shikijs/langs/javascript'
import bash from '@shikijs/langs/bash'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

export const highlighter = writable({});

// // Initialize the highlighter immediately
// createHighlighter({
// 	themes: [{
// 		name: 'github-dark',
// 		bg: 'transparent',
// 		fg: 'var(--code-punctuation)',
// 		settings: [

// 			{
// 				scope: ['*'],
// 				settings: {
// 					foreground: '#fff',
// 				}
// 			},
// 			{
// 				scope: ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'],
// 				settings: {
// 					foreground: 'var(--code-keyword)'
// 				}
// 			},
// 			{
// 				scope: ['string', 'string.quoted', 'string.template'],
// 				settings: {
// 					foreground: 'var(--code-string)'
// 				}
// 			},
// 			{
// 				scope: ['constant.numeric', 'constant.language', 'constant.character'],
// 				settings: {
// 					foreground: 'var(--code-number)'
// 				}
// 			},
// 			{
// 				scope: ['comment', 'comment.line', 'comment.block'],
// 				settings: {
// 					foreground: 'var(--code-comment)',
// 					fontStyle: 'italic'
// 				}
// 			},
// 			{
// 				scope: ['entity.name.function', 'support.function'],
// 				settings: {
// 					foreground: 'var(--code-function)'
// 				}
// 			},
// 			{
// 				scope: ['variable', 'variable.other', 'variable.parameter', 'support.variable'],
// 				settings: {
// 					foreground: 'var(--code-variable)'
// 				}
// 			},
// 			{
// 				scope: ['operator', 'keyword.operator'],
// 				settings: {
// 					foreground: 'var(--code-operator)'
// 				}
// 			},
// 			{
// 				scope: ['punctuation'],
// 				settings: {
// 					foreground: 'var(--code-punctuation)'
// 				}
// 			},
// 			{
// 				scope: ['entity.name.type', 'support.type', 'support.class', 'support.type.property-name', "variable",
// 					"meta.definition.variable.name",
// 					"support.variable",
// 					"entity.name.variable",
// 					"constant.other.placeholder"],
// 				settings: {
// 					foreground: 'var(--code-type)'
// 				}
// 			},
// 			{
// 				scope: ['meta.tag', 'entity.name.tag', "support.class",
// 					"support.type",
// 					"entity.name.type",
// 					"entity.name.namespace",
// 					"entity.other.attribute",
// 					"entity.name.scope-resolution",
// 					"entity.name.class",
// 					"storage.type.numeric.go",
// 					"storage.type.byte.go",
// 					"storage.type.boolean.go",
// 					"storage.type.string.go",
// 					"storage.type.uintptr.go",
// 					"storage.type.error.go",
// 					"storage.type.rune.go",
// 					"storage.type.cs",
// 					"storage.type.generic.cs",
// 					"storage.type.modifier.cs",
// 					"storage.type.variable.cs",
// 					"storage.type.annotation.java",
// 					"storage.type.generic.java",
// 					"storage.type.java",
// 					"storage.type.object.array.java",
// 					"storage.type.primitive.array.java",
// 					"storage.type.primitive.java",
// 					"storage.type.token.java",
// 					"storage.type.groovy",
// 					"storage.type.annotation.groovy",
// 					"storage.type.parameters.groovy",
// 					"storage.type.generic.groovy",
// 					"storage.type.object.array.groovy",
// 					"storage.type.primitive.array.groovy",
// 					"storage.type.primitive.groovy"],
// 				settings: {
// 					foreground: 'var(--code-tag)'
// 				}
// 			},



// 		],
// 	}],
// 	langs: ['javascript', 'typescript', 'bash', 'json', 'markdown', 'jsonc', 'html', 'css']
// }).then((h) => {
// 	// Override the codeToHtml method to only remove background color
// 	const originalCodeToHtml = h.codeToHtml;
// 	h.codeToHtml = (...args) => {
// 		const html = originalCodeToHtml.apply(h, args);
// 		return html.replace(/background-color:[^;]+;/g, '');
// 	};

// 	highlighter.set(h);

// });


const highlighterSync = createHighlighterCoreSync({
	engine: createJavaScriptRegexEngine(),
	themes: [{
		name: 'github-dark',
		bg: 'transparent',
		fg: 'var(--code-punctuation)',
		settings: [

			{
				scope: ['*'],
				settings: {
					foreground: '#fff',
				}
			},
			{
				scope: ['keyword', 'keyword.control', 'storage.type', 'storage.modifier'],
				settings: {
					foreground: 'var(--code-keyword)'
				}
			},
			{
				scope: ['string', 'string.quoted', 'string.template'],
				settings: {
					foreground: 'var(--code-string)'
				}
			},
			{
				scope: ['constant.numeric', 'constant.language', 'constant.character'],
				settings: {
					foreground: 'var(--code-number)'
				}
			},
			{
				scope: ['comment', 'comment.line', 'comment.block'],
				settings: {
					foreground: 'var(--code-comment)',
					fontStyle: 'italic'
				}
			},
			{
				scope: ['entity.name.function', 'support.function'],
				settings: {
					foreground: 'var(--code-function)'
				}
			},
			{
				scope: ['variable', 'variable.other', 'variable.parameter', 'support.variable'],
				settings: {
					foreground: 'var(--code-variable)'
				}
			},
			{
				scope: ['operator', 'keyword.operator'],
				settings: {
					foreground: 'var(--code-operator)'
				}
			},
			{
				scope: ['punctuation'],
				settings: {
					foreground: 'var(--code-punctuation)'
				}
			},
			{
				scope: ['entity.name.type', 'support.type', 'support.class', 'support.type.property-name', "variable",
					"meta.definition.variable.name",
					"support.variable",
					"entity.name.variable",
					"constant.other.placeholder"],
				settings: {
					foreground: 'var(--code-type)'
				}
			},
			{
				scope: ['meta.tag', 'entity.name.tag', "support.class",
					"support.type",
					"entity.name.type",
					"entity.name.namespace",
					"entity.other.attribute",
					"entity.name.scope-resolution",
					"entity.name.class",
					"storage.type.numeric.go",
					"storage.type.byte.go",
					"storage.type.boolean.go",
					"storage.type.string.go",
					"storage.type.uintptr.go",
					"storage.type.error.go",
					"storage.type.rune.go",
					"storage.type.cs",
					"storage.type.generic.cs",
					"storage.type.modifier.cs",
					"storage.type.variable.cs",
					"storage.type.annotation.java",
					"storage.type.generic.java",
					"storage.type.java",
					"storage.type.object.array.java",
					"storage.type.primitive.array.java",
					"storage.type.primitive.java",
					"storage.type.token.java",
					"storage.type.groovy",
					"storage.type.annotation.groovy",
					"storage.type.parameters.groovy",
					"storage.type.generic.groovy",
					"storage.type.object.array.groovy",
					"storage.type.primitive.array.groovy",
					"storage.type.primitive.groovy"],
				settings: {
					foreground: 'var(--code-tag)'
				}
			},



		],
	}],
	langs: [js, bash]
})

highlighter.set(highlighterSync);
