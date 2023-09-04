import { defaultKeymap, historyField, indentWithTab } from '@codemirror/commands';
import { indentUnit, type LanguageSupport } from '@codemirror/language';
import type { LintSource, linter } from '@codemirror/lint';
import {
	Compartment,
	EditorState,
	StateEffect,
	StateField,
	type Extension,
	type TransactionSpec,
} from '@codemirror/state';
import { EditorView, ViewUpdate, keymap } from '@codemirror/view';
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
	setup?: 'basic' | 'minimal' | null;

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
	lang?: LanguageSupport | string | null;

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
	langMap?: Record<string, () => MaybePromise<LanguageSupport>> | null;

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
	useTabs?: boolean | null;

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
	tabSize?: number | null;

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
	readonly?: boolean | null;

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
	cursorPos?: number | null;

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
	autocomplete?:
		| boolean
		| Parameters<typeof import('@codemirror/autocomplete').autocompletion>[0]
		| null;

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
	styles?: Styles | null;

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
	theme?: Extension | null;

	/**
	 * A (possibly async) function to provide diagnostic hints for your code(squiggles for error, warning, info, etc).
	 * Runs everytime user types with a debounce duration.
	 * Can be pared with `lintOptions` to lint the editor. Defaults to nothing.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { javascript } from '@codemirror/lang-javascript';
	 *
	 * 	function lint() {
	 * 		return [{
	 * 			from: 0,
	 * 			to: 10,
	 * 			message: 'This is a diagnostic message',
	 * 			severity: 'error'
	 * 		}]
	 * 	};
	 *
	 * 	const lang = javascript({ typescript: true });
	 * </script>
	 *
	 * <div use:codemirror={{ lang, lint }} />
	 * ```
	 *
	 * @see https://codemirror.net/docs/ref/#lint
	 */
	lint?: LintSource | null;

	/**
	 * Options to pass to the linter. Defaults to none.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { javascript } from '@codemirror/lang-javascript';
	 *
	 * 	function lint() {
	 * 		// Omitted for brevity
	 * 	}
	 *
	 * 	const lang = javascript({ typescript: true });
	 * </script>
	 *
	 * <div use:codemirror={{ lang, lint, lintOptions: { delay: 100 } }} />
	 * ```
	 */
	lintOptions?: Parameters<typeof linter>[1] | null;

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
	extensions?: Extension[] | null;

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
	instanceStore?: MapStore<CodemirrorInstance> | null;

	/**
	 * Options to config the behavior of the onChange/onTextChange callback. You can specify a kind
	 * between throttle and debounce and a duration as a number of milliseconds. This prevent the callback from being called
	 * too many times either by debouncing the change handler or by throttling it.
	 *
	 * @default { kind: 'debounce', duration: 50 }
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ onChangeBehavior: { kind: 'throttle', duration: 350 } />
	 * ```
	 */
	onChangeBehavior?: {
		kind?: 'debounce' | 'throttle';
		duration?: number;
	} | null;

	/**
	 * If present it will make the codemirror instance enter document mode. This means that whenever
	 * the documentId changes the state of the codemirror instance is reset and stored in a map.
	 * If there's a stored state for the new documentId it will be restored. This allows, for example
	 * to keep different undo-redo history for different documents.
	 *
	 * @default undefined
	 *
	 * @example
	 * ```svelte
	 * <div use:codemirror={{ documentId: "file.txt" />
	 * ```
	 */
	documentId?: string | null;

	/**
	 * Fields to pass to codemirror while saving state in document mode. By default saves history.
	 *
	 * @default { history: historyField }
	 *
	 * @example
	 *
	 * ```svelte
	 * <script>
	 * 	import { historyField } from '@codemirror/commands';
	 * </script>
	 *
	 * <div use:codemirror={{ documentId: "file.txt", documentFields: { history: historyField } }} />
	 * ```
	 */
	documentFields?: Record<string, StateField<any>> | null;
};

type CodemirrorInstance = {
	view: EditorView | null;
	extensions: Extension | null;
	value: string | null;
	documents: Map<string, string>;
};

export const withCodemirrorInstance = () =>
	map<CodemirrorInstance>({
		view: null,
		extensions: null,
		value: null,
		documents: new Map(),
	});

export const codemirror = (
	node: HTMLElement,
	options: NeoCodemirrorOptions
): ActionReturn<
	NeoCodemirrorOptions,
	{
		'on:codemirror:textChange'?: (
			e: CustomEvent<{ value: string; documentChanged: boolean }>
		) => void;
		'on:codemirror:change'?: (
			e: CustomEvent<{ viewUpdate: ViewUpdate; documentChanged: boolean }>
		) => void;
		'on:codemirror:documentChanging'?: (e: CustomEvent<{ view: EditorView }>) => void;
		'on:codemirror:documentChanged'?: (e: CustomEvent<{ view: EditorView }>) => void;
	}
