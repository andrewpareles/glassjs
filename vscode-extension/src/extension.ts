// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WebSocket, WebSocketServer } from 'ws';
import { useLogging, logUserSubmission, logErrorSubmittingRequest } from './logging';
import { historyElt, historyGPTElt, historySaveElt, server_out, server_onsubmit_in, server_in } from '../../vscode_react_types';

import OpenAI from 'openai';
import * as path from 'path';
import { v4 as uuid } from 'uuid';


const PORT = 3002;

// history type
const history: historyElt[] = [];
let historyIdx: number = -1; // anywhere between -1 and infinity, -1 means no changes in history yet

// filename -> original text
const originalTextOfGlobalpath: { [globalPath: string]: string } = {};

// whether we are saving the file right now
let we_are_saving = false;

// updates state of history and historyIdx appropriately 
const addToHistoryHere = (newHistoryElt: historyElt) => {
	history.splice(historyIdx + 1);
	historyIdx = historyIdx + 1;
	history.push(newHistoryElt);
};



const globalPathOfFilename = (fileName: string) => {
	let letter0 = fileName.substring(0, 1);
	if (letter0.match(/[a-zA-Z]/)) {
		return letter0.toUpperCase() + fileName.substring(1,);
	}
	return fileName;
};




// remove line numbers from every line
const removeLineNumbers = (numberedCode: string) => {
	const lines = numberedCode.split('\n');
	const originalCode = lines.map(line => {
		const index = line.indexOf('::');
		return index !== -1 ? line.substring(index + 2) : line;
	}).join('\n');
	return originalCode;
};

// add line numbers to every line starting at offset (0-indexed)
const addLineNumbers = (code: string, offset: number) => {
	const lines = code.split('\n');
	const numberedCode = lines.map((line, i) => `${offset + i}::${line}`).join('\n');
	return numberedCode;
};






// the way we pass name and code to GPT
const gptFileTextOf = ({ baseName, numberedCode }: { baseName: string, numberedCode: string }) => {
	return `
${baseName}:
\`\`\`
${numberedCode}
\`\`\``;
};








// the full prompt we send to GPT
const gptPromptMsgOf = ({ GPT_selection, GPT_instructions, GPT_files, GPT_selection_caller, GPT_selection_caller_key }: { GPT_selection: string, GPT_instructions: string, GPT_files: string, GPT_selection_caller: string | undefined, GPT_selection_caller_key: string | undefined }) => {

	// GPT_selection_caller = undefined;

	return `
${GPT_selection_caller ? `${/* if SELECTION_CALLER */''}
I am currently selecting this piece of code${GPT_selection_caller_key ? `, where the key is equal to ${GPT_selection_caller_key}` : ''}:
\`\`\`
${GPT_selection_caller}
\`\`\`

Specifically, I am describing changes about this part of the component:
\`\`\`
${GPT_selection}
\`\`\`

You may need to add a prop in order to make this change. If you do add one, make sure it's valid in all locations (e.g. if you add the className prop to the instance, make sure it actually accepts the className prop).

` : `${/* if NOT SELECTION_CALLER */''}
I am currently selecting this piece of code:
\`\`\`
${GPT_selection}
\`\`\`
`}${/* <-- end if */''}

Please edit my selection following these instructions:
${GPT_instructions}


Respond with a JSON containing an array of all the edits you will make to the codebase.
The JSON should contain an \`edits\` array. Each entry in the array should contain an original piece of code EXACTLY as it appears in the codebase \`beforeCode\` including the line numbers. It should also contain the edited piece of code \`afterCode\`, also including line numbers.
The original code will be FULLY REPLACED by the new code that you output. 

You need to make sure your outputted code works as-is. Do not hallucinate. Never write down a variable, Component name, or import that doesn't already exist in the given code.

Be VERY CAREFUL not to duplicate or delete anything in your response. The locations you choose are very important.

Here are the relevant files in my codebase (filename followed by code):
${GPT_files}

`;
};











// creates an example that's used in the system message, changes: [startline, endline, newcode]
const gptExampleOf = ({ prompt, code, baseName, selectionLines, selectionCallerLines, selectionCallerKey, changes, n }: { prompt: string, code: string, baseName: string, selectionLines: [number, number], changes: [number, number, string][], n: number, selectionCallerLines: [number, number] | undefined, selectionCallerKey: string | undefined, }) => {
	const numberedCode = addLineNumbers(code, 1);

	const numberedSelectionCode = numberedCode.split('\n').filter((val, i) => selectionLines[0] <= (i + 1) && (i + 1) <= selectionLines[1]).join('\n');
	const numberedSelectionCallerCode = selectionCallerLines === undefined ? undefined : numberedCode.split('\n').filter((val, i) => selectionCallerLines[0] <= (i + 1) && (i + 1) <= selectionCallerLines[1]).join('\n');

	const outputStr = `[${changes.map(([startLineOffset, endLineOffset, newCode]) => {
		return `{
	beforeCode: "${numberedCode.split('\n').filter((val, i) => startLineOffset <= (i + 1) && (i + 1) <= endLineOffset).join('\\n')}",
	afterCode: "${addLineNumbers(newCode, startLineOffset).replaceAll('\n', '\\n')}"
}`;
	}).join(', ')}]`;

	return (`
---------- EXAMPLE ${n} INPUT ----------
${gptPromptMsgOf({ // add a new component
		GPT_instructions: prompt,
		GPT_files: `${gptFileTextOf({ baseName, numberedCode })}`, // this is normally a mapped/joined str of all the gptFileTextOfs, but here it's just 1 file
		GPT_selection: numberedSelectionCode, // numbered string of the user's selection. It starts on startLine (indexed at 1)
		GPT_selection_caller: numberedSelectionCallerCode, // numbered string of the instance of the component that the user's selection appears in 
		GPT_selection_caller_key: selectionCallerKey,
	})}

---------- EXAMPLE ${n} OUTPUT ----------
${outputStr}

`);
};








