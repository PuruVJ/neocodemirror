import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		dedupe: ['@codemirror/state', '@codemirror/view'],
	},
	// optimizeDeps: {
	// 	// exclude: ['@codemirror/state'],
	// 	include: ['@codemirror/state'],
	// },
});
