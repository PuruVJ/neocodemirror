import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { LanguageSupport } from '@codemirror/language';
import type { Action } from 'svelte/action';

import { writable, type Writable } from 'svelte/store';

type Options = {
	value: string;
	setup?: 'basic' | 'minimal';
	lang?: LanguageSupport;
	instanceStore?: Writable<CodemirrorInstance>;
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

export const codemirror: Action<HTMLElement, Options> = (node, options) => {
	if (!options) throw new Error('No options provided. At least `value` is required.');

	let { value, setup, lang, instanceStore } = options;

	let fulfill_editor_initialized: (...args: any) => void;
	let editor_initialized = new Promise((r) => (fulfill_editor_initialized = r));
	let editor: EditorView;

	const extensions: Extension[] = [];

	(async () => {
		await do_setup(extensions, { setup });

		if (lang) {
			extensions.push(lang);
		}

		const state = EditorState.create({
			doc: value,
			extensions,
		});

		editor = new EditorView({
			state,
			parent: node,
		});

		fulfill_editor_initialized!();
	})();

	return {
		destroy() {
			editor_initialized.then(() => {
				editor?.destroy();
			});
		},
	};
};

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
