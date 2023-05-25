/** This module is forked from codemirror package for local use */

import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import {
	bracketMatching,
	defaultHighlightStyle,
	foldGutter,
	foldKeymap,
	indentOnInput,
	syntaxHighlighting,
} from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState, type Extension } from '@codemirror/state';
import {
	KeyBinding,
	crosshairCursor,
	drawSelection,
	dropCursor,
	highlightActiveLine,
	highlightActiveLineGutter,
	highlightSpecialChars,
	keymap,
	lineNumbers,
	rectangularSelection,
} from '@codemirror/view';

/**
 * (The superfluous function calls around the list of extensions work
 * around current limitations in tree-shaking software.)
 *
 * This is an extension value that just pulls together a number of
 * extensions that you might want in a basic editor. It is meant as a
 * convenient helper to quickly set up CodeMirror without installing
 * and importing a lot of separate packages.
 *
 * Specifically, it includes...
 *
 *  - {@link commands.defaultKeymap|the default command bindings}
 *  - {@link view.lineNumbers|line numbers}
 *  - {@link view.highlightSpecialChars|special character highlighting}
 *  - {@link commands.history|the undo history}
 *  - {@link language.foldGutter|a fold gutter}
 *  - {@link view.drawSelection|custom selection drawing}
 *  - {@link view.dropCursor|drop cursor}
 *  - {@link state.EditorState^allowMultipleSelections|multiple selections}
 *  - {@link language.indentOnInput|reindentation on input}
 *  - {@link language.defaultHighlightStyle|the default highlight style} (as fallback)
 *  - {@link language.bracketMatching|bracket matching}
 *  - {@link autocomplete.closeBrackets|bracket closing}
 *  - {@link autocomplete.autocompletion|autocompletion}
 *  - {@link view.rectangularSelection|rectangular selection} and {@link view.crosshairCursor|crosshair cursor}
 *  - {@link view.highlightActiveLine|active line highlighting}
 *  - {@link view.highlightActiveLineGutter|active line gutter highlighting}
 *  - {@link search.highlightSelectionMatches|selection match highlighting}
 *  - {@link search.searchKeymap|search}
 *  - {@link lint.lintKeymap|linting}
 *
 * (You'll probably want to add some language package to your setup too.)
 *
 * This extension does not allow customization. The idea is that,
 * once you decide you want to configure your editor more precisely,
 * you take this package's source (which is just a bunch of imports
 * and an array literal), copy it into your own code, and adjust it
 * as desired.
 */
export default (options: import('./index').NeoCodemirrorOptions): Extension => [
	lineNumbers(),
	highlightActiveLineGutter(),
	highlightSpecialChars(),
	history(),
	foldGutter(),
	drawSelection(),
	dropCursor(),
	indentOnInput(),
	syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
	bracketMatching(),
	closeBrackets(),
	EditorState.allowMultipleSelections.of(true),
	options.autocomplete !== false ? autocompletion() : [],
	rectangularSelection(),
	crosshairCursor(),
	highlightActiveLine(),
	highlightSelectionMatches(),
	keymap.of(
		([] as readonly KeyBinding[]).concat(
			closeBracketsKeymap,
			defaultKeymap,
			searchKeymap,
			historyKeymap,
			foldKeymap,
			completionKeymap,
			lintKeymap,
			options.useTabs ? [indentWithTab] : []
		)
	),
];
