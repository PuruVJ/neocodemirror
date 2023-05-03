import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, type LanguageSupport } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
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

export type CodemirrorOptions = {
	/**
	 * Value of the editor. Required
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ value: `let code = 'wow'` }} />
	 * ```
	 */
	value: string;

	/**
	 * The editor setup to apply. Can be either `basic` or `minimal`.
	 * Defaults to no setup
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ setup: 'minimal' }} />
	 * ```
	 *
	 * @see https://codemirror.net/docs/ref/#codemirror.basicSetup
	 * @see https://codemirror.net/docs/ref/#codemirror.minimalSetup
	 */
	setup?: 'basic' | 'minimal';

	/**
	 * The language to use. Can be either a `LanguageSupport` or a string.
	 * Defaults to none.
	 *
	 * When it is a `LanguageSupport`, it will be passed directly to codemirror. However, when it is a string, it will be used to get the language support from the `langMap` option.
	 *
	 * @see langMap option
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { javascript } from '@codemirror/lang-javascript';
	 * </script>
	 *
	 * <div use:codemirror={{ lang: javascript() }} />
	 * ```
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { javascript } from '@codemirror/lang-javascript';
	 * 	import { html } from '@codemirror/lang-html';
	 * </script>
	 *
	 * <div
	 *   use:codemirror={{
	 *     lang: 'html',
	 *     langMap: {
	 *       html: () => html(),
	 *       js: () => javascript({ typescript: true })
	 *     }
	 *   }}
	 * />
	 * ```
	 */
	lang?: LanguageSupport | string;

	/**
	 * A map of language names to functions that return a `LanguageSupport`. Can be promises too.
	 *
	 * A use case would be having an instance of codemirror
	 * that switches its language based on file type chosen. In that case, combining with dynamic imports can be a great performance boost.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div
	 *   use:codemirror={{
	 *     lang: 'html',
	 *     langMap: {
	 *       html: () => import('@codemirror/lang-html').then((m) => m html()),
	 *       js: () => import('@codemirror/lang-javascript').then((m) => m javascript({ typescript: true }))
	 *     }
	 *   }}
	 * />
	 * ```
	 */
	langMap?: Record<string, () => MaybePromise<LanguageSupport>>;

	/**
	 * Whether to use tabs or spaces. Defaults to spaces.
	 *
	 * @default false
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ useTabs: true }} />
	 * ```
	 *
	 * @see https://codemirror.net/docs/ref/#commands.indentWithTab
	 */
	useTabs?: boolean;

	/**
	 * The size of a tab in spaces. Defaults to 2.
	 *
	 * @default 2
	 *
	 * @see https://codemirror.net/docs/ref/#state.EditorState^tabSize
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ tabSize: 4 }} />
	 * ```
	 */
	tabSize?: number;

	/**
	 * Whether to open the editor in readonly mode. Note its different from `editable`, which allows you to focus cursor in editor, but not make any changes.
	 * Defaults to false.
	 *
	 * @default false
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ readonly: true }} />
	 * ```
	 *
	 * @see https://codemirror.net/docs/ref/#state.EditorState^readOnly
	 */
	readonly?: boolean;

	/**
	 * Cursor Position. If not specified, defaults to the start of the document.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ cursorPos: 10 }} />
	 * ```
	 */
	cursorPos?: number;

	/**
	 * Styles to pass to EditorView.theme. Defaults to none.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ styles: { '.cm-scroller': { overflow: 'hidden' } } }} />
	 * ```
	 *
	 * @see https://codemirror.net/6/docs/ref/#view.EditorView^theme
	 */
	styles?: Styles;

	/**
	 * The theme to use. Of type `Extension`. Defaults to none.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { oneDark } from '@codemirror/theme-one-dark';
	 * </script>
	 *
	 * <div use:codemirror={{ theme: oneDark }} />
	 * ```
	 */
	theme?: Extension;

	/**
	 * Diagnostics data to pass to the editor. Defaults to none.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { javascript } from '@codemirror/lang-javascript';
	 *
	 * 	const diagnostics = [
	 * 		{
	 * 			from: 0,
	 * 			to: 10,
	 * 			message: 'This is a diagnostic message',
	 * 			severity: 'error'
	 * 		}
	 * 	];
	 *
	 * 	const lang = javascript({ typescript: true });
	 * </script>
	 *
	 * <div use:codemirror={{ lang, diagnostics }} />
	 * ```
	 *
	 * @see https://codemirror.net/docs/ref/#lint
	 */
	diagnostics?: Diagnostic[];
	// decorations?: NeoCMDecorations;

	/**
	 * The extensions to use. Defaults to empty array.
	 *
	 * @default []
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { closeBrackets } from '@codemirror/autocomplete';
	 * 	import { bracketMatching, codeFolding } from '@codemirror/language';
	 * </script>
	 *
	 * <div use:codemirror={{ extensions: [closeBrackets(), bracketMatching(), codeFolding()] }} />
	 * ```
	 */
	extensions?: Extension[];

	/**
	 * Instance store passed to the editor. This is created with `withCodemirrorInstance` function. It lets you track any and all state changes.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { withCodemirrorInstance } from '@neocodemirror/svelte';
	 *
	 * 	const instanceStore = withCodemirrorInstance();
	 *
	 * $: console.log($instanceStore);
	 * </script>
	 *
	 * <div use:codemirror={{ instanceStore }} />
	 * ```
	 */
	instanceStore?: MapStore<CodemirrorInstance>;
};

