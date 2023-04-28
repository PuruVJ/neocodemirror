import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['./src/index.ts'],
	dts: { resolve: true },
	treeshake: 'smallest',
	external: [
		'codemirror',
		'@codemirror/view',
		'@codemirror/state',
		'@codemirror/commands',
		'@codemirror/language',
	],
	bundle: true,
	format: ['esm'],
	replaceNodeEnv: true,
});
