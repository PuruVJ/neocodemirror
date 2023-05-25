import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit, type LanguageSupport } from '@codemirror/language';
import type { Diagnostic } from '@codemirror/lint';
import {
	Compartment,
	EditorState,
	StateEffect,
	StateField,
	type Extension,
	type Transaction,
	type TransactionSpec,
} from '@codemirror/state';
import { EditorView, keymap, Decoration, DecorationSet } from '@codemirror/view';
import type { Properties as CSSProperties } from 'csstype';
import { map, type MapStore } from 'nanostores';
import type { ActionReturn } from 'svelte/action';

type MaybePromise<T> = T | Promise<T>;

export type NeoCodemirrorDecorations = {
	mark?: { from: number; to: number; class?: string; attributes?: Record<string, string> };
};

type Styles = {
	[val: string]: CSSProperties | Styles;
};

export type NeoCodemirrorOptions = {
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
	 * Whether to autocomplete the language's basics
	 *
	 * @default true
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ autocomplete: false }} />
	 * ```
	 */
	autocomplete?: boolean | Parameters<typeof import('@codemirror/autocomplete').autocompletion>[0];

	decorations?: NeoCodemirrorDecorations;

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

	/**
	 * Triggers every time value of code editor is changed
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ onValueChange: (value) => console.log(value) }} />
	 * ```
	 */
	onTextChange?: (value: string) => void;

	/**
	 * Triggers on any change in editor state. This includes changes in value, cursor position, diagnostics, etc.
	 * The transaction object is exposed to the callback function.
	 *
	 * Note: If you are new to codemirror 6, this will trigger more than you probably think it will.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ onChange: (transaction) => console.log(transaction.selection) }} />
	 * ```
	 */
	onChange?: (e: Transaction) => void;
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
	options: NeoCodemirrorOptions
): ActionReturn<
	NeoCodemirrorOptions,
	{
		'on:codemirror:textChange'?: (e: CustomEvent<string>) => void;
		'on:codemirror:change'?: (e: CustomEvent<Transaction>) => void;
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
	const autocomplete_compartment = new Compartment();

	async function make_extensions(options: NeoCodemirrorOptions) {
		return [
			// User extensions matter the most, keep em on top
			extensions_compartment.of(get_user_extensions(options)),

			// Autocomplete may come built in with setup: basic, so always keep it above setup_compartment
			autocomplete_compartment.of(await get_autocompletion(options)),

			setup_compartment.of((await get_setup(options)) ?? []),

			// Needs to be under `setup` because setup, if there, will add the indentWithTab
			keymap.of([...defaultKeymap, ...(options.useTabs ? [indentWithTab] : [])]),
			lang_compartment.of(await get_lang(options)),
			theming_compartment.of(get_theme(options)),
			tabs_compartment.of(await get_tab_setting(options)),
			readonly_compartment.of(get_readonly(options)),
		];
	}

	function handle_change(tr: Transaction): void {
		const new_value = view.state.doc.toString();
		if (new_value === value) return;

		if (!is_equal(new_value, value)) {
			value = new_value;

			node.dispatchEvent(new CustomEvent('codemirror:textChange', { detail: value }));
			options.onTextChange?.(value);
		}

		instanceStore?.set({ value, view, extensions: internal_extensions });

		node.dispatchEvent(new CustomEvent('codemirror:change', { detail: tr }));
		options.onChange?.(tr);
	}

	const on_change = debounce(handle_change, 50);

	(async () => {
		internal_extensions = await make_extensions(options);

		const state = EditorState.create({
			doc: value,
			extensions: internal_extensions,
			selection: {
				anchor: options.cursorPos ?? 0,
				head: options.cursorPos ?? 0,
			},
		});

		view = new EditorView({
			state,
			parent: node,
			dispatch(tr) {
				view.update([tr]);

				on_change(tr);
			},
		});

		make_diagnostics(view, diagnostics);
		make_decorations(view, options.decorations);

		instanceStore?.set({
			view: view,
			extensions: internal_extensions,
			value,
		});

		fulfill_editor_initialized!();
	})();

	return {
		async update(new_options: NeoCodemirrorOptions) {
			await editor_initialized;

			// The final transaction object to be applied
			const transaction: TransactionSpec = {};

			if (!is_equal(value, new_options.value)) {
				value = new_options.value;

				transaction.changes = {
					from: 0,
					to: view.state.doc.length,
					insert: value,
				};
			}

			if (
				!is_undefined(new_options.cursorPos) &&
				!is_equal(options.cursorPos, new_options.cursorPos)
			) {
				transaction.selection = {
					anchor: new_options.cursorPos ?? 0,
					head: new_options.cursorPos ?? 0,
				};
			}

			async function append_effect(
				compartment: Compartment,
				options_list: (keyof NeoCodemirrorOptions)[],
				factory: (options: NeoCodemirrorOptions) => MaybePromise<any>
			) {
				transaction.effects = transaction.effects ?? [];

				for (const option_name of options_list) {
					const new_option = new_options[option_name];
					const old_option = options[option_name];

					const effects = transaction.effects as StateEffect<any>[];

					if (!is_undefined(new_option)) {
						if (!is_equal(new_option, old_option)) {
							effects.push(compartment.reconfigure(await factory(new_options)));
						}
					} else {
						return effects.push(compartment.reconfigure([]));
					}
				}
			}

			// Run them all in parallel
			await Promise.all([
				append_effect(setup_compartment, ['setup'], get_setup),
				append_effect(lang_compartment, ['lang'], get_lang),
				append_effect(tabs_compartment, ['useTabs', 'tabSize'], get_tab_setting),
				append_effect(theming_compartment, ['theme'], get_theme),
				append_effect(extensions_compartment, ['extensions'], get_user_extensions),
				append_effect(readonly_compartment, ['readonly'], get_readonly),
				append_effect(autocomplete_compartment, ['autocomplete'], get_autocompletion),
			]);

			view.dispatch(transaction);
			make_diagnostics(view, new_options.diagnostics);
			make_decorations(view, new_options.decorations, options.decorations);

			internal_extensions = await make_extensions(new_options);

			instanceStore?.set({
				view: view,
				extensions: internal_extensions,
				value,
			});

			options = new_options;
		},

		destroy() {
			editor_initialized.then(() => view?.destroy());
		},
	};
};