type CodemirrorInstance = {
	view: EditorView | null;
	extensions: Extension | null;
	value: string | null;
};

export const withCodemirrorInstance = () =>
	map<CodemirrorInstance>({
		view: null,
		extensions: null,
		value: null,
	});

export const codemirror = (
	node: HTMLElement,
	options: CodemirrorOptions
): ActionReturn<
	CodemirrorOptions,
	{
		'on:codemirror:change': (e: CustomEvent<string>) => void;
	}
> => {
	if (!options) throw new Error('No options provided. At least `value` is required.');

	let { value, instanceStore, diagnostics } = options;

	let fulfill_editor_initialized: (...args: any) => void;
	let editor_initialized = new Promise((r) => (fulfill_editor_initialized = r));
	let view: EditorView;

	let internal_extensions: Extension[] = [];

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
	}: CodemirrorOptions) {
		return [
			keymap.of([...defaultKeymap, ...(useTabs ? [indentWithTab] : [])]),
			setup_compartment.of((await get_setup(setup)) ?? []),
			lang_compartment.of(await get_lang(lang, langMap)),
			theming_compartment.of(get_theme(theme, styles)),
			tabs_compartment.of(await get_tab_setting(useTabs, tabSize)),
			readonly_compartment.of(EditorState.readOnly.of(!readonly)),
			extensions_compartment.of(extensions ?? []),
		];
	}

	function handle_change(): void {
		const new_value = view.state.doc.toString();
		if (new_value === value) return;

		value = new_value;

		node.dispatchEvent(new CustomEvent('codemirror:change', { detail: value }));

		instanceStore?.setKey('value', value);
	}

	const on_change = debounce(handle_change, 50);

	(async () => {
		internal_extensions = await make_extensions(options);

		view = new EditorView({
			doc: value,
			extensions: internal_extensions,
			parent: node,
			selection: {
				anchor: options.cursorPos ?? 0,
				head: options.cursorPos ?? 0,
			},
			dispatch(tr) {
				view.update([tr]);

				if (tr.docChanged) {
					on_change();
				}
			},
		});

		make_diagnostics(view, diagnostics);

		instanceStore?.set({
			view: view,
			extensions: internal_extensions,
			value,
		});

		fulfill_editor_initialized!();
	})();

	return {
		async update(new_options: CodemirrorOptions) {
			await editor_initialized;

			if (value !== new_options.value) {
				value = new_options.value;
				view.dispatch({
					changes: {
						from: 0,
						to: view.state.doc.length,
						insert: value,
					},
				});
			}

			console.time('reconfigure');

			if (new_options.setup) {
				if (options.setup !== new_options.setup) {
					view.dispatch({
						effects: setup_compartment.reconfigure(await get_setup(new_options.setup)),
					});
				}
			} else {
				view.dispatch({
					effects: setup_compartment.reconfigure([]),
				});
			}

			if (new_options.lang) {
				if (options.lang !== new_options.lang) {
					view.dispatch({
						effects: lang_compartment.reconfigure(
							await get_lang(new_options.lang, new_options.langMap)
						),
					});
				}
			} else {
				// Remove
				view.dispatch({
					effects: lang_compartment.reconfigure([]),
				});
			}

			if (new_options.useTabs || new_options.tabSize) {
				if (options.useTabs !== new_options.useTabs || options.tabSize !== new_options.tabSize) {
					view.dispatch({
						effects: tabs_compartment.reconfigure(
							await get_tab_setting(new_options.useTabs, new_options.tabSize)
						),
					});
				}
			} else {
				// Remove
				view.dispatch({
					effects: tabs_compartment.reconfigure([await get_tab_setting(false, 2)]),
				});
			}

			if (new_options.styles || new_options.theme) {
				if (options.theme !== new_options.theme) {
					view.dispatch({
						effects: theming_compartment.reconfigure(
							get_theme(new_options.theme, new_options.styles)
						),
					});
				}
			} else {
				// Remove
				view.dispatch({
					effects: theming_compartment.reconfigure([]),
				});
			}

			if (new_options.extensions) {
				if (options.extensions !== new_options.extensions) {
					view.dispatch({
						effects: extensions_compartment.reconfigure(new_options.extensions),
					});
				}
			} else {
				// Remove
				view.dispatch({
					effects: extensions_compartment.reconfigure([]),
				});
			}

			if (new_options.readonly) {
				if (options.readonly !== new_options.readonly) {
					view.dispatch({
						effects: readonly_compartment.reconfigure(
							EditorState.readOnly.of(new_options.readonly)
						),
					});
				}
			} else {
				// Remove
				view.dispatch({
					effects: readonly_compartment.reconfigure([]),
				});
			}

			if (
				typeof new_options.cursorPos !== 'undefined' &&
				options.cursorPos !== new_options.cursorPos
			) {
				view.dispatch({
					selection: {
						anchor: new_options.cursorPos ?? 0,
						head: new_options.cursorPos ?? 0,
					},
				});
			}

			make_diagnostics(view, new_options.diagnostics);

			console.timeEnd('reconfigure');

			console.time('make_extensions');
			internal_extensions = await make_extensions(new_options);
			console.timeEnd('make_extensions');

			instanceStore?.set({
				view: view,
				extensions: internal_extensions,
				value,
			});

			options = new_options;
		},

		destroy() {
			editor_initialized.then(() => {
				view?.destroy();
			});
		},
	};
};

