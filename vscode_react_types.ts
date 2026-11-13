
export type historySaveElt = {
    type: 'save',
    afterOfGlobalPath: {
        [globalPath: string]: string, // "after" code of globalPath
    }
}
export type historyGPTElt = {
    type: 'GPT',
    userPrompt: string,
    files: {
        globalPath: string,
        before: string,
        after: string,
    }[],
}
export type historyElt = historySaveElt | historyGPTElt
 

// server in
export type server_onsubmit_in = {
    type: 'submit',
    body: {
        globalPaths: string[],
        instructions: string,
        startLine: number,
        endLine: number,
        startCol: number,
        endCol: number,

        selectionCaller?: {
            globalPath: string,
            startLine: number,
            endLine: number,
            key: string | undefined,
        }
    },
}
export type server_in =
    server_onsubmit_in
    | {
        type: 'get_history'
    } | {
        type: 'clear_history'
    } | {
        type: 'get_editor'
    } | {
        type: 'view_diff',
        historyIdx: number,
        globalPath: string
    } | {
        type: 'history_jump_back',
        toIdx: number,
    } | {
        type: 'history_jump_forward'
        toIdx: number,
    }

// server out
export type server_onsubmit_out = {
    type: 'err_msg',
    message: string
} | {
    type: 'err_unsaved_files',
    files: string[]
} | {
    type: 'GPT_updated_files_success',
    history: historyElt[],
    historyIdx: number,
} | {
    type: 'canceled',
    message: string,
}

export type server_out =
    server_onsubmit_out
    | {
        type: 'new_saved_file',
        newSavedFile: { globalPath: string, after: string }
    } | {
        type: 'save',
        history: historyElt[],
        historyIdx: number,
    } | {
        type: 'full_history',
        history: historyElt[]
        historyIdx: number,
    } | {
        type: 'editor',
        editor: 'vscode' | 'cursor',
    } | {
        type: 'jump_back_success',
        historyIdx: number,
    } | {
        type: 'jump_forward_success',
        historyIdx: number,
    }