///////////////////// Getters /////////////////////

async function get_setup(options: NeoCodemirrorOptions) {
	const { setup } = options;

	if (is_undefined(setup)) return [];

	if (setup === 'basic') return (await import('./basic-setup')).default(options);
	if (setup === 'minimal') return (await import('./minimal-setup')).default(options);

	throw new Error(
		'`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop.'
	);
}

async function get_lang({ lang, langMap }: NeoCodemirrorOptions) {
	if (is_undefined(lang)) return [];

	if (typeof lang === 'string') {
		if (is_undefined(langMap)) throw new Error('`langMap` is required when `lang` is a string.');
		if (!(lang in langMap)) throw new Error(`Language "${lang}" is not defined in \`langMap\`.`);

		const lang_support = await langMap[lang]();

		return lang_support;
	}

	return lang;
}

function get_theme({ theme, styles }: NeoCodemirrorOptions): Extension[] {
	// @ts-ignore
	return [theme, styles && EditorView.theme(styles)].filter(Boolean);
}

async function get_tab_setting({ useTabs = false, tabSize = 2 }: NeoCodemirrorOptions) {
	return [EditorState.tabSize.of(tabSize), indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize))];
}

async function get_autocompletion({ autocomplete }: NeoCodemirrorOptions) {
	if (is_undefined(autocomplete)) return [];

	const { autocompletion } = await import('@codemirror/autocomplete');

	return autocompletion(typeof autocomplete === 'object' && autocomplete ? autocomplete : {});
}

function get_readonly({ readonly }: NeoCodemirrorOptions) {
	return EditorState.readOnly.of(!!readonly);
}

function get_user_extensions({ extensions }: NeoCodemirrorOptions) {
	return extensions ?? [];
}

async function make_diagnostics(
	view: EditorView,
	diagnostics: NeoCodemirrorOptions['diagnostics']
) {
	if (is_undefined(diagnostics)) return;

	const { setDiagnostics } = await import('@codemirror/lint');

	const tr = setDiagnostics(view.state, diagnostics ?? []);
	view.dispatch(tr);
}

const add_mark_effect = StateEffect.define<{ from: number; to: number }>({
	map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
});

const remove_mark_effect = StateEffect.define<{ from: number; to: number }>({
	map: ({ from, to }, change) => ({ from: change.mapPos(from), to: change.mapPos(to) }),
});

function make_decorations(
	view: EditorView,
	decorations_compartment: Compartment,
	new_decorations?: NeoCodemirrorDecorations,
	old_decorations?: NeoCodemirrorDecorations
) {
	if (is_undefined(new_decorations)) return [];

	let dec = Decoration.mark({ class: mark.class, attributes: mark.attributes });

	const mark_field = StateField.define<DecorationSet>({
		create() {
			return Decoration.none;
		},
		update(underlines, tr) {
			underlines = underlines.map(tr.changes);
			for (let e of tr.effects)
				if (e.is(add_mark_effect)) {
					underlines = underlines.update({
						add: [dec.range(e.value.from, e.value.to)],
					});
				} else if (e.is(remove_mark_effect)) {
					underlines = underlines.update({
						filter: (from, to) => !is_equal(e.value.from, from) && !is_equal(e.value.to, to),
					});
				}
			return underlines;
		},
		provide: (f) => EditorView.decorations.from(f),
	});

	// Detect if any change from old_decorations
	if (!is_undefined(old_decorations) && !is_undefined(old_decorations.mark)) {
		const dec = Decoration.mark({
			class: old_decorations.mark.class,
			attributes: old_decorations.mark.attributes,
		});

		// Hmm remove these first
		view.dispatch({
			effects: [
				decorations_compartment.reconfigure([mark_field]),
				remove_mark_effect.of(dec.range(old_decorations.mark.from, old_decorations.mark.to)),
			],
		});
	}

	// Currently, only mark is supported
	const { mark } = new_decorations;

	if (is_undefined(mark)) return [];

	if (is_undefined(mark.from) || is_undefined(mark.to))
		throw new Error(`\`from\` and \`to\` are required for every item of \`mark\`.`);

	view.dispatch({
		effects: [
			StateEffect.appendConfig.of([mark_field]),
			add_mark_effect.of(dec.range(mark.from, mark.to)),
		],
	});
}

///////////////////// UTILS /////////////////////

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

const is_equal = <T>(val1: any, val2: T): val1 is T => val1 === val2;
const is_array = <T>(val: unknown): val is T[] => Array.isArray(val);
const is_empty_array = (val: unknown): boolean => is_array(val) && val.length === 0;
const is_undefined = (val: unknown): val is undefined => typeof val === 'undefined';

function is_equal_json(val1: any, val2: any): boolean {
	try {
		return JSON.stringify(val1) === JSON.stringify(val2);
	} catch {
		return false;
	}
}
