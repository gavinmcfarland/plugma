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

	$: html_now = hljs.highlight(text, { language: 'bash' }).value;

	onMount(() => {
		document.addEventListener('DOMContentLoaded', (event) => {
			hljs.highlightAll();
		});
	});
</script>

<!-- <svelte:head>
	  {@html github}
  </svelte:head> -->

<pre><code>{@html html_now}</code></pre>

<!-- <pre class="host"><code class={lang}>{@html html_now}</code></pre> -->

<style global>
	code {
		padding: var(--size-1);
		cursor: text;
	}

	p > code {
		padding-left: var(--size-1);
		padding-right: var(--size-1);
		white-space: nowrap;
	}

	div code,
	pre code {
		border: 1px solid var(--border-color-tertiary);
		border-radius: 2px;
	}

	code {
		cursor: text;
	}

	:not(p) > code {
		/* border: 1px solid; */
		padding: var(--size-3);
		overflow-x: scroll;
	}
</style>
