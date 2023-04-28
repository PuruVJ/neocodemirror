import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { StateEffect, EditorState } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { map } from 'nanostores';

// src/index.ts
var withCodemirrorInstance = () => map({
  view: null,
  extensions: null,
  value: null
});
var codemirror = (node, options) => {
  if (!options)
    throw new Error("No options provided. At least `value` is required.");
  let {
    value,
    setup,
    lang,
    instanceStore,
    useTabs = false,
    tabSize = 2,
    theme,
    styles,
    // cursorPos,
    extensions
  } = options;
  let fulfill_editor_initialized;
  let editor_initialized = new Promise((r) => fulfill_editor_initialized = r);
  let editor;
  let internal_extensions = [];
  function handle_change() {
    const new_value = editor.state.doc.toString();
    if (new_value === value)
      return;
    value = new_value;
    node.dispatchEvent(new CustomEvent("codemirror:change", { detail: value }));
    instanceStore?.setKey("value", value);
  }
  const on_change = debounce(handle_change, 50);
  (async () => {
    internal_extensions = await make_extensions(
      lang,
      setup,
      useTabs,
      tabSize,
      theme,
      styles,
      extensions
    );
    editor = new EditorView({
      doc: value,
      extensions: internal_extensions,
      parent: node,
      dispatch(tr) {
        editor.update([tr]);
        if (tr.docChanged) {
          on_change();
        }
      }
    });
    instanceStore?.set({
      view: editor,
      extensions: internal_extensions,
      value
    });
    fulfill_editor_initialized();
  })();
  return {
    async update(new_options) {
      await editor_initialized;
      lang = new_options.lang;
      setup = new_options.setup;
      useTabs = new_options.useTabs ?? false;
      tabSize = new_options.tabSize ?? 2;
      theme = new_options.theme;
      extensions = new_options.extensions;
      internal_extensions = await make_extensions(
        lang,
        setup,
        useTabs,
        tabSize,
        theme,
        styles,
        extensions
      );
      editor.dispatch({
        effects: StateEffect.reconfigure.of(internal_extensions)
      });
      if (value !== new_options.value) {
        value = new_options.value;
        editor.dispatch({
          changes: {
            from: 0,
            to: editor.state.doc.length,
            insert: value
          }
        });
      }
      instanceStore?.set({
        view: editor,
        extensions: internal_extensions,
        value
      });
    },
    destroy() {
      editor_initialized.then(() => {
        editor?.destroy();
      });
    }
  };
};
async function make_extensions(lang, setup, useTabs = false, tabSize = 2, theme, styles, extensions) {
  const internal_extensions = [
    keymap.of([...defaultKeymap, ...useTabs ? [indentWithTab] : []]),
    EditorState.tabSize.of(tabSize),
    indentUnit.of(useTabs ? "	" : " ".repeat(tabSize))
  ];
  await do_setup(internal_extensions, { setup });
  if (lang) {
    internal_extensions.push(lang);
  }
  if (theme)
    internal_extensions.push(theme);
  if (styles)
    internal_extensions.push(EditorView.theme(styles));
  return [internal_extensions, extensions ?? []];
}
async function do_setup(extensions, { setup }) {
  if (setup) {
    const cm = await import('codemirror');
    if (setup === "basic") {
      extensions.push(cm.basicSetup);
    } else if (setup === "minimal") {
      extensions.push(cm.minimalSetup);
    } else {
      throw new Error(
        "`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop."
      );
    }
  }
}
function debounce(func, threshold, execAsap = false) {
  let timeout;
  return function debounced(...args) {
    const self = this;
    if (timeout)
      clearTimeout(timeout);
    else if (execAsap)
      func.apply(self, args);
    timeout = setTimeout(delayed, threshold || 100);
    function delayed() {
      if (!execAsap)
        func.apply(self, args);
      timeout = null;
    }
  };
}

export { codemirror, withCodemirrorInstance };
