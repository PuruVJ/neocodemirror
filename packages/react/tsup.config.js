import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['./src/index.ts'],
	dts: { resolve: true },
	treeshake: 'smallest',
	clean: true,
	external: [
		'codemirror',
		'@codemirror/view',
		'@codemirror/state',
		'@codemirror/commands',
		'@codemirror/language',
		'react',
	],
	bundle: true,
	format: ['esm'],
	replaceNodeEnv: true,
});
