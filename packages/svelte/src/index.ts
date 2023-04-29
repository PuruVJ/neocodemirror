import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, type LanguageSupport } from '@codemirror/language';
import { EditorState, StateEffect, type Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { Properties as CSSProperties } from 'csstype';
import { dequal } from 'dequal';
import { map, type MapStore } from 'nanostores';
import type { Action } from 'svelte/action';

type MaybePromise<T> = T | Promise<T>;

// type NeoCMDecorations = {
// 	mark: { from: number; to: number; class?: string; attributes?: Record<string, string> };
// };

type Styles = {
	[val: string]: CSSProperties | Styles;
};

type Options = {
	value: string;
	setup?: 'basic' | 'minimal';
	lang?: LanguageSupport | string;
	langMap?: Record<string, () => MaybePromise<LanguageSupport>>;
	useTabs?: boolean;
	readonly?: boolean;
	// cursorPos?: number;
	styles?: Styles;
	tabSize?: number;
	theme?: Extension;
	diagnostics?: import('@codemirror/lint').Diagnostic[];
	// decorations?: NeoCMDecorations;
	extensions?: Extension[];
	instanceStore?: MapStore<CodemirrorInstance>;
};

type CodemirrorInstance = {
	view: EditorView | null;
	extensions: Extension | null;
	value: string | null;
};

let diagnosticsModule: typeof import('@codemirror/lint');

export const withCodemirrorInstance = () =>
	map<CodemirrorInstance>({
		view: null,
		extensions: null,
		value: null,
	});

export const codemirror: Action<
	HTMLElement,
	Options,
	{ 'on:codemirror:change': (e: CustomEvent<string>) => void }
> = (node, options) => {
	if (!options) throw new Error('No options provided. At least `value` is required.');

	let { value, instanceStore, diagnostics } = options;

	let fulfill_editor_initialized: (...args: any) => void;
	let editor_initialized = new Promise((r) => (fulfill_editor_initialized = r));
	let editor: EditorView;

	let internal_extensions: Extension[] = [];

	function handle_change(): void {
		const new_value = editor.state.doc.toString();
		if (new_value === value) return;

		value = new_value;

		node.dispatchEvent(new CustomEvent('codemirror:change', { detail: value }));

		instanceStore?.setKey('value', value);
	}

	const on_change = debounce(handle_change, 50);

	(async () => {
		internal_extensions = await make_extensions(options);

		editor = new EditorView({
			doc: value,
			extensions: internal_extensions,
			parent: node,
			dispatch(tr) {
				editor.update([tr]);

				if (tr.docChanged) {
					on_change();
				}
			},
		});

		make_diagnostics(editor, diagnostics);

		instanceStore?.set({
			view: editor,
			extensions: internal_extensions,
			value,
		});

		fulfill_editor_initialized!();
	})();

	return {
		async update(new_options: Options) {
			await editor_initialized;

			if (value !== new_options.value) {
				value = new_options.value;
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: value,
					},
				});
			}

			if (
				!dequal(
					omit(options, ['value', 'diagnostics']),
					omit(new_options, ['value', 'diagnostics'])
				)
			) {
				internal_extensions = await make_extensions(new_options);

				editor.dispatch({
					effects: StateEffect.reconfigure.of(internal_extensions),
					selection: editor.state.selection,
				});
			}

			if (!dequal(options.diagnostics, new_options.diagnostics)) {
				make_diagnostics(editor, new_options.diagnostics);
			}

			instanceStore?.set({
				view: editor,
				extensions: internal_extensions,
				value,
			});
		},

		destroy() {
			editor_initialized.then(() => {
				editor?.destroy();
			});
		},
	};
};

async function make_diagnostics(editor: EditorView, diagnostics: Options['diagnostics']) {
	if (!diagnostics) return;

	if (!diagnosticsModule) diagnosticsModule = await import('@codemirror/lint');

	const tr = diagnosticsModule.setDiagnostics(editor.state, diagnostics ?? []);
	editor.dispatch(tr);
}

async function make_extensions({
	lang,
	langMap,
	setup,
	useTabs,
	tabSize = 2,
	theme,
	styles,
	extensions,
	readonly,
}: Options) {
	const internal_extensions: Extension[] = [
		keymap.of([...defaultKeymap, ...(useTabs ? [indentWithTab] : [])]),
		EditorState.tabSize.of(tabSize),
		indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize)),
	];

	await do_setup(internal_extensions, { setup });

	if (lang) {
		if (typeof lang === 'string') {
			if (!langMap) throw new Error('`langMap` is required when `lang` is a string.');
			if (!(lang in langMap)) throw new Error(`Language "${lang}" is not defined in \`langMap\`.`);

			const lang_support = await langMap[lang]();
			internal_extensions.push(lang_support);
		} else {
			internal_extensions.push(lang);
		}
	}

	if (theme) internal_extensions.push(theme);
	// @ts-ignore
	if (styles) internal_extensions.push(EditorView.theme(styles));
	if (readonly) internal_extensions.push(EditorView.editable.of(false));

	return [internal_extensions, extensions ?? []];
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

function omit<T extends object, K extends (keyof T)[]>(obj: T, values: K): Omit<T, K[number]> {
	const new_obj = Object.assign({}, obj);

	for (const value of values) {
		delete new_obj[value];
	}

	return new_obj;
}
