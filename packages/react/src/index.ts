import type { Transaction } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';
import { NeoCodemirrorOptions, codemirror, withCodemirrorInstance } from '@neocodemirror/svelte';
import { createElement, useEffect, useMemo, useRef } from 'react';

('use client');

interface CodemirrorProps extends NeoCodemirrorOptions {
	class?: string;
	ref?: React.MutableRefObject<ReturnType<typeof withCodemirrorInstance>>;
	onTextChange?: (text: string) => void;
	onChange?: (tx: Transaction) => void;
	onDocumentChanging?: (view: EditorView) => void;
	onDocumentChanged?: (view: EditorView) => void;
}

export function Codemirror({
	class: className,
	ref,
	onTextChange,
	onChange,
	onDocumentChanged,
	onDocumentChanging,
	...options
}: CodemirrorProps) {
	const target_ref = useRef<HTMLElement>();
	const instance_ref = useRef<ReturnType<typeof codemirror>>();
	const instance_store = useMemo(withCodemirrorInstance, []);
	const merged_options = useMemo(() => {
		return {
			...options,
			instance_store,
		};
	}, [options, instance_store]);

	useEffect(() => {
		if (typeof window === 'undefined') return;
		if (!target_ref.current) return;

		if (!instance_ref.current) {
			instance_ref.current = codemirror(target_ref.current, merged_options);
			return;
		}

		instance_ref.current?.update?.(merged_options);

		return instance_ref.current.destroy;
	}, [merged_options]);

	useEffect(() => {
		if (ref) ref.current = instance_store;
	}, [ref, instance_store]);

	// provide event listeners
	useEffect(() => {
		const onTextChange_callback = (e: CustomEvent) => onTextChange?.(e.detail);
		const onChange_callback = (e: CustomEvent) => onChange?.(e.detail);
		const onDocumentChanging_callback = (e: CustomEvent) => onDocumentChanging?.(e.detail);
		const onDocumentChanged_callback = (e: CustomEvent) => onDocumentChanged?.(e.detail);

		// @ts-ignore
		target_ref.current?.addEventListener('codemirror:textChange', onTextChange_callback);
		// @ts-ignore
		target_ref.current?.addEventListener('codemirror:change', onChange_callback);
		// @ts-ignore
		target_ref.current?.addEventListener(
			'codemirror:documentChanging',
			onDocumentChanging_callback
		);
		// @ts-ignore
		target_ref.current?.addEventListener('codemirror:documentChanged', onDocumentChanged_callback);

		return () => {
			// @ts-ignore
			target_ref.current?.removeEventListener('codemirror:textChange', onTextChange_callback);
			// @ts-ignore
			target_ref.current?.removeEventListener('codemirror:change', onChange_callback);
			// @ts-ignore
			target_ref.current?.removeEventListener(
				'codemirror:documentChanging',
				onDocumentChanging_callback
			);
			// @ts-ignore
			target_ref.current?.removeEventListener(
				'codemirror:documentChanged',
				onDocumentChanged_callback
			);
		};
	}, [onTextChange, onChange, onDocumentChanged, onDocumentChanging]);

	return createElement('div', { ref: target_ref, className });
}
