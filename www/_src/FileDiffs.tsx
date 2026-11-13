import { MonacoDiffEditor, DiffEditor, DiffEditorProps, Monaco } from "@monaco-editor/react"
import { Plus, Minus } from "lucide-react"
import { useRef, useEffect, useState, useMemo } from "react"
import { getBasename, openInCodeEditor } from "./lib"


const getFirstDifferentLine = (oldCode: string, newCode: string) => {
    const oldLines = oldCode.split('\n')
    const newLines = newCode.split('\n')
    for (let i = 0; i < oldLines.length; i++) {
        if (oldLines[i] !== newLines[i])
            return i + 1 // 1-indexed line numbers
    }
    return 1
}


type fileInfo = { content: string, globalPath: string }
const FileDiff = ({ beforeFile, afterFile, start_open, codeEditorName, trimCode }: { beforeFile: fileInfo, afterFile: fileInfo, start_open?: boolean, codeEditorName: 'vscode' | 'cursor', trimCode?: boolean }) => {

    let oldCode = beforeFile.content
    let newCode = afterFile.content

    if (trimCode) {
        // go thru all lines and remove leading and trailing whitespaces
        oldCode = oldCode.split('\n').map(l => l.trim()).join('\n')
        newCode = newCode.split('\n').map(l => l.trim()).join('\n')
    }

    const globalPath = afterFile.globalPath
    const baseName = getBasename(afterFile.globalPath);

    const firstDifferentLine = getFirstDifferentLine(oldCode, newCode)
    const scrollToLine = Math.max(0, firstDifferentLine) // this is a little broken so can add/subtract a few

    const editorRef = useRef<MonacoDiffEditor | null>(null);

    // default `opened` state
    let [opened, setOpened] = useState<boolean>(!!start_open);

    // scroll to first different line every render
    useEffect(() => {
        editorRef.current?.getModifiedEditor().revealLineInCenter(scrollToLine, 1);
        setTimeout(() => editorRef.current?.getModifiedEditor().revealLineInCenter(scrollToLine, 1), 500);
    }, [oldCode, newCode, scrollToLine, opened]);

    const editorHTML = useMemo(() => <DiffEditor
        // TODO make tsx highlighting work
        onMount={(editor, monaco) => {
            editorRef.current = editor;

            editorRef.current.getModifiedEditor().revealLineInCenter(scrollToLine, 1);
            setTimeout(() => editorRef.current?.getModifiedEditor().revealLineInCenter(scrollToLine, 1), 500);


            monaco.editor.defineTheme('customTheme', {
                base: 'vs',
                inherit: true,
                rules: [
                    { token: '', foreground: '000000' } // Set default text color here
                ],
                colors: {
                    'editor.background': '#f2f2f3', // Set your desired background color here
                },
            });
            monaco.editor.setTheme('customTheme');


            //   monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            //     jsx: monaco.languages.typescript.JsxEmit.React,
            //     jsxFactory: 'React.createElement',
            //     jsxFragmentFactory: 'React.Fragment',
            //   });
            //   // monaco.languages.typescript.typescriptDefaults.setCompilerOptions({ jsx: monaco.languages.typescript.JsxEmit.ReactJSX })
        }}

        loading={<div className='h-full w-full bg-[#f2f2f3] old-bg-[#1e1e1e]'></div>}

        language='text'
        height={'100px'} // 100% or the exact pixel height
        // theme={'vs-dark'}
        original={oldCode}
        modified={newCode}

        options={{
            renderSideBySide: false,
            matchBrackets: 'always',

            // detectIndentation: false, // we always want a tab size of 4
            // tabSize: 4,
            // insertSpaces: true,

            // glyphMargin: false,
            // renderIndentGuides: false,

            fontSize: 10,
            wordWrapColumn: 10000,
            // automaticLayout: true,
            wordWrap: 'bounded', // 'off'
            // wordBreak: 'keepAll',
            // automaticLayout: true,
            // lineDecorationsWidth: 0,
            lineNumbersMinChars: 4,
            lineNumbers: 'on',
            // renderLineHighlight: 'none',
            minimap: { enabled: false },
            scrollBeyondLastColumn: 0,
            padding: { top: 10, },
            scrollBeyondLastLine: true,
            scrollbar: {

                alwaysConsumeMouseWheel: true, //height !== undefined
                // vertical: 'hidden',
                // horizontal: 'hidden'
            },

            overviewRulerLanes: 0,
            readOnly: true,
            quickSuggestions: false,

            // ...options
        }}

    />, [newCode, oldCode, scrollToLine]
    )


    const onClickOverlay = () => openInCodeEditor(codeEditorName, globalPath, firstDifferentLine, 0)
    // const onClickOverlay = () => { }

    return <div className={`relative group mx-auto w-full px-2 max-w-[700px] pointer-events-auto z-50`}>
        <div className={`bg-[#f2f2f3] group border-t border-r border-l border-gray-400 py-1 px-2 flex items-center ${!opened ? 'rounded-md' : 'rounded-t-md'}`}>
            <div className='px-2 py-1'>
                <div className='gap-2 flex items-center'>
                    <span onClick={onClickOverlay} className='text-xs cursor-pointer text-[#000000] hover:text-gray-500'>{baseName}</span>
                    {/* <FileSymlink className={`size-5 stroke-2 stroke-gray-100 group-hover:stroke-gray-200`} /> */}
                </div>
            </div>
            {/* <div className='ml-auto p-1 bg-gray-700 text-white rounded hover:bg-gray-600 cursor-pointer' onClick={(e) => { e.stopPropagation(); setOpened(v => !v); }}>
                {opened ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </div> */}
        </div>

        <div className="rounded-b-md overflow-hidden border-b border-r border-l border-gray-400">
            {editorHTML}
        </div>
    </div>

}

// if (afterFile === beforeFiles[idx]) // if no change, don't display
//     return null
const FileDiffs = ({ beforeFiles, afterFiles, start_open, trimCode, codeEditorName, }: { beforeFiles: fileInfo[], afterFiles: fileInfo[], start_open?: boolean, trimCode?: boolean, codeEditorName: 'vscode' | 'cursor' }) => {

    const diffHTMLs = afterFiles.map((afterFile, idx) => {
        if (afterFile.content === beforeFiles[idx].content)
            return null
        return (
            <FileDiff key={idx}
                start_open={start_open}
                beforeFile={beforeFiles[idx]}
                afterFile={afterFile}
                codeEditorName={codeEditorName}
                trimCode={trimCode}
            />
        )
    })

    return (<>
        {diffHTMLs}
    </>)
}





export { FileDiffs }