> => {
	if (is_nullish(options)) throw new Error('No options provided. At least `value` is required.');

	let { value, instanceStore, onChangeBehavior = { kind: 'debounce', duration: 50 } } = options;

	const EDITOR_STATE_MAP = new Map<string, string>();

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
	const linter_compartment = new Compartment();

	const watcher = EditorView.updateListener.of((view_update) => on_change(view_update));

	async function make_extensions(options: NeoCodemirrorOptions) {
		return Promise.all([
			watcher,
			// User extensions matter the most, keep em on top
			extensions_compartment.of(get_user_extensions(options)),

			// Autocomplete may come built in with setup: basic, so always keep it above setup_compartment
			autocomplete_compartment.of(await get_autocompletion(options)),

			setup_compartment.of(await get_setup(options)),

			// Needs to be under `setup` because setup, if there, will add the indentWithTab
			keymap.of([...defaultKeymap, ...(options.useTabs ? [indentWithTab] : [])]),
			lang_compartment.of(await get_lang(options)),
			theming_compartment.of(get_theme(options)),
			tabs_compartment.of(await get_tab_setting(options)),
			readonly_compartment.of(get_readonly(options)),
			linter_compartment.of(await get_linter(options)),
		]);
	}

	function dispatch_event(event: string, detail?: unknown) {
		node.dispatchEvent(new CustomEvent(event, detail ? { detail } : undefined));
	}

	let document_changed = false;
	function handle_change(view_update: ViewUpdate): void {
		const new_value = view.state.doc.toString();

		if (!is_equal(new_value, value)) {
			value = new_value;
			dispatch_event('codemirror:textChange', { value, documentChanged: document_changed });
		}

		instanceStore?.set({
			value,
			view,
			extensions: internal_extensions,
			documents: EDITOR_STATE_MAP,
		});

		dispatch_event('codemirror:change', {
			viewUpdate: view_update,
			documentChanged: document_changed,
		});
	}

	const { kind: behaviorKind = 'debounce', duration: behaviorDuration = 50 } = is_nullish(
		onChangeBehavior
	)
		? {}
		: onChangeBehavior;

	let on_change =
		behaviorKind === 'debounce'
			? debounce(handle_change, behaviorDuration)
			: throttle(handle_change, behaviorDuration);

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
		});

		// Focus the editor if the cursor position is set
		if (!is_nullish(options.cursorPos)) view.focus();

		fulfill_editor_initialized!();
	})();

	return {
		async update(new_options: NeoCodemirrorOptions) {
			await editor_initialized;

			document_changed = false;

			// The final transaction object to be applied
			const transaction: TransactionSpec = {};

			if (!is_equal(value, new_options.value)) {
				transaction.changes = {
					from: 0,
					to: view.state.doc.length,
					insert: new_options.value,
				};
			}

			if (
				!is_nullish(new_options.cursorPos) &&
				!is_equal(options.cursorPos, new_options.cursorPos)
			) {
				transaction.selection = {
					anchor: new_options.cursorPos ?? 0,
					head: new_options.cursorPos ?? 0,
				};

				view.focus();
			}

			async function append_effect(
				compartment: Compartment,
				options_list: (keyof NeoCodemirrorOptions)[],
				factory: (options: NeoCodemirrorOptions) => MaybePromise<any>
			) {
				transaction.effects = transaction.effects ?? [];
				const effects = transaction.effects as StateEffect<any>[];

				let are_all_options_nullish = true;

				for (const option_name of options_list) {
					const new_option = new_options[option_name];
					const old_option = options[option_name];

					if (!is_nullish(new_option)) {
						are_all_options_nullish = false;

						if (!is_equal(new_option, old_option)) {
							return effects.push(compartment.reconfigure(await factory(new_options)));
						}
					}
				}

				if (are_all_options_nullish) effects.push(compartment.reconfigure([]));
			}

			// we need to get the state before the transaction apply because the
			// transaction also changes the value
			const pre_transaction_state = view.state.toJSON(
				is_object(new_options.documentFields) ? new_options.documentFields : DEFAULT_DOCUMENT_FIELDS
			);

			// trigger here, in parallel, resolve and collect later
			const internal_extensions_promise = make_extensions(new_options);

			// Make sure document id is not changing
			if (is_equal(options.documentId, new_options.documentId) && !is_nullish(options.documentId)) {
				// Run them all in parallel
				await Promise.all([
					append_effect(setup_compartment, ['setup'], get_setup),
					append_effect(lang_compartment, ['lang'], get_lang),
					append_effect(tabs_compartment, ['useTabs', 'tabSize'], get_tab_setting),
					append_effect(theming_compartment, ['theme'], get_theme),
					append_effect(extensions_compartment, ['extensions'], get_user_extensions),
					append_effect(readonly_compartment, ['readonly'], get_readonly),
					append_effect(autocomplete_compartment, ['autocomplete'], get_autocompletion),
					append_effect(linter_compartment, ['lint', 'lintOptions'], get_linter),
				]);

				view.dispatch(transaction);

				internal_extensions = await internal_extensions_promise;
			}

			if (
				!is_nullish(options.documentId) &&
				!is_equal(options.documentId, new_options.documentId)
			) {
				// keep track of the old state
				EDITOR_STATE_MAP.set(options.documentId, pre_transaction_state);

				// if there's a new documentId
				if (!is_nullish(new_options.documentId)) {
					// we recover the state from the map
					const old_state = EDITOR_STATE_MAP.get(new_options.documentId);

					// we dispatch the events for document changing, this allows
					// the user to store non serializable state (looking at you vim)
					dispatch_event('codemirror:documentChanging', { view });

					internal_extensions = await internal_extensions_promise;

					// we set the state. if there's the old state we convert it from
					// json and add back the history field otherwise we create a brand
					// new state to wipe the history of the old one
					view.setState(
						old_state
							? EditorState.fromJSON(
									old_state,
									{ extensions: internal_extensions, doc: new_options.value },
									is_object(new_options.documentFields)
										? new_options.documentFields
										: DEFAULT_DOCUMENT_FIELDS
							  )
							: EditorState.create({
									doc: new_options.value,
									extensions: internal_extensions,
							  })
					);

					// Focus the editor in the right place
					view.focus();

					document_changed = true;
					// we dispatch the events for the documentChanged
					dispatch_event('codemirror:documentChanged', { view });
				}
			}

			const { kind: behaviorKind = 'debounce', duration: behaviorDuration = 50 } =
				new_options.onChangeBehavior ?? { kind: 'debounce', duration: 50 };

			if (!is_equal(options.onChangeBehavior, new_options.onChangeBehavior)) {
				on_change =
					behaviorKind === 'debounce'
						? debounce(handle_change, behaviorDuration)
						: throttle(handle_change, behaviorDuration);
			}

			options = new_options;

			internal_extensions = await make_extensions(new_options);
		},

		destroy() {
			editor_initialized.then(() => view?.destroy());
		},
	};
};

