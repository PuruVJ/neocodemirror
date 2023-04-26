import { EditorState, StateEffect, type Extension } from '@codemirror/state';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { EditorView, keymap } from '@codemirror/view';
import { indentUnit, type LanguageSupport } from '@codemirror/language';
import type { Action } from 'svelte/action';

import { writable, type Writable } from 'svelte/store';

type Options = {
	value: string;
	setup?: 'basic' | 'minimal';
	lang?: LanguageSupport;
	instanceStore?: Writable<CodemirrorInstance>;
	useTabs?: boolean;
	tabSize?: number;
};

type CodemirrorInstance = {
	state: EditorState | null;
	extensions: Extension | null;
	value: string | null;
};

export const withCodemirrorInstance = () =>
	writable<CodemirrorInstance>({
		state: null,
		extensions: null,
		value: null,
	});

export const codemirror: Action<
	HTMLElement,
	Options,
	{ 'on:neocm:change': (e: CustomEvent<string>) => void }
> = (node, options) => {
	if (!options) throw new Error('No options provided. At least `value` is required.');

	let { value, setup, lang, instanceStore, useTabs = false, tabSize = 2 } = options;

	let fulfill_editor_initialized: (...args: any) => void;
	let editor_initialized = new Promise((r) => (fulfill_editor_initialized = r));
	let editor: EditorView;
	let update_from_state = false;

	let extensions: Extension[] = [];

	function handle_change(): void {
		const new_value = editor.state.doc.toString();
		if (new_value === value) return;

		update_from_state = true;

		value = new_value;

		node.dispatchEvent(new CustomEvent('neocm:change', { detail: value }));
		// dispatch('change', value);

		instanceStore?.update((instance) => ({
			...instance,
			value,
		}));
	}

	const on_change = debounce(handle_change, 50);

	(async () => {
		extensions = await make_extensions(lang, setup, useTabs, tabSize);

		editor = new EditorView({
			doc: value,
			extensions,
			parent: node,
			dispatch(tr) {
				editor.update([tr]);

				if (tr.docChanged) {
					on_change();
				}
			},
		});

		instanceStore?.set({
			state: editor.state,
			extensions,
			value,
		});

		fulfill_editor_initialized!();
	})();

	return {
		async update(new_options: Options) {
			await editor_initialized;

			lang = new_options.lang;
			setup = new_options.setup;
			useTabs = new_options.useTabs ?? false;
			tabSize = new_options.tabSize ?? 2;

			extensions = await make_extensions(lang, setup, useTabs, tabSize);

			editor.dispatch({
				effects: StateEffect.reconfigure.of(extensions),
			});
		},

		destroy() {
			editor_initialized.then(() => {
				editor?.destroy();
			});
		},
	};
};

async function make_extensions(
	lang: Options['lang'],
	setup: Options['setup'],
	useTabs: Options['useTabs'] = false,
	tabSize: Options['tabSize'] = 2
) {
	const extensions: Extension[] = [
		keymap.of([...defaultKeymap, ...(useTabs ? [indentWithTab] : [])]),
		EditorState.tabSize.of(tabSize),
		indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize)),
	];

	await do_setup(extensions, { setup });

	if (lang) extensions.push(lang);

	return extensions;
}

async function do_setup(extensions: Extension[], { setup }: { setup: Options['setup'] }) {
	if (setup) {
		const cm = await import('codemirror');

		if (setup === 'basic') {
			extensions.push(cm.basicSetup);
		} else if (setup === 'minimal') {
			extensions.push(cm.minimalSetup);
		} else {
			throw new Error(
				'`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop.'
			);
		}
	}
}

/**
 * Reduce calls to the passed function.
 *
 * @param func - Function to debounce.
 * @param threshold - The delay to avoid recalling the function.
 * @param execAsap - If true, the Function is called at the start of the threshold, otherwise the Function is called at the end of the threshold.
 */
function debounce<T extends (...args: any[]) => any>(
	func: T,
	threshold: number,
	execAsap = false
): T {
	let timeout: any;

	return function debounced(this: any, ...args: any[]): any {
		const self = this;

		if (timeout) clearTimeout(timeout);
		else if (execAsap) func.apply(self, args);

		timeout = setTimeout(delayed, threshold || 100);

		function delayed(): void {
			if (!execAsap) func.apply(self, args);
			timeout = null;
		}
	} as T;
}