const e1 = gptExampleOf({
	n: 1,
	baseName: 'index.tsx',
	prompt: 'insert a new component above this',
	code: `"use client"
import React, { useState } from 'React'
const Header = ({ children }: { children: React.ReactNode }) => {

	const [isClicked, setIsClicked] = useState(false)

	return <div className='bg-gray-200'>
		<span className='mt-5 py-2 mb-[200px]'>Glass</span>
		<button onClick={(e) => setIsClicked(v => !v)} className={\`duration-200 $\{isClicked ? 'bg-blue-500' : 'bg-transparent'\}\`}>Toggle Blue BG Button</button>
		{children}
	</div>
}
`,
	selectionLines: [7, 11],
	changes: [
		[2, 2, `import React, { useState } from 'React'
MyComponent = () => {
	return <div>
		This is a new component.
	</div>
}`],
		[7, 7, `	return <>
		<MyComponent />
		<div className='bg-gray-200'>`],
		[11, 11,
			`		</div>
	</>`],
	],
	selectionCallerLines: undefined,
	selectionCallerKey: undefined,
});

const e2 = gptExampleOf({
	n: 2,
	baseName: 'index.tsx',
	prompt: 'make this red',
	code: `const Announcement = ({ title, description }: { title: string, description: string }) => {
	return <div className="text-lg text-black">
		<div className='text-3xl text-blue-900'>
			{title}
		</div>
		<div>{description}</div>
	</div>
}
const App = () => {
	return <>
		<Announcement />
		<Announcement />
	</>
}`,
	selectionLines: [3, 5],
	changes: [
		[3, 3, `		<div className='text-3xl text-black'>`],
	],
	selectionCallerLines: undefined,
	selectionCallerKey: undefined,

});

const e3 = gptExampleOf({
	n: 3,
	baseName: 'index.tsx',
	prompt: 'make this red',
	code: `const Announcement = ({ title, description }: { title: string, description: string }) => {
	return <div className="text-lg text-black">
		<div className='text-3xl text-blue-900'>
			{title}
		</div>
		<div>{description}</div>
	</div>
}
const App = () => {
	return <>
		<Announcement />
		<Announcement />
	</>
}`,
	selectionLines: [3, 5],
	changes: [
		[1, 3, `const Announcement = ({ title, description, titleIsRed }: { title: string, description: string, titleIsRed: boolean }) => {
	return <div className="text-lg text-black">
		<div className='text-3xl \${titleIsRed ? 'text-red-500' : 'text-blue-900'}'>`],
		[11, 11, `		<Announcement titleIsRed={true} />`],
	],
	selectionCallerLines: [11, 11],
	selectionCallerKey: undefined,
});

const e4 = gptExampleOf({
	n: 4,
	baseName: 'index.tsx',
	prompt: 'delete anything that\'s red here',
	code: `const Card = ({ title, description }: { title: string, description: string }) => {
	return <div className="text-lg text-black">
		<div className='p-5'>
			<div className='text-3xl text-blue-900'>
				{title}
			</div>
			<div>{description}</div>
			<div className='text-red-500'>
				{'email: '}<span>{\`hacker@google.com\`}</span>
				{'phone: '}<span>917 555 5555</span>
			</div>
			<br/>
			Author: <div className='text-red-500'>name</div>
		</div>
	</div>
}
const App = () => {
	return <>
		<Card />
		<Card />
	</>
}`,
	selectionLines: [3, 14],
	changes: [
		[8, 11, ``],
		[13, 13, `			Author: `],
	],
	selectionCallerLines: undefined,
	selectionCallerKey: undefined,
});

const e5 = gptExampleOf({
	n: 5,
	baseName: 'index.tsx',
	prompt: 'make this dimmer',
	code: `import { useState } from "react";

const FAQs = [
	// {
	//     Q: \`Is Glass an agent?\`,
	//     A: \`Not really. Glass doesn't make sweeping changes, and is made for.\`,
	// },
	// {
	//     Q: \`What problem does Glass solve?\`,
	//     A: \`We know how annoying it is to fish through source code 🎣 or endlessly edit tailwind styles 😵‍💫. We made Glass to fix that. Glass lets you edit the look and feel of your website the natural way - visually.\`,
	//     // A: \`We know how annoying it is to fish through source code 🎣 or endlessly edit tailwind styles 😵‍💫. We made Glass to fix that. Glass lets you escape the grunt work and focus on what matters - the look and feel of your website.\`,
	// },
	{
		Q: \`Does Glass support app or pages router?\`,
		A: \`Yes - both!\`,
	},
	{
		Q: \`What stage are you in?\`,
		A: \`Glass is in open beta for YC companies. Early stages but quickly improving 💪.\`,
	}
]

const FAQItem = ({ item }: { item: { Q: React.ReactNode, A: React.ReactNode } }) => {
    const [opened, setOpened] = useState<boolean>(false)
    const toggleCollapse = () => setOpened(!opened);

    return <div>
        <div className="cursor-pointer" onClick={() => toggleCollapse()}>


            {/* <Divider /> */}
            <div className='flex items-center justify-between gap-4'>
                <div className={\` my-4 text-lg font-medium select-none duration-200 \${opened ? 'text-primary text-blue-500' : 'text-black'}\`}>
                    {item.Q}
                </div>
                <svg className="flex-shrink-0 w-4 h-4 fill-black " viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <rect y="7" width="16" height="2" rx="1" className={\`transform origin-center transition duration-200 ease-out rotate-90 \${opened && 'hidden'} \${opened ? 'fill-blue-500' : 'fill-black'}\`}></rect>
                    <rect y="7" width="16" height="2" rx="1" className={\`transform origin-center transition duration-200 ease-out \${opened ? 'rotate-180 fill-blue-500' : 'rotate-0 fill-black'}\`}></rect>
                </svg>
            </div>

        </div>

        <div className={\`m-0 text-base transition-all duration-500 \${opened ? 'opacity-100 max-h-screen' : 'opacity-0 max-h-0 overflow-hidden'}\`}>
            {item.A}
        </div>
        {/* <Collapse in={opened} transitionDuration={200} animateOpacity={false} transitionTimingFunction='ease-out'>
        </Collapse> */}
    </div>
}

export default function App() {
	return <div className="basis-1/2 flex flex-col w-full gap-4 text-black">
		{FAQs.map((item, i) => <FAQItem key={i} item={item} />)}
	</div>
}`,
	selectionLines: [33, 35],
	changes: [
		[23, 23, `const FAQItem = ({ item, isDim }: { item: { Q: React.ReactNode, A: React.ReactNode }, isDim: boolean }) => {`],
		[33, 33, `                <div className={\` my-4 text-lg font-medium select-none duration-200 \${opened ? 'text-primary text-blue-500' : 'text-black'} \${isDim ? 'opacity-50' : 'opacity-100'} \`}>`],
		[54, 54, `		{FAQs.map((item, i) => <FAQItem key={i} item={item} isDim={i === 2} />)}`],
	],
	selectionCallerLines: [54, 54],
	selectionCallerKey: '2',

});




