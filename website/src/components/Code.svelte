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
		padding: var(--em-0);
		cursor: text;
	}

	p > code {
		padding-left: var(--rem--2);
		padding-right: var(--rem--2);
		white-space: nowrap;
	}

	div code,
	pre code {
		border: 1px solid var(--border-color-tertiary);
		border-radius: 2px;
	}
</style>