const DEFAULT_DOCUMENT_FIELDS = {
	history: historyField,
};

async function get_setup(options: NeoCodemirrorOptions) {
	const { setup } = options;

	if (is_nullish(setup)) return [];
	if (setup === 'basic') return (await import('./basic-setup')).default(options);
	if (setup === 'minimal') return (await import('./minimal-setup')).default(options);

	throw new Error(
		'`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop.'
	);
}

async function get_lang({ lang, langMap }: NeoCodemirrorOptions) {
	if (is_nullish(lang)) return [];

	if (typeof lang === 'string') {
		if (!langMap) throw new Error('`langMap` is required when `lang` is a string.');
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
	if (is_nullish(tabSize)) return [];

	return [EditorState.tabSize.of(tabSize), indentUnit.of(useTabs ? '\t' : ' '.repeat(tabSize))];
}

async function get_autocompletion({ autocomplete }: NeoCodemirrorOptions) {
	if (is_nullish(autocomplete)) return [];

	const { autocompletion } = await import('@codemirror/autocomplete');

	return autocompletion(typeof autocomplete === 'object' && autocomplete ? autocomplete : {});
}

function get_readonly({ readonly }: NeoCodemirrorOptions) {
	return EditorState.readOnly.of(!!readonly);
}

function get_user_extensions({ extensions }: NeoCodemirrorOptions) {
	return extensions ?? [];
}

async function get_linter({ lint, lintOptions = {} }: NeoCodemirrorOptions) {
	if (is_nullish(lint)) return [];
	if (!is_function(lint)) throw new Error('`lint` must be a function.');

	const { linter } = await import('@codemirror/lint');

	return linter(lint, lintOptions ?? {});
}

const is_equal = (a: unknown, b: unknown) => {
	if (!is_object(a) || !is_object(b)) return a === b;

	const sortedStr = (obj: object) => JSON.stringify(obj, Object.keys(obj).sort());

	try {
		return sortedStr(a) === sortedStr(b);
	} catch {
		return false;
	}
};

const is_nullish = (a: any): a is undefined | null => a == null;
const is_function = (a: unknown): a is Function => typeof a === 'function';
const is_object = (a: unknown): a is object => !is_nullish(a) && typeof a === 'object';

/**
 * Reduce calls to the passed function with debounce.
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

/**
 * Reduce calls to the passed function with throttle.
 *
 * @param func - Function to throttle.
 * @param threshold - The delay to avoid recalling the function.
 */
function throttle<T extends (...args: any[]) => any>(func: T, threshold: number): T {
	let last_args: Parameters<T> | null;
	let should_wait = false;
	function timeout_function(self: any) {
		if (last_args) {
			func.apply(self, last_args);
			setTimeout(timeout_function, threshold, self);
			last_args = null;
			return;
		}
		should_wait = false;
	}

	return function throttled(this: any, ...args: Parameters<T>): any {
		const self = this;

		if (should_wait) {
			last_args = args;
			return;
		}

		func.apply(self, args);
		should_wait = true;
		setTimeout(timeout_function, threshold, self);
	} as T;
}