const systemMsg = `
You are a React and Nextjs coding assistant. Your job is to edit the code you're given by following the user's instructions. 

The user will always give you 3 things:

1. Lines of code that are currently selected
2. Instructions on how to edit this selection
3. All relevant code in the codebase. This code also includes line numbers 1::, 2::, ...


Follow the user's instructions and return a JSON of all of the edits you should make in the codebase.

The JSON must contain an \`edits\` array.
Each entry in the \`edits\` array must contain the piece of code before editing \`beforeCode\` and the piece of code after editing \`afterCode\` (including line numbers).

Here's the type of the JSON:
{
	edits: { beforeCode: string, afterCode: string }[]
}

Tips:

You can edit multiple files or locations if needed.
Import packages like 'React' when needed, but make sure not to duplicate imports.
Use tailwindcss. Do not write <style> tags.
Change the tabbing and spacing as little as possible - don't add or remove any newlines or whitespace.
DO NOT remove any comments, logic, or characters unless you absolutely have to.
Go with the coding conventions of the user - if they use semicolons use them; if they don't then don't. If the user spaces things like {props} then go with that convention, and if they space things like { props } then go with that convention. 
A user's prompt is ALWAYS about visuals. For example, if the user asks you to add whitespace, don't space apart the code - instead, add styles to make their components more spaced apart.
You are using React, and it's bad practice to use \`document.\`. You should always use useState instead of writing \`document.\`.
If you add a <button>, <input>, <textarea>, or any other input elements, make sure to also add useState to track its value. Always track the state of every input. 
Do not add new files. If the user asks you to add a component, assume they want you to add it to one of the given files. 
Never write "export" or "export default", unless asked explicitly to export something. 
If the file is typescript (.ts or .tsx), add type annotations if possible.
You need to make sure your outputted code works as-is. Do not hallucinate. Never write down a variable, Component name, or import that doesn't already exist in the given code.
The words "above" and "below" typically mean "prior sibling" or "next sibling" in the DOM hierarchy.
beforeCode and afterCode should always start with the same line number.
All edits you make must have disjoint line numbers in \`beforeCode\`.

Here are a few common mistakes you should avoid:

1. You must put all declarations like let statements OUTSIDE OF JSX tags. For example, the following code is BAD, DO NOT DO THIS:
\`\`\`
3::const MyComponent = () => { // BAD CODE
4::	return <div>
5::		{let CustomComponent = () => { ... } /* <-- invalid: javascript must be located outside of HTML */}
6::	</div>
7::}
\`\`\`


2. If you add a sibling element to the root, make sure to wrap the whole return value with a fragment <></>. For example, the following code is BAD, DO NOT DO THIS:
\`\`\`
3::const MyComponent = () => { // BAD CODE
4::	return
5::		<div>original div</div>
6::		<div>new div</div>
7::
8::}
\`\`\`


3. All React methods like \`useState\` and \`useRef\` must be used inside of a Component.



Here are a few examples of a good output:

${e1}

${e2}

${e3}

${e4}

${e5}

`;






console.log('SYSTEM MSG', systemMsg, '\n-------');





console.log(e1);
console.log(e2);
console.log(e3);
console.log(e4);
console.log(e5);








// numbered code -> range (start/end)
const getRangeOfNumberedCode = (numberedCode: string) => {
	const lines = numberedCode.split('\n');

	// Filter out lines that do not contain valid line numbers
	const numberedLines = lines.filter(line => /^\d+::/.test(line));

	if (numberedLines.length === 0) {
		return null; // or handle the case where no lines are numbered
	}

	const firstLineNumber = parseInt(numberedLines[0].split('::')[0]);
	const lastLineNumber = parseInt(numberedLines[numberedLines.length - 1].split('::')[0]);

	return { start: firstLineNumber, end: lastLineNumber };
};




