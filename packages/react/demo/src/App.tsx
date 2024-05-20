import { Codemirror } from '@neocodemirror/react';
import { useState } from 'react';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';

const options = {
	svelte: {
		value: '<scr' + 'ipt>\n\tconsole.log("Hello, world!");\n</scr' + 'ipt>\n\nHello {world}',
	},
	js: {
		value: 'console.log("Hello, world!");',
	},
	md: {
		value: '# Hello\n ```js\nconsole.log("Hello, world!");\n```\n\nHello {world}',
	},
};

function App() {
	const [selected, setSelected] = useState<keyof typeof options>('svelte');
	const [setup, setSetup] = useState<'minimal' | 'basic' | undefined>('basic');

	return (
		<>
			<Codemirror
				value={options[selected].value}
				setup={setup}
				lang={selected}
				useTabs
				tabSize={2}
				theme={oneDark}
				extensions={[]}
				onTextChange={(text) => console.log(text)}
				langMap={{
					js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
					svelte: () => import('@replit/codemirror-lang-svelte').then((m) => m.svelte()),
					md: () =>
						Promise.all([
							import('@codemirror/lang-markdown'),
							import('@codemirror/language-data'),
						]).then(([{ markdown }, { languages }]) => markdown({ codeLanguages: languages })),
				}}
			/>
		</>
	);
}

export default App;
