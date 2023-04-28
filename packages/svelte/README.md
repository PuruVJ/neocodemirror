Neocodemirror

Aims to provide Codemirror 6 as an easy to use codemirror action.

Usage:

```svelte
<script>
  import { codemirror } from '@neocodemirror/svelte'
</script>

<div use:codemirror={{ value: 'Hello world' }} />
```

With Language:

```svelte
<script>
  import { codemirror } from '@neocodemirror/svelte'
  import { javascript } from '@codemirror/lang-javascript'
</script>

<div use:codemirror={{ value: 'Hello world', lang: javascript() }} />
```

Getting editor related data

```svelte
<script>
  import { codemirror, withCodemirrorInstance } from '@neocodemirror/svelte'
  import { javascript } from '@codemirror/lang-javascript'

  // This acts a readonly store. $ notation works here
  const cmInstance = withCodemirrorInstance()

  $: console.log($cmInstance.view, $cmInstance.value, $cmInstance.extensions)
</script>

<div use:codemirror={{ value: 'Hello world', lang: javascript(), instanceStore: cmInstance }} />
```

Note: Passing the store recieved from `withCodemirrorInstance` is required to get the editor related data. If you don't pass this store, you will not get any data.
