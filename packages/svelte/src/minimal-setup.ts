import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { type Extension } from '@codemirror/state';
import { KeyBinding, drawSelection, highlightSpecialChars, keymap } from '@codemirror/view';

/**
 * A minimal set of extensions to create a functional editor. Only includes:
 *
 * - {@link commands.defaultKeymap|the default keymap}
 * - {@link commands.history|undo history}
 * - {@link view.highlightSpecialChars|special character highlighting}
 * - {@link view.drawSelection|custom selection drawing}
 * - {@link language.defaultHighlightStyle|default highlight style}
 */
export default (options: import('./index').NeoCodemirrorOptions): Extension => [
	highlightSpecialChars(),
	history(),
	drawSelection(),
	syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
	keymap.of(
		([] as readonly KeyBinding[]).concat(
			defaultKeymap,
			historyKeymap,
			options.useTabs ? [indentWithTab] : []
		)
	),
];