async function get_setup(setup: CodemirrorOptions['setup']) {
	const { basicSetup, minimalSetup } = await import('codemirror');

	if (typeof setup === 'undefined') return [];
	if (setup === 'basic') return basicSetup;
	if (setup === 'minimal') return minimalSetup;

	throw new Error(
		'`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop.'
	);
}

async function get_lang(lang: CodemirrorOptions['lang'], langMap: CodemirrorOptions['langMap']) {
	if (typeof lang === 'undefined') return [];

	if (typeof lang === 'string') {
		if (!langMap) throw new Error('`langMap` is required when `lang` is a string.');
		if (!(lang in langMap)) throw new Error(`Language "${lang}" is not defined in \`langMap\`.`);

		const lang_support = await langMap[lang]();

		return lang_support;
	}

	return lang;
}

function get_theme(
	theme: CodemirrorOptions['theme'],
	styles: CodemirrorOptions['styles']
): Extension[] {
	// @ts-ignore
	return [theme, styles && EditorView.theme(styles)].filter(Boolean);
}

async function get_tab_setting(
	useTabs: CodemirrorOptions['useTabs'],
	tabSize: CodemirrorOptions['tabSize'] = 2
) {
	return [EditorState.tabSize.of(tabSize), indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize))];
}

async function make_diagnostics(view: EditorView, diagnostics: CodemirrorOptions['diagnostics']) {
	if (!diagnostics) return;

	const { setDiagnostics } = await import('@codemirror/lint');

	const tr = setDiagnostics(view.state, diagnostics ?? []);
	view.dispatch(tr);
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
