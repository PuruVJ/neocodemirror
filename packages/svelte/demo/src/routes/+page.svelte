<script lang="ts">
	import { oneDark } from '@codemirror/theme-one-dark';
	import { codemirror, withCodemirrorInstance } from '@neocodemirror/svelte';

	const store = withCodemirrorInstance();

	const options = {
		svelte: {
			value: '<scr' + 'ipt>\n\tconsole.log("Hello, world!");\n</scr' + 'ipt>\n\nHello {world}',
		},
		js: {
			value: 'console.log("Hello, world!");',
		},
		md: {
			value: '# Hello\n ```js\nconsole.log("Hello, world!");\n```\n\nHello {world}',
		},
	};

	let selected: keyof typeof options = 'svelte';

	let isMarked = false;

	let cursorPos = 40;

	function change_pos() {
		$store.view?.focus();
		cursorPos = 0 + Math.floor(Math.random() * ($store.value?.length ?? 0));
	}

	$: console.log($store);
</script>

<button on:click={() => (selected = 'js')}>JS</button>
<button on:click={() => (selected = 'svelte')}>Svelte</button>
<button on:click={() => (selected = 'md')}>MD</button>

<button on:click={() => (isMarked = !isMarked)}>Toggle mark state</button>

<button on:click={change_pos}>Change cursor: {cursorPos}</button>

<div
	use:codemirror={{
		value: options[selected].value,
		setup: 'basic',
		lang: selected,
		langMap: {
			js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
			svelte: () => import('@replit/codemirror-lang-svelte').then((m) => m.svelte()),
			md: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
		},
		useTabs: true,
		tabSize: 2,
		theme: oneDark,
		extensions: [],
		instanceStore: store,
	}}
	on:codemirror:change={(e) => (options[selected].value = e.detail)}
/>

<style>
	div :global(*) {
		font-family: 'Jetbrains mono';
	}

	div :global(.cm-mark) {
		background-color: #ff0000;
	}
</style>
