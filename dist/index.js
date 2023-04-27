import { defaultKeymap as e, indentWithTab as t } from '@codemirror/commands';
import { indentUnit as n } from '@codemirror/language';
import { StateEffect as o, EditorState as i } from '@codemirror/state';
import { EditorView as a, keymap as s } from '@codemirror/view';
var l = [],
	r = (e = {}) => {
		let t = ((e, t) => {
			let n,
				o = [],
				i = {
					lc: 0,
					l: t || 0,
					value: e,
					set(e) {
						(i.value = e), i.notify();
					},
					get: () => (i.lc || i.listen(() => {})(), i.value),
					notify(e) {
						n = o;
						let t = !l.length;
						for (let t = 0; t < n.length; t += 2) l.push(n[t], i.value, e, n[t + 1]);
						if (t) {
							for (let e = 0; e < l.length; e += 4) {
								let t = !1;
								for (let n = e + 7; n < l.length; n += 4)
									if (l[n] < l[e + 3]) {
										t = !0;
										break;
									}
								t ? l.push(l[e], l[e + 1], l[e + 2], l[e + 3]) : l[e](l[e + 1], l[e + 2]);
							}
							l.length = 0;
						}
					},
					listen: (e, t) => (
						o === n && (o = o.slice()),
						(i.lc = o.push(e, t || i.l) / 2),
						() => {
							o === n && (o = o.slice());
							let t = o.indexOf(e);
							~t && (o.splice(t, 2), i.lc--, i.lc || i.off());
						}
					),
					subscribe(e, t) {
						let n = i.listen(e, t);
						return e(i.value), n;
					},
					off() {},
				};
			return i;
		})(e);
		return (
			(t.setKey = function (e, n) {
				void 0 === n
					? e in t.value && ((t.value = { ...t.value }), delete t.value[e], t.notify(e))
					: t.value[e] !== n && ((t.value = { ...t.value, [e]: n }), t.notify(e));
			}),
			t
		);
	},
	u = () => r({ state: null, extensions: null, value: null }),
	c = (e, t) => {
		if (!t) throw new Error('No options provided. At least `value` is required.');
		let n,
			i,
			{ value: s, setup: l, lang: r, instanceStore: u, useTabs: c = !1, tabSize: f = 2 } = t,
			m = new Promise((e) => (n = e)),
			d = [];
		const h = (function (e, t, n = !1) {
			let o;
			return function (...i) {
				const a = this;
				function s() {
					n || e.apply(a, i), (o = null);
				}
				o ? clearTimeout(o) : n && e.apply(a, i), (o = setTimeout(s, t || 100));
			};
		})(function () {
			const t = i.state.doc.toString();
			t !== s &&
				((s = t),
				e.dispatchEvent(new CustomEvent('neocm:change', { detail: s })),
				u?.setKey('value', s));
		}, 50);
		return (
			(async () => {
				(d = await p(r, l, c, f)),
					(i = new a({
						doc: s,
						extensions: d,
						parent: e,
						dispatch(e) {
							i.update([e]), e.docChanged && h();
						},
					})),
					u?.set({ state: i.state, extensions: d, value: s }),
					n();
			})(),
			{
				async update(e) {
					await m,
						(r = e.lang),
						(l = e.setup),
						(c = e.useTabs ?? !1),
						(f = e.tabSize ?? 2),
						(d = await p(r, l, c, f)),
						i.dispatch({ effects: o.reconfigure.of(d) }),
						s !== e.value &&
							((s = e.value),
							i.dispatch({ changes: { from: 0, to: i.state.doc.length, insert: s } }));
				},
				destroy() {
					m.then(() => {
						i?.destroy();
					});
				},
			}
		);
	};
async function p(o, a, l = !1, r = 2) {
	const u = [s.of([...e, ...(l ? [t] : [])]), i.tabSize.of(r), n.of(l ? '\t' : ' '.repeat(r))];
	return (
		await (async function (e, { setup: t }) {
			if (t) {
				const n = await import('codemirror');
				if ('basic' === t) e.push(n.basicSetup);
				else {
					if ('minimal' !== t)
						throw new Error(
							'`setup` can only be `basic` or `minimal`. If you wish to provide another setup, pass through `extensions` prop.'
						);
					e.push(n.minimalSetup);
				}
			}
		})(u, { setup: a }),
		o && u.push(o),
		u
	);
}
export { c as codemirror, u as withCodemirrorInstance };
