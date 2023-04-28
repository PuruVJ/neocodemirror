<script lang="ts">
	import { javascript } from '@codemirror/lang-javascript';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { codemirror, withCodemirrorInstance } from '@neocodemirror/svelte';
	import { svelte } from '@replit/codemirror-lang-svelte';

	const store = withCodemirrorInstance();

	const options = {
		svelte: {
			value: '<scr' + 'ipt>\n\tconsole.log("Hello, world!");\n</scr' + 'ipt>\n\nHello {world}',
			lang: svelte(),
		},
		js: {
			value: 'console.log("Hello, world!");',
			lang: javascript(),
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

<button on:click={() => (selected = selected === 'js' ? 'svelte' : 'js')}>Toggle</button>
<button on:click={() => (isMarked = !isMarked)}>Toggle mark state</button>

<button on:click={change_pos}>Change cursor: {cursorPos}</button>

<div
	use:codemirror={{
		value: options[selected].value,
		setup: 'basic',
		lang: options[selected].lang,
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