// range and rangeOfFilenum -> filenum
const getFilenumOfRange = (range: [number, number], rangeOfFilenum: [number, number][]) => {
	const start = range[0];
	const end = range[1];
	// loop over all ranges
	for (const [idx, currRange] of rangeOfFilenum.entries()) {
		const minStart = currRange[0];
		const maxEnd = currRange[1];
		if (minStart <= start && end <= maxEnd) { // if range is valid
			return idx;
		}
	}
	return -1; // a valid idx was not found
};








const diffContents = async (content1: string, content2: string, title1: string, title2: string) => {
	const uri1 = vscode.Uri.parse(`untitled:${title1}`);
	const uri2 = vscode.Uri.parse(`untitled:${title2}`);

	// Create untitled documents with the contents
	const doc1 = await vscode.workspace.openTextDocument(uri1);
	const doc2 = await vscode.workspace.openTextDocument(uri2);

	// Edit the documents to insert the contents
	const edit = new vscode.WorkspaceEdit();
	edit.insert(uri1, new vscode.Position(0, 0), content1);
	edit.insert(uri2, new vscode.Position(0, 0), content2);
	await vscode.workspace.applyEdit(edit);

	// Show diff
	await vscode.commands.executeCommand('vscode.diff', uri1, uri2, `${title1} ↔ ${title2}`);
};









async function getCurrentFileContentsOf(globalPaths: string[]) {
	const currentFiles = await Promise.all(globalPaths.map(async (globalPath) => {
		// Find the editor for the current file
		const document = await vscode.workspace.openTextDocument(vscode.Uri.file(globalPath));
		const currentContent = document.getText();
		return currentContent;
	}));

	return currentFiles;
}




const getUnsavedFilesIn = async (globalPaths: string[]) => {
	let unsaved_files: string[] = [];
	for (const globalPath of globalPaths) {
		const doc = await vscode.workspace.openTextDocument(globalPath);
		if (doc.isDirty) { // file has not been saved
			unsaved_files.push(globalPath);
		}
	}
	return unsaved_files;
};




type gptOutputtedEdit = { beforeCode: string, afterCode: string }; // beforeCode and afterCode are strings with line numbers
type processedEdit = gptOutputtedEdit & { start: number, end: number, globalPath: string };

