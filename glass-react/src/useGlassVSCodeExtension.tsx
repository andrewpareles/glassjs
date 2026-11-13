import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { historyElt, server_in, server_out } from '../../vscode_react_types';
import { getBasename, openInCodeEditor as openInCodeEditor } from './lib';


const useGlassVSCodeExtension = (
    setToast: (toast: null | { title: string, actionButton?: React.ReactNode }) => void,
    setIsSubmtting: (isSubmitting: boolean) => void,
    setSelectedRef: (target: HTMLElement | null) => void,
) => {
    const [history, setHistory] = useState<historyElt[]>([])
    const [historyIdx, setHistoryIdx] = useState<number>(-1)
    const socketRef = useRef<WebSocket | null>(null) // state, not ref, because of the useEffect that uses it below

    const [codeEditorName, setCodeEditorName] = useState<'vscode' | 'cursor'>('vscode')

    // fetch call fn
    const vscodeFetch = useCallback((params: server_in) => {
        const soc = socketRef.current
        if (soc && soc.readyState === WebSocket.OPEN) {
            if (params.type === 'submit')
                setIsSubmtting(true)
            soc.send(JSON.stringify(params satisfies server_in));
        }
        else if (soc && soc.readyState !== WebSocket.CONNECTING) {
            setToast({ title: '❌ Glass VSCode Extension could not connect. Please refresh to try again.' });
        }
    }, [setToast, setIsSubmtting]);



    // create a new WS connection
    useEffect(() => {
        const s = new WebSocket('ws://localhost:3002');
        socketRef.current = s;
    }, [])

    // update listeners of socketRef.current whenever anything changes (dont disconnect)
    useEffect(() => {
        const s = socketRef.current!
        s.onopen = (event) => {
            // call get_history on socket changes (so that it gets updated when socket is ready)
            vscodeFetch({ type: 'get_history' })
            vscodeFetch({ type: 'get_editor' })
        }

        s.onmessage = (event) => {
            const data: server_out = JSON.parse(event.data);
            // every time we get a message from the server, the submission is done
            if (data.type !== 'full_history')
                setIsSubmtting(false)

            // console.log('GLASS DEBUG:', data.type, data)
            switch (data.type) {
                case 'err_msg':
                    setToast({ title: `❌ ${data.message}. Try \`npm i glass-js@latest\`, or update the Glass VSCode Extension.` })
                    break;

                case 'err_unsaved_files':
                    setToast({
                        title: `✖️ These files must be saved first: `, actionButton: <>
                            {data.files.map((v, i) => <button type='button' key={i}
                                className='text-sm bg-blue-500 text-white py-1 px-2 m-1 rounded'
                                onClick={() => openInCodeEditor(codeEditorName, v, 1, 0)}
                            >{getBasename(v)}</button>)}
                        </>
                    })
                    break;

                case 'GPT_updated_files_success': // this means "succeeded"
                    setHistory(data.history)
                    setHistoryIdx(data.historyIdx)
                    setSelectedRef(null);
                    // setToast({ title: `✅ Successfully made changes.` })
                    setToast(null)
                    break;

                case 'canceled':
                    setToast({ title: `✖️ ${data.message}` })
                    break;

                case 'save':
                    setHistory(data.history)
                    setHistoryIdx(data.historyIdx)
                    break;
                case 'new_saved_file':

                    setHistory(h => {
                        let l = h.length;
                        let last = h[l - 1] ?? { type: 'save' };
                        if (last.type !== 'save')
                            throw 'new_saved_file: historyElt was type GPT, but expected type save';


                        return [
                            ...h.slice(0, l - 1), // the rest of the saves
                            { type: 'save', afterOfGlobalPath: { ...last.afterOfGlobalPath, [data.newSavedFile.globalPath]: data.newSavedFile.after } } // must be of type 'save'
                        ]
                    })
                    break;

                case 'full_history':
                    setHistory(data.history)
                    setHistoryIdx(data.historyIdx)
                    setToast(null)
                    break;

                case 'editor':
                    setCodeEditorName(data.editor)
                    break;

                case 'jump_back_success':
                    setHistoryIdx(data.historyIdx)
                    // setToast({ title: `✅ Undo done!` })
                    setToast(null)
                    break;

                case 'jump_forward_success':
                    setHistoryIdx(data.historyIdx)
                    // setToast({ title: `✅ Redo done!` })
                    setToast(null)
                    break;

                default:
                    console.log(`Unrecognized message type "${(data as { type?: unknown })?.type}".`)
                    break;
            }

        };

        // newSocket.onerror = (error) => {
        //     console.error('WebSocket error:', error);
        //     // setToast({ title: '❌ WebSocket connection error. Make sure the Glass VSCode Extension is enabled.' });
        // };


        // return () => { s.close(); };
    }, [setIsSubmtting, setSelectedRef, setToast, vscodeFetch, setHistory, codeEditorName]);

    // console.log('history', history, historyIdx);

    const ret = useMemo(() => ({ history, historyIdx, codeEditorName, vscodeFetch }), [history, historyIdx, codeEditorName, vscodeFetch]);
    return ret;
}

export default useGlassVSCodeExtension;