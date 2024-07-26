<script>
	import { onMount } from 'svelte';
	// import Highlight from "svelte-highlight";
	// import js from "svelte-highlight/languages/js";
	import hljs from 'highlight.js';
	import bash from 'highlight.js/lib/languages/bash';

	// import { HighlightAuto } from "svelte-highlight";
	// import github from "svelte-highlight/styles/github";

	hljs.registerLanguage('bash', bash);

	export let lang;
	export let text;

	$: html_now = hljs.highlight(text, { language: lang }).value;

	onMount(() => {
		document.addEventListener('DOMContentLoaded', (event) => {
			hljs.highlightAll();
		});
	});
</script>

<!-- <svelte:head>
	  {@html github}
  </svelte:head> -->

<!-- <pre><code>{@html html_now}</code></pre> -->

<pre class="host"><code class="language-{lang}">{@html html_now}</code></pre>

<style>
	/* .host {
		border: 1px solid var(--border-color);
		border-radius: 4px;
	}

	code {
		padding: var(--em-0);
	} */
</style>
