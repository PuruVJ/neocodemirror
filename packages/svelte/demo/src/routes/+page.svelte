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

	function make_diagnostics() {
		const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a));

		const from = rand(0, ($store.value?.length ?? 0) / 2);
		const to = rand(from, $store.value?.length ?? 0);

		console.log({ from, to });

		diagnostics = [
			{
				from,
				to,
				severity: 'warning',
				message: 'This is an error',
			},
		];
	}

	let selected: keyof typeof options = 'svelte';

	let isMarked = false;

	let cursorPos = 40;

	let diagnostics = [];

	let setup: 'minimal' | 'basic' | undefined = 'basic';

	function change_pos() {
		$store.view?.focus();
		cursorPos = 0 + Math.floor(Math.random() * ($store.value?.length ?? 0));
	}

	$: console.log($store);
	$: console.log(setup);
</script>

<button on:click={() => (selected = 'js')}>JS</button>
<button on:click={() => (selected = 'svelte')}>Svelte</button>
<button on:click={() => (selected = 'md')}>MD</button>

<button on:click={() => make_diagnostics()}>Change diagnostics</button>

<button on:click={change_pos}>Change cursor: {cursorPos}</button>

<select bind:value={setup}>
	<option value="minimal">Minimal</option>
	<option value="basic">Basic</option>
	<option value={undefined}>None</option>
</select>

<div
	use:codemirror={{
		value: options[selected].value,
		setup,
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
		diagnostics: diagnostics,
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
