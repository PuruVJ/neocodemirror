<script lang="ts">
	import { codemirror } from '$lib';
	import { javascript } from '@codemirror/lang-javascript';
</script>

<div
	use:codemirror={{
		value: 'const js = "bwahahahha"',
		setup: 'basic',
		lang: javascript({ typescript: true }),
	}}
/>
