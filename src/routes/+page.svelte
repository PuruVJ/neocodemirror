<script lang="ts">
	import { codemirror, withCodemirrorInstance } from '$lib';
	import { svelte } from '@replit/codemirror-lang-svelte';

	const store = withCodemirrorInstance();

	// $: console.log($store);
</script>

<div
	use:codemirror={{
		value: '<scr' + 'ipt>\n\tconsole.log("Hello, world!");\n</script>',
		setup: 'basic',
		lang: svelte(),
		useTabs: true,
		tabSize: 2,
		instanceStore: store,
	}}
	on:neocm:change={(e) => console.log(e.detail)}
/>
