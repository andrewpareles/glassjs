// 'use client'

// import { useEffect, useRef } from 'react';
// import { EditorState } from '@codemirror/state';
// import { EditorView, keymap, lineNumbers, gutter } from '@codemirror/view';
// import { defaultKeymap } from '@codemirror/commands';
// import { javascript } from '@codemirror/lang-javascript';
// import { oneDark } from '@codemirror/theme-one-dark';


// const staticCodeTheme = EditorView.baseTheme({
//     '&.cm-editor.cm-focused': { outline: 'none' },
//     '.cm-cursor': { display: 'none' }, // Hide cursor
//     '.cm-selectionBackground, ::selection': { backgroundColor: 'transparent' } // Make selections invisible
// });


// const CodeEditor = ({ val }: { val: string }) => {
//     const editor = useRef<HTMLDivElement | null>(null);

//     useEffect(() => {
//         if (!editor.current)
//             return

//         const startState = EditorState.create({
//             doc: val,
//             extensions: [
//                 keymap.of(defaultKeymap),
//                 javascript(),
//                 oneDark,
//                 EditorView.editable.of(false),
//                 EditorView.baseTheme({ '.cm-content': { paddingLeft: '20px', } }),
//                 staticCodeTheme,

//             ],
//         });

//         const view = new EditorView({
//             state: startState,
//             parent: editor.current ?? undefined,
//         });

//         return () => { view.destroy(); };

//     }, [val]);

//     return <div className='px-2'>
//         <div ref={editor}
//             className='rounded-md overflow-hidden'
//         />
//     </div>;
// };

// export default CodeEditor;

export default function X() { return null } 
