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

## Document mode

If you pass a `documentId` in the options you'll automatically enter document mode. In this mode whenever the `documentId` changes the state of the editor get's stored in a map and will later be restored when the `documentId` changes again. This allows for the history to be `documentId` contained (so for example if you change documentId and try to Ctrl+Z or Cmd+Z it will not work). Right before this swap and right after two events `on:codemirror:documentChanging` and `on:codemirror:documentChanged` will be fired. This allows you to store additional state that might not be serializable in the codemirror state.

```svelte
<script>
  import { codemirror } from '@neocodemirror/svelte'
  import { javascript } from '@codemirror/lang-javascript'

  const documents = [
	{
		title: '+page.svelte',
		content: '<scri lang="ts">export let data</scri'++'pt> {data.name}'
	},
	{
		title: '+page.js',
		content: 'export function load(){ return {name: "neocodemirror"} }'
	},
  ];

  let selected_document = 0;
</script>

{#each documents as document, i}
	<button on:click={()=> selected_document=i}>{document.title}</button>
{/each}

<div 
	on:codemirror:changeText={(new_text)=>{
		documents[selected_document].content=new_text;
	}}
	use:codemirror={{ 
		value: documents[selected_document].content, 
		documentId: documents[selected_document].title
	}} 
/>
```