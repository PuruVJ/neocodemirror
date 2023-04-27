import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['./src/lib/index.ts'],
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
	minify: 'terser',
	noExternal: [/nanostores/],
	replaceNodeEnv: true,
});