const makeEdits = async (body: unknown, state: stateType, call_id: string): Promise<server_out | 'ignore'> => {

	// validate req body
	let init_err_msg = validateReqBody(body);
	if (init_err_msg) {
		logErrorSubmittingRequest(init_err_msg);
		return { type: 'err_msg', message: init_err_msg };
	}

	// req body is now valid
	const req_body = body as server_onsubmit_in['body'];
	const { globalPaths, startLine, endLine, instructions, selectionCaller } = req_body;
	console.log('SEL CALLER:', selectionCaller);

	// make sure all files are saved right when they submit (we also do this later for end-to-end safety. The check here is just for convenience so user doesn't have to wait)
	const unsaved_files_0 = await getUnsavedFilesIn(globalPaths);
	if (unsaved_files_0.length !== 0) {
		return { type: 'err_unsaved_files', files: unsaved_files_0 };
	}


	// first, gather all documents, content, and file names, and prepare inputs to GPT
	console.log('\n--- Gathering files... --- \n');

	const documents: vscode.TextDocument[] = [];
	const baseNames: string[] = [];
	const fileContents: string[] = [];

	const rangeOfFilenum: [number, number][] = []; // the line identifier ranges of each file, eg [[1, 20], [21, 25], [26, 400], [401, 405]]
	const numberedFileContent: string[] = [];

	let lineOffset = 1;
	for (const globalPath of globalPaths) {
		const doc = await vscode.workspace.openTextDocument(globalPath);

		let baseName = path.basename(globalPath);
		let fileContent = doc.getText();
		let numLines = doc.lineCount;
		let numberedCode = addLineNumbers(fileContent, lineOffset);

		documents.push(doc);
		baseNames.push(baseName);
		fileContents.push(fileContent);
		rangeOfFilenum.push([lineOffset, lineOffset + numLines - 1]);
		numberedFileContent.push(gptFileTextOf({ baseName, numberedCode }));
		lineOffset += numLines;
	}

	console.log('\n--- Creating GPT input --- \n');

	const selectedCode = documents[0].getText(new vscode.Range(new vscode.Position(startLine - 1, 0), new vscode.Position(endLine - 1, Number.MAX_SAFE_INTEGER)));
	const GPT_selection = addLineNumbers(selectedCode, startLine); // numbered string of the user's selection. It starts on startLine (indexed at 1)



	let GPT_selection_caller: string | undefined = undefined;
	if (selectionCaller) {
		let documentNum = globalPaths[0] === selectionCaller.globalPath ? 0 : 1;
		let selectionCallerOffset = documentNum === 0 ? 0 : documents[0].lineCount;
		const selectionCallerCode: string | undefined = documents[documentNum].getText(new vscode.Range(new vscode.Position(selectionCaller.startLine - 1, 0), new vscode.Position(selectionCaller.endLine - 1, Number.MAX_SAFE_INTEGER)));
		GPT_selection_caller = addLineNumbers(selectionCallerCode, selectionCallerOffset + selectionCaller.startLine);
	}

	const GPT_files = numberedFileContent.join('\n');


	const apiKey: string | undefined = vscode.workspace.getConfiguration('glass').get('openAiApiKey')
	if (!apiKey) {
		const msg = 'Please set your Glass OpenAI API key in settings (press Ctrl+, and search Glass).'
		vscode.window.showErrorMessage(msg);
		return { type: 'err_msg', message: msg }
	}
	const model: string | undefined = vscode.workspace.getConfiguration('glass').get('openAiModel')

	// Call GPT
	console.log('\n--- Calling GPT --- \n');
	console.log('\n--- creating openai instance --- \n');
	const openai = new OpenAI({ apiKey: apiKey });
	console.log('\n--- done creating instance --- \n');
	const promptMsg = gptPromptMsgOf({
		GPT_selection,
		GPT_instructions: instructions,
		GPT_files,
		GPT_selection_caller,
		GPT_selection_caller_key: selectionCaller?.key
	});
	console.log('\n--- promptMsg: --- \n', '\n', promptMsg);
	console.log('\n--- sending to GPT --- \n');

	// get and process GPT's edits
	let processedEdits: processedEdit[] = [];
	try {
		// generate from OpenAI
		const completion = await openai.chat.completions.create({
			messages: [
				{ role: "system", content: systemMsg },
				{ role: "user", content: promptMsg },
			],
			response_format: { type: 'json_object' },
			model: model ?? 'gpt-4o',
		});

		// parse, validate, and process edits
		const outputStr = completion.choices[0].message.content + '';
		const gptOutputtedEdits: unknown[] = JSON.parse(outputStr)?.['edits'];
		console.log('\n--- GPT response: ---\n');
		console.log(gptOutputtedEdits);

		for (const gptOutputtedEdit of gptOutputtedEdits) {
			// check that GPT's output is of the right type, assume the gptEdit is the wrong type
			// @ts-ignore
			if (typeof gptOutputtedEdit !== 'object' || typeof gptOutputtedEdit?.beforeCode !== 'string' || typeof gptOutputtedEdit?.afterCode !== 'string') {
				console.log(`GPT gave an output of the wrong format. edits=${JSON.stringify(gptOutputtedEdit)}`);
				const message = `Error: output must be a JSON with keys "beforeCode" and "afterCode".`;
				logErrorSubmittingRequest(message);
				return { type: 'err_msg', message };
			}

			const validatedGptOutputtedEdit = gptOutputtedEdit as gptOutputtedEdit;
			const { beforeCode, afterCode } = validatedGptOutputtedEdit;

			const startAndEnd = getRangeOfNumberedCode(beforeCode);

			// validate start and end
			if (startAndEnd === null) {
				console.log(`GPT gave an output that was invalid. Sorry!`);
				const message = `GPT gave an output that was invalid. Sorry!`;
				logErrorSubmittingRequest(message);
				return { type: 'err_msg', message };
			}

			// check that `filenum` corresponding to `start` and `end` is valid
			const { start, end } = startAndEnd;
			const filenum = getFilenumOfRange([start, end], rangeOfFilenum);
			if (filenum === -1) {
				console.log(`GPT gave an incorrect range to edit. start=${start}, end=${end}`);
				const message = `GPT gave an output in the wrong format.`;
				logErrorSubmittingRequest(message);
				return { type: 'err_msg', message };
			}

			// add `start`, `end`, and `globalPath` to the edit
			let processedEdit: processedEdit = { ...validatedGptOutputtedEdit, start, end, globalPath: globalPaths[filenum] };
			processedEdits.push(processedEdit);
		}

	} catch (error) {
		console.log('Error receiving message from GPT' + error);
		const message = 'There was a problem communicating with our AI. Apologies!';
		logErrorSubmittingRequest(message);
		return { type: 'err_msg', message };
	}



	// yield to event loop so we can check cancelBecauseFileSaved
	await new Promise((res, rej) => setTimeout(res, 0));

	// check signal for if user changed a file in the meantime
	if (state.is === 'submitting' && state.signal) { // it will be submitting here, that check is just for ts
		const { cancelBecauseFileSaved } = state.signal;
		const message = `Canceled Glass request (Glass was using this file and you saved it!).`;
		state.signal = undefined;
		vscode.window.showInformationMessage(`✖️ ${message}`);
		return { type: 'canceled', message: message };
	}

	// right before applying edits, make sure files are unsaved
	const unsaved_files = await getUnsavedFilesIn(globalPaths);
	if (unsaved_files.length !== 0) {
		return { type: 'err_unsaved_files', files: unsaved_files };
	}

	// if it took a long time to get here and another call started, cancel this call
	if (state.is === 'submitting' && state.call_id !== call_id) {
		return 'ignore';
	}


	// create the workspaceEdit object which applies GPT's edits
	let edited_files = new Set<string>();
	let workspaceEdit = new vscode.WorkspaceEdit();
	try {
		// sort edits in reverse order so editing in the wrong order isn't a problem (assuming disjoint edits...)
		processedEdits.sort((a, b) => b.start - a.start);

		// log all of the edits
		console.log('\n--- making these edits: ---\n');
		for (const [idx, edit] of processedEdits.entries()) {
			console.log(`--- edit #${idx + 1} ---`);
			console.log('beforeCode: ' + edit.beforeCode);
			console.log('afterCode: ' + edit.afterCode);
			console.log('');
		}

		for (const edit of processedEdits) {
			let { start, end, beforeCode, afterCode, globalPath } = edit;

			let codeReplacement = removeLineNumbers(afterCode);
			let filenum = getFilenumOfRange([start, end], rangeOfFilenum);

			let localStart = start - rangeOfFilenum[filenum][0]; // line number in this file - "local" line number, 0-indexed (everything above has been 1-indexed)
			let localEnd = end - rangeOfFilenum[filenum][0];


			const range = new vscode.Range(new vscode.Position(localStart, 0), new vscode.Position(localEnd, Number.MAX_SAFE_INTEGER));
			workspaceEdit.replace(vscode.Uri.file(globalPath), range, codeReplacement);
			edited_files.add(globalPath);

			// // edit file
			// // console.log([`editing file:`, `name=${fileName}`, `beforeCode=${beforeCode}`, `afterCode=${afterCode}`].join('\n'));
			// const editor = await vscode.window.showTextDocument(vscode.Uri.file(globalPath));
			// const range = new vscode.Range(new vscode.Position(localStart, 0), new vscode.Position(localEnd, Number.MAX_SAFE_INTEGER));
			// await editor.edit(editBuilder => { editBuilder.replace(range, codeReplacement); });

		}
	}
	catch (error) {
		console.log('Error editing files' + error);
		const message = 'There was a problem applying our changes. Apologies!';
		logErrorSubmittingRequest(message);
		return { type: 'err_msg', message };
	}


	let edited_files_array: string[] = [];
	for (let globalPath of edited_files) {
		edited_files_array.push(globalPath);
	}
	const before_contents = await getCurrentFileContentsOf(edited_files_array);


	// save all files
	try {
		// const originalFiles = globalPaths.map((globalPath, idx) => ({ globalPath, content: fileContents[idx] }));
		if (state.is !== 'submitting') {
			return 'ignore';
		}
		console.log('\n--- Saving files... ---\n');
		await vscode.workspace.applyEdit(workspaceEdit);
		for (const globalPath of globalPaths) {
			// add to files that GPT is saving 
			const doc = await vscode.workspace.openTextDocument(globalPath);
			await vscode.commands.executeCommand('editor.action.formatDocument'); /// autoformat

			we_are_saving = true;
			await doc.save(); // save
			we_are_saving = false;
		}

		console.log('\n--- Tracking submit ---\n');
		logUserSubmission({ instructions, prompt: promptMsg, result: JSON.stringify(processedEdits) });
	} catch (error) {
		console.log('Error saving files' + error);
		const message = 'There was a problem saving our changes. Apologies!';
		logErrorSubmittingRequest(message);
		return { type: 'err_msg', message };
	}
	const after_contents = await getCurrentFileContentsOf(edited_files_array);


	const history_files: { globalPath: string, before: string, after: string }[] = [];
	for (let i = 0; i < after_contents.length; i++) {
		history_files.push({ globalPath: globalPaths[i], before: before_contents[i], after: after_contents[i] });
	}

	const historyElt: historyGPTElt = { type: 'GPT', userPrompt: instructions, files: history_files };

	// add to history if GPT succeeded
	addToHistoryHere(historyElt);

	return { type: 'GPT_updated_files_success', history: history, historyIdx: historyIdx };
};






