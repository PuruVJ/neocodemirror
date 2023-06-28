import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		dedupe: ['@codemirror/state'],
	},
	// optimizeDeps: {
	// 	// exclude: ['@codemirror/state'],
	// 	include: ['@codemirror/state'],
	// },
});
