---
'@neocodemirror/svelte': minor
---

BREAKING: `on:codemirror:textChange` and `on:codemirror:change` now both return objects, and both have `cause` field to determine whether document change caused this event or editing did.

**textChange**:

```js
// Before
on:codemirror:textChange={(e) => {
  console.log(e.detail); // e.detail is string
}}

// After
on:codemirror:textChange={(e) => {
  console.log(e.detail.value); // e.detail is string
}}
```

**textChange**:

```js
// Before
on:codemirror:textChange={(e) => {
  console.log(e.detail); // e.detail is string
}}

// After
on:codemirror:textChange={(e) => {
  console.log(e.detail.value); // e.detail is string
}}
```
