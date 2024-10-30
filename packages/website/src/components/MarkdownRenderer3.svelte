<script>
	import { onMount, afterUpdate, onDestroy } from 'svelte';
	import { marked } from 'marked';

	export let source = '';
	export let renderers = {};

	const renderer = new marked.Renderer();

	marked.setOptions({
		renderer,
		gfm: true,
		breaks: true
	});

	// Define custom rendering functions for each token type
	Object.keys(renderers).forEach((key) => {
		renderer[key] = (token) => {
			const inlineHTML = marked.parseInline(token.text); // Inline markdown parsed to HTML
			if (key === 'heading') {
				return `<div data-type="${key}" data-depth="${token.depth || ''}">${inlineHTML}</div>`;
			} else if (key === 'code') {
				return `<div data-type="${key}" data-lang="${token.lang || ''}">${token.text}</div>`;
			} else {
				return `<div data-type="${key}">${inlineHTML}</div>`;
			}
		};
	});

	let html = '';
	let mountedComponents = []; // Store references to mounted components

	// Reactive statement to update `html` whenever `source` changes
	$: html = marked(source);

	// Function to replace placeholders with custom components
	function replacePlaceholders() {
		if (typeof document === 'undefined') return; // Ensure this only runs in the browser

		const container = document.querySelector('.container');

		// Clean up previous components
		mountedComponents.forEach((instance) => instance.$destroy());
		mountedComponents = []; // Reset the array

		Object.keys(renderers).forEach((key) => {
			const placeholders = container.querySelectorAll(`[data-type="${key}"]`);

			const Component = renderers[key];

			placeholders.forEach((placeholder) => {
				// Gather any additional attributes for props
				const lang = placeholder.getAttribute('data-lang');
				const depth = placeholder.getAttribute('data-depth');
				const inlineHTML = placeholder.innerHTML; // Retrieve the inline HTML content

				const props = {
					text: inlineHTML,
					lang: lang || undefined,
					depth: depth ? Number(depth) : undefined
				};

				// Create a temporary container to mount the component
				const tempDiv = document.createElement('div');

				// Mount the custom component to the tempDiv with all gathered props
				const componentInstance = new Component({
					target: tempDiv,
					props
				});

				// Store reference to mounted component
				mountedComponents.push(componentInstance);

				// Replace the placeholder with the custom component's content
				placeholder.replaceWith(...tempDiv.childNodes);
			});
		});
	}

	function setSummaryState() {
		const isDesktop = window.innerWidth > 768;

		if (isDesktop) {
			// Select all <summary> elements and add the `open` attribute
			document.querySelectorAll('summary').forEach((summary) => {
				summary.parentElement.open = true;
			});
		}
	}

	function addStickyClass() {
		// Use this function for each summary element
		const stickyElements = document.querySelectorAll('summary');
		const toolbarHeight = 56;
		const offsetMargin = 0; // Adjust as needed

		window.addEventListener('scroll', () => {
			stickyElements.forEach((sticky) => {
				const rect = sticky.getBoundingClientRect();
				// Check if the element has reached below the toolbar
				if (rect.top <= toolbarHeight + offsetMargin) {
					sticky.classList.add('is-sticky');
				} else {
					sticky.classList.remove('is-sticky');
				}
			});
		});
	}

	onMount(() => {
		replacePlaceholders(); // Initial replacement on mount
		addStickyClass();
		setSummaryState();
	});

	// Use afterUpdate to re-run `replacePlaceholders` when `html` changes
	afterUpdate(() => {
		replacePlaceholders();
		addStickyClass();
		setSummaryState();
	});

	// Clean up all mounted components on component destroy
	onDestroy(() => {
		mountedComponents.forEach((instance) => instance.$destroy());
		mountedComponents = []; // Clear the array
	});
</script>

<div class="container">{@html html}</div>
