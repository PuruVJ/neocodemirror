import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import type { LanguageSupport } from '@codemirror/language';
import type { Action } from 'svelte/action';

import { writable, type Writable } from 'svelte/store';

// type AcceptedLanguage =
// 	| 'less'
// 	| 'sass'
// 	| 'css'
// 	| 'angular'
// 	| 'javascript'
// 	| 'typescript'
// 	| 'jsx'
// 	| 'tsx'
// 	| 'html'
// 	| 'sql'
// 	| 'markdown'
// 	| 'md'
// 	| 'mdx'
// 	| 'python'
// 	| 'py'
// 	| 'cpp'
// 	| 'java'
// 	| 'json'
// 	| 'php'
// 	| 'rust'
// 	| 'rs'
// 	| 'wast'
// 	| 'lezer'
// 	| 'vue'
// 	| 'xml'
// 	| 'svelte'
// 	| 'sv';

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

// async function get_language(lang: string) {
// 	let module_name = '';

// 	let arr = [];

// 	try {
// 		const OFFICIAL_LANG_MAP = new Map<RegExp, [name: string, ls: () => Promise<LanguageSupport>]>([
// 			[/less/, ['less', () => import('@codemirror/lang-less').then((mod) => mod.less())]],
// 			[/(sass|scss)/, ['sass', () => import('@codemirror/lang-sass').then((mod) => mod.sass())]],
// 			[/css/, ['css', () => import('@codemirror/lang-css').then((mod) => mod.css())]],
// 			[
// 				/(angular|ng)/,
// 				['angular', () => import('@codemirror/lang-angular').then((mod) => mod.angular())],
// 			],
// 			[
// 				/(javascript|js)/,
// 				['javascript', () => import('@codemirror/lang-javascript').then((mod) => mod.javascript())],
// 			],
// 			[
// 				/(typescript|ts)/,
// 				[
// 					'javascript',
// 					() =>
// 						import('@codemirror/lang-javascript').then((mod) =>
// 							mod.javascript({ typescript: true })
// 						),
// 				],
// 			],
// 			[
// 				/jsx/,
// 				[
// 					'javascript',
// 					() => import('@codemirror/lang-javascript').then((mod) => mod.javascript({ jsx: true })),
// 				],
// 			],
// 			[
// 				/tsx/,
// 				[
// 					'javascript',
// 					() =>
// 						import('@codemirror/lang-javascript').then((mod) =>
// 							mod.javascript({ typescript: true, jsx: true })
// 						),
// 				],
// 			],
// 			[/html/, ['html', () => import('@codemirror/lang-html').then((mod) => mod.html())]],
// 			[/sql/, ['sql', () => import('@codemirror/lang-sql').then((mod) => mod.sql())]],
// 			[
// 				/(markdown|md|mdx)/,
// 				['markdown', () => import('@codemirror/lang-markdown').then((mod) => mod.markdown())],
// 			],
// 			[
// 				/(python|py)/,
// 				['python', () => import('@codemirror/lang-python').then((mod) => mod.python())],
// 			],
// 			[/cpp/, ['cpp', () => import('@codemirror/lang-cpp').then((mod) => mod.cpp())]],
// 			[/java/, ['java', () => import('@codemirror/lang-java').then((mod) => mod.java())]],
// 			[/json/, ['json', () => import('@codemirror/lang-json').then((mod) => mod.json())]],
// 			[/php/, ['php', () => import('@codemirror/lang-php').then((mod) => mod.php())]],
// 			[/(rust|rs)/, ['rust', () => import('@codemirror/lang-rust').then((mod) => mod.rust())]],
// 			[/wast/, ['wast', () => import('@codemirror/lang-wast').then((mod) => mod.wast())]],
// 			[/lezer/, ['lezer', () => import('@codemirror/lang-lezer').then((mod) => mod.lezer())]],
// 			[/vue/, ['vue', () => import('@codemirror/lang-vue').then((mod) => mod.vue())]],
// 			[/xml/, ['xml', () => import('@codemirror/lang-xml').then((mod) => mod.xml())]],
// 		]);

// 		const UNOFFICIAL_LANG_MAP = new Map<RegExp, [name: string, ls: () => Promise<LanguageSupport>]>(
// 			[
// 				[
// 					/(svelte|sv)/,
// 					[
// 						'@replit/codemirror-lang-svelte',
// 						() => import('@replit/codemirror-lang-svelte').then((mod) => mod.svelte()),
// 					],
// 				],
// 			]
// 		);

// 		for (const [regex, [name, lang_support_import]] of OFFICIAL_LANG_MAP) {
// 			if (regex.test(lang)) {
// 				module_name = `@codemirror/lang-${name}`;
// 				arr.push(await lang_support_import());
// 			}
// 		}

// 		// Its unofficial, like svelte one
// 		for (const [regex, [name, unofficial_lang_support_import]] of UNOFFICIAL_LANG_MAP) {
// 			if (regex.test(lang)) {
// 				module_name = name;
// 				arr.push(await unofficial_lang_support_import());
// 			}
// 		}
// 	} catch {
// 		console.error(
// 			`Unable to find an existing package for the language provided. If it\'s an official language, try installing ${module_name} `
// 		);
// 	}

// 	return arr;
// }