const validateReqBody = (req_body_: unknown): string | undefined => {
	// validate req.body
	const req_body = req_body_ as server_onsubmit_in['body'] | null | undefined;
	if (!req_body) {
		const message = `We don't have enough information to edit the file. Please contact the devs!`;
		console.log(`No body was given in the request. req.body: ${req_body}`);
		// vscode.window.showInformationMessage(message);
		return message;
	}

	// check all parameters are not null
	const { globalPaths, instructions: GPT_instructions, startLine, endLine, startCol, endCol } = req_body;
	let presentParams = [globalPaths, GPT_instructions, startLine, endLine, startCol, endCol].map(v => v !== undefined);
	if (presentParams.some(v => !v)) {
		const message = `Not all params were sent - this usually happens because glass-swc is not properly installed (please see the swc step at https://useglass.ai/).`;
		console.log(`Not all parameters were sent to the server: ${JSON.stringify(presentParams)}.`);
		// vscode.window.showInformationMessage(message);
		return message;
	}

	// check there is at least 1 file path provided
	if (globalPaths.length === 0) {
		const message = `Could not find the file you selected.`;
		console.log('No file path was provided.');
		// vscode.window.showErrorMessage(message);
		return message;
	}
};









// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

function truncate(str: string, maxLength: number) {
	return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

// state of the server
export type stateType = {
	is: 'submitting',
	submit_body: server_onsubmit_in['body'],
	signal?: { cancelBecauseFileSaved: string }
	call_id: string, // in case takes too long
} | {
	is: 'idle'
};

let state: stateType = { is: 'idle' };




// assumes i < j, iterates backwards from j...i 
const getLowestGlobalpathBetweenHistory = (i: number, j: number) => {
	console.log('i=', i, 'j=', j, 'idx=', historyIdx, 'history=', history);
	let lowestIdxOfGlobalPath: { [globalPathToUndo: string]: number } = {};
	for (let k = j; k >= i; k -= 1) {
		let historyElt = history[k];
		// file names that were changed in this historyElt
		let globalPathsHere = historyElt.type === 'GPT' ? historyElt.files.map(v => v.globalPath) : Object.keys(historyElt.afterOfGlobalPath);
		// gather 
		for (let globalPath of globalPathsHere) {
			if (!(globalPath in lowestIdxOfGlobalPath)) {
				lowestIdxOfGlobalPath[globalPath] = k;
			}
		}
	}
	return lowestIdxOfGlobalPath;
};


let wss_: WebSocketServer | undefined = undefined;

export function activate(context: vscode.ExtensionContext) {

	console.log(`Glass WebSocket server is running on port ${PORT}`);
	// vscode.window.showInformationMessage('Glass is running! 🪟');

	useLogging(context);
	// useAutomagicInstall(context);


	const resetOriginalDocumentsStartingPoint = () => {
		// delete all entries in originalTextOfGlobalpath
		Object.keys(originalTextOfGlobalpath)
			.forEach(key => delete originalTextOfGlobalpath[key]);

		// init with currently-open documents
		vscode.workspace.textDocuments.forEach(document => {
			const globalPath = globalPathOfFilename(document.fileName);
			originalTextOfGlobalpath[globalPath] = document.getText();
		});
	};

	// initialize history with open documents
	resetOriginalDocumentsStartingPoint();

	// listen for document open
	let onOpenDisposable = vscode.workspace.onDidOpenTextDocument(document => {
		const globalPath = globalPathOfFilename(document.fileName);
		if (globalPath in originalTextOfGlobalpath) { return; } // don't update if original text of file was already recorded 
		originalTextOfGlobalpath[globalPath] = document.getText();
	});

	// listen for document close
	// let onCloseDisposable = vscode.workspace.onDidCloseTextDocument(document => {
	// 	delete originalTextOfFilename[globalPathOfFilename(document.fileName)];
	// });

	// add debug command
	let debugDisposable = vscode.commands.registerCommand('glassjs.debug', async () => {
		console.log('Debugged!');
		vscode.window.showInformationMessage('Glass is working properly! 🚀');
	});




	// websocket listeners
	const wss = new WebSocketServer({ port: PORT });
	wss_ = wss;
	console.log('created WS');
	wss.on('connection', (ws: WebSocket) => {
		console.log('connected!');
		// console.log('Client connected');
		// console.log('history', history);


		const undo_glass = async (data: server_in & { type: 'history_jump_back' }) => {

			// history: (assuming we're at i, jumping back to j, j < i)
			// j = data.toIdx (to)
			// ...
			// i = historyIdx (from)

			// gather all filenames to undo, ie fileNames between history[j+1...i], in reverse order
			let lowestIdxOfGlobalpath = getLowestGlobalpathBetweenHistory(data.toIdx + 1, historyIdx);
			console.log('LOWEST', lowestIdxOfGlobalpath);

			// for each globalPath, find the most recent prior version and revert it
			let workspaceEdit = new vscode.WorkspaceEdit();
			for (let [globalPath, idx] of Object.entries(lowestIdxOfGlobalpath)) {
				let found = false;
				for (let k = idx - 1; k >= 0; k -= 1) {
					// this is the most recent prior version
					let historyElt = history[k];
					// the 'after' of the matched globalPath here (or undefined if it doesn't exist here)
					let historyFileAfter = historyElt.type === 'GPT' ? historyElt.files.find(v => v.globalPath === globalPath)?.after : Object.entries(historyElt.afterOfGlobalPath).find(([fileName_, after]) => fileName_ === globalPath)?.[1];
					if (historyFileAfter !== undefined) {
						found = true;
						const wholeFileRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
						workspaceEdit.replace(vscode.Uri.file(globalPath), wholeFileRange, historyFileAfter);
						break; // break out of this loop b/c found the file
					}
				}
				if (!found) {
					let after = originalTextOfGlobalpath[globalPath];
					if (!after) {
						console.log('AFTER NOT FOUND FOR FILE:', globalPath, Object.keys(originalTextOfGlobalpath));
						continue;
					}
					const wholeFileRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
					workspaceEdit.replace(vscode.Uri.file(globalPath), wholeFileRange, after);
				}
			}

			// save all files
			await vscode.workspace.applyEdit(workspaceEdit);
			for (const globalPath in lowestIdxOfGlobalpath) {
				const doc = await vscode.workspace.openTextDocument(globalPath);
				await vscode.commands.executeCommand('editor.action.formatDocument'); /// autoformat

				we_are_saving = true;
				await doc.save(); // save
				we_are_saving = false;
			}

			historyIdx = data.toIdx;
			ws.send(JSON.stringify({ type: 'jump_back_success', historyIdx: historyIdx } satisfies server_out));
		};



		const redo_glass = async (data: server_in & { type: 'history_jump_forward' }) => {
			// history: (assuming we're at i, jumping forward to j, i < j)
			// i = historyIdx (from)
			// ...
			// j = data.toIdx (to)

			// gather all globalPaths to make changes to, ie globalPaths between history[j+1...i] 
			let lowestIdxOfGlobalpath2 = getLowestGlobalpathBetweenHistory(historyIdx + 1, data.toIdx);
			let workspaceEdit2 = new vscode.WorkspaceEdit();
			for (let [globalPath, k] of Object.entries(lowestIdxOfGlobalpath2)) {
				let historyElt = history[k];

				let after = historyElt.type === 'GPT' ? historyElt.files.find(v => v.globalPath === globalPath)?.after : Object.entries(historyElt.afterOfGlobalPath).find(([fileName_, after]) => fileName_ === globalPath)?.[1];
				if (!after) {
					console.log('EXPECTED after TO NOT BE NULL!', globalPath, k);
					continue;
				}
				const wholeFileRange = new vscode.Range(new vscode.Position(0, 0), new vscode.Position(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
				workspaceEdit2.replace(vscode.Uri.file(globalPath), wholeFileRange, after);
			}

			// save all files
			await vscode.workspace.applyEdit(workspaceEdit2);
			for (const globalPath in lowestIdxOfGlobalpath2) {
				const doc = await vscode.workspace.openTextDocument(globalPath);
				await vscode.commands.executeCommand('editor.action.formatDocument'); /// autoformat

				we_are_saving = true;
				await doc.save(); // save
				we_are_saving = false;
			}

			historyIdx = data.toIdx;
			ws.send(JSON.stringify({ type: 'jump_forward_success', historyIdx: historyIdx } satisfies server_out));

		};



		ws.on('message', async (message?: string) => {
			const data: server_in = JSON.parse(message || "{}");
			const init_historyIdx = historyIdx;

			switch (data.type) {
				case 'submit':

					// update submitState and then call onSubmitRequest
					let current_call_id = uuid();
					state = { is: 'submitting', submit_body: data.body, call_id: current_call_id };

					console.log('\n--- app received request --- \n');


					// make GPT edits
					let res: server_out | 'ignore';
					try {
						res = await makeEdits(data.body, state, current_call_id);
					} catch (error) {
						const message = `There was an error in the Glass VSCode Extension. Apologies!`;
						console.log('Error processing request: ' + error);
						logErrorSubmittingRequest(message);
						res = { type: 'err_msg', message };
					}

					// no longer submitting
					state = { is: 'idle' };

					// respond to the client
					if (res !== 'ignore') {
						// respond
						ws.send(JSON.stringify(res satisfies server_out));

						// in vscode, display the option to revert

						// vscode.window.setStatusBarMessage('');
						vscode.window.showInformationMessage(
							'Glass recently made a change. Congrats!',
							{ title: 'Keep 👍', value: 0 },
							{ title: `There was a problem - undo! 😢`, value: 1 },
						).then(async (selection) => {
							if (selection?.value === 1) {
								await undo_glass({ type: 'history_jump_back', toIdx: init_historyIdx });
								vscode.window.showInformationMessage('✅ Successful undo!');
							} else {
								// vscode.window.showInformationMessage('✅ Keeping change.');
							}
						});
					}
					break;

				case 'clear_history':
					resetOriginalDocumentsStartingPoint();
					history.splice(0);
					historyIdx = -1;
					ws.send(JSON.stringify({ type: 'full_history', history: history, historyIdx: historyIdx } satisfies server_out));
					break;

				case 'get_history':
					console.log('sending hist', history);
					ws.send(JSON.stringify({ type: 'full_history', history: history, historyIdx: historyIdx } satisfies server_out));
					break;

				case 'history_jump_back':
					undo_glass(data);
					break;

				case 'history_jump_forward':
					redo_glass(data);
					break;

				case 'get_editor':
					const appName = vscode.env.appName;


					let editor: 'vscode' | 'cursor' =
						appName === 'Cursor' ? 'cursor'
							: appName === 'Visual Studio Code' ? 'vscode'
								: 'vscode';

					ws.send(JSON.stringify({ type: 'editor', editor: editor } satisfies server_out));
					break;


				// case 'view_diff':
				// 	if (data.historyIdx === undefined || data.globalPath === undefined) {
				// 		const message = 'Missing a field in view_diff.';
				// 						logErrorSubmittingRequest(message);
				// 		ws.send(JSON.stringify({ type: 'err_msg', message } satisfies server_out));
				// 		break;
				// 	}
				// 	console.log('viewing diff');

				// 	let historyElt = history[data.historyIdx];
				// 	if (historyElt.type === 'GPT') {
				// 		let fileEntry = historyElt.files.find(v => v.globalPath === data.globalPath);
				// 		if (!fileEntry) {
				// 			const message = 'We couldn\'t diff that file because it\'s not in the history!';
				// 							logErrorSubmittingRequest(message);
				// 			ws.send(JSON.stringify({ type: 'err_msg', message } satisfies server_out));
				// 			break;
				// 		}
				// 		console.log('diff success');
				// 		await diffContents(fileEntry.before, fileEntry.after, 'a', 'b');

				// 	}
				// 	else if (historyElt.type === 'save') {

				// 	}
				// 	// TODO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
				// 	break;

				default:
					const message = `Unknown message type ${data.type}`;
					logErrorSubmittingRequest(message);
					ws.send(JSON.stringify({ type: 'err_msg', message } satisfies server_out));
					break;

			}

		});

		// dont need to worry about canceling unsaved changes b/c they're unsaved and we're already checking to make sure all relevant files are saved!

		// whenever user saves doc, add to history and cancel current edit
		let onSaveDisposable = vscode.workspace.onDidSaveTextDocument(async e => {
			const globalPath = globalPathOfFilename(e.fileName);

			// if GPT just saved this file (the reason for this event is GPT saving the file), then ignore the save, it wasn't by the user
			if (we_are_saving) {
				return;
			}

			// add the user's save to history
			// we're saving right now. If the length of history is 0, need a save to put it in, create it now
			if (history.length === 0) {
				let newHistoryElt: historyElt = { type: 'save', afterOfGlobalPath: {} };
				addToHistoryHere(newHistoryElt);
			}

			let lastHistoryElt = history[history.length - 1];

			// if the latest history elt is 'GPT', add a new 'save' history elt
			if (lastHistoryElt.type === 'GPT') {
				const historyElt: historyElt = { type: 'save', afterOfGlobalPath: { [globalPath]: e.getText() } };
				addToHistoryHere(historyElt);

				ws.send(JSON.stringify({ type: 'save', history: history, historyIdx: historyIdx } satisfies server_out)); // add new history elt
			}
			// if the latest history elt is 'save', add the file contents as the most recent "after" 
			else if (lastHistoryElt.type === 'save') {
				let after = e.getText();
				lastHistoryElt.afterOfGlobalPath[globalPath] = after;
				ws.send(JSON.stringify({ type: 'new_saved_file', newSavedFile: { globalPath: globalPath, after: after } } satisfies server_out)); // add new history elt
			}

			// if GPT is currently editing this file, cancel GPT
			if (state.is === 'submitting') {
				const globalPathMatch = state?.submit_body?.globalPaths.find(p => p === globalPath);
				if (globalPathMatch) {
					state.signal = { cancelBecauseFileSaved: globalPathMatch };
				}
			}
		});

		context.subscriptions.push(onSaveDisposable);

	});



	context.subscriptions.push(onOpenDisposable);
	// context.subscriptions.push(onCloseDisposable);
	context.subscriptions.push(debugDisposable);
}




// This method is called when your extension is deactivated
export function deactivate() {
	wss_?.close();
	console.log('DEACTIVATED GLASS');
}
