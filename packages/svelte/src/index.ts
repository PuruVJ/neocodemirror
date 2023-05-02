import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, type LanguageSupport } from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import type { Properties as CSSProperties } from 'csstype';
import { map, type MapStore } from 'nanostores';
import type { ActionReturn } from 'svelte/action';

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

export const codemirror = (
	node: HTMLElement,
	options: Options
): ActionReturn<
	Options,
	{
		'on:codemirror:change': (e: CustomEvent<string>) => void;
	}
> => {
	if (!options) throw new Error('No options provided. At least `value` is required.');

	let { value, instanceStore, diagnostics } = options;

	let fulfill_editor_initialized: (...args: any) => void;
	let editor_initialized = new Promise((r) => (fulfill_editor_initialized = r));
	let editor: EditorView;

	let internal_extensions: Extension[] = [];

	let update_from_state = false;

	const setup_compartment = new Compartment();
	const lang_compartment = new Compartment();
	const theming_compartment = new Compartment();
	const tabs_compartment = new Compartment();
	const readonly_compartment = new Compartment();
	const extensions_compartment = new Compartment();

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
		return [
			keymap.of([...defaultKeymap, ...(useTabs ? [indentWithTab] : [])]),
			setup_compartment.of((await get_setup(setup)) ?? []),
			lang_compartment.of(await get_lang(lang, langMap)),
			theming_compartment.of(get_theme(theme, styles)),
			tabs_compartment.of(await get_tab_setting(useTabs, tabSize)),
			readonly_compartment.of(EditorView.editable.of(!readonly)),
			extensions_compartment.of(extensions ?? []),
		];
	}

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

					update_from_state = true;
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

			if (new_options.setup) {
				if (options.setup !== new_options.setup) {
					editor.dispatch({
						effects: setup_compartment.reconfigure(await get_setup(new_options.setup)),
					});
				}
			} else {
				editor.dispatch({
					effects: setup_compartment.reconfigure([]),
				});
			}

			if (new_options.lang) {
				if (options.lang !== new_options.lang) {
					editor.dispatch({
						effects: lang_compartment.reconfigure(
							await get_lang(new_options.lang, new_options.langMap)
						),
					});
				}
			} else {
				// Remove
				editor.dispatch({
					effects: lang_compartment.reconfigure([]),
				});
			}

			if (new_options.useTabs || new_options.tabSize) {
				if (options.useTabs !== new_options.useTabs || options.tabSize !== new_options.tabSize) {
					editor.dispatch({
						effects: tabs_compartment.reconfigure(
							await get_tab_setting(new_options.useTabs, new_options.tabSize)
						),
					});
				}
			} else {
				// Remove
				editor.dispatch({
					effects: tabs_compartment.reconfigure([await get_tab_setting(false, 2)]),
				});
			}

			if (new_options.styles || new_options.theme) {
				if (options.theme !== new_options.theme) {
					editor.dispatch({
						effects: theming_compartment.reconfigure(
							get_theme(new_options.theme, new_options.styles)
						),
					});
				}
			} else {
				// Remove
				editor.dispatch({
					effects: theming_compartment.reconfigure([]),
				});
			}

			if (new_options.extensions) {
				if (options.extensions !== new_options.extensions) {
					editor.dispatch({
						effects: extensions_compartment.reconfigure(new_options.extensions),
					});
				}
			} else {
				// Remove
				editor.dispatch({
					effects: extensions_compartment.reconfigure([]),
				});
			}

			if (new_options.readonly) {
				if (options.readonly !== new_options.readonly) {
					editor.dispatch({
						effects: readonly_compartment.reconfigure(
							EditorView.editable.of(!new_options.readonly)
						),
					});
				}
			} else {
				// Remove
				editor.dispatch({
					effects: readonly_compartment.reconfigure([]),
				});
			}

			make_diagnostics(editor, new_options.diagnostics);

			instanceStore?.set({
				view: editor,
				extensions: internal_extensions,
				value,
			});

			options = new_options;
		},

		destroy() {
			editor_initialized.then(() => {
				editor?.destroy();
			});
		},
	};
};

async function get_setup(setup: Options['setup']) {
	const { basicSetup, minimalSetup } = await import('codemirror');

	if (typeof setup === 'undefined') return [];
	if (setup === 'basic') return basicSetup;
	if (setup === 'minimal') return minimalSetup;

	throw new Error(
		'`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop.'
	);
}

async function get_lang(lang: Options['lang'], langMap: Options['langMap']) {
	if (typeof lang === 'string') {
		if (!langMap) throw new Error('`langMap` is required when `lang` is a string.');
		if (!(lang in langMap)) throw new Error(`Language "${lang}" is not defined in \`langMap\`.`);

		const lang_support = await langMap[lang]();

		return lang_support;
	}

	if (typeof lang === 'undefined') return [];

	return lang;
}

function get_theme(theme: Options['theme'], styles: Options['styles']): Extension[] {
	// @ts-ignore
	return [theme, styles && EditorView.theme(styles)].filter(Boolean);
}

async function get_tab_setting(useTabs: Options['useTabs'], tabSize: Options['tabSize'] = 2) {
	return [EditorState.tabSize.of(tabSize), indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize))];
}

async function make_diagnostics(editor: EditorView, diagnostics: Options['diagnostics']) {
	if (!diagnostics) return;

	if (!diagnosticsModule) diagnosticsModule = await import('@codemirror/lint');

	const tr = diagnosticsModule.setDiagnostics(editor.state, diagnostics ?? []);
	editor.dispatch(tr);
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
