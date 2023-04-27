<script lang="ts">
	import { codemirror, withCodemirrorInstance } from '$lib';
	import { svelte } from '@replit/codemirror-lang-svelte';
	import { javascript } from '@codemirror/lang-javascript';
	import { oneDarkTheme } from '@codemirror/theme-one-dark';

	const store = withCodemirrorInstance();

	const options = {
		svelte: {
			value: '<scr' + 'ipt>\n\tconsole.log("Hello, world!");\n</scr' + 'ipt>',
			lang: svelte(),
		},
		js: {
			value: 'console.log("Hello, world!");',
			lang: javascript(),
		},
	};

	let selected: keyof typeof options = 'svelte';

	$: console.log($store);
</script>

<button on:click={(e) => (selected = selected === 'js' ? 'svelte' : 'js')}>Toggle</button>

<div
	use:codemirror={{
		value: options[selected].value,
		setup: 'basic',
		lang: options[selected].lang,
		useTabs: true,
		tabSize: 2,
		theme: oneDarkTheme,
		instanceStore: store,
	}}
	on:codemirror:change={(e) => (options[selected].value = e.detail)}
/>
