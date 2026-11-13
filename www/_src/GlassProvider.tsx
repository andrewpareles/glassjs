'use client'

// the files in click-to-react-component/ are relevant - https://github.com/ericclemmons/click-to-component/blob/main/packages/click-to-react-component/src/ClickToComponent.js
// see ClickToElt for Glass v1 of this file 


import React, { useState, useCallback, useEffect, useRef, useMemo, createContext, useContext, FormEvent, forwardRef, Fragment, MutableRefObject } from 'react'
import { createPortal } from 'react-dom';
import { FileSymlink, ArrowUp, MousePointerClickIcon, RotateCcw, RotateCw, Undo, Redo, Undo2, Redo2, Undo2Icon, Minus, Plus, Sidebar, Check, Dot, File, FileCodeIcon, FileCode, Code, Code2, Link2, ExternalLink, Pencil, Code2Icon, X } from 'lucide-react'
import { PHProvider } from './PHProvider';
import FullscreenCanvas from './FullscreenCanvas';
import useGlassVSCodeExtension from './useGlassVSCodeExtension';

import { PiRectangleDashed } from 'react-icons/pi'
import { LiaHandPointer } from 'react-icons/lia'

import { getBasename, openInCodeEditor, removeDupesAndKeepOrder, useInstantState } from './lib';
import { FileDiffs } from './FileDiffs';

import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { historyGPTElt, historyElt, server_in, historySaveElt, server_onsubmit_in } from '../../vscode_react_types';
import GlassSettingsProvider, { useGlassSettings } from './GlassSettingsProvider';




/* 
TODOs

- don't just give it js/jsx/ts/tsx files, give it all relevant files that start with "." or "@/" (all imports of the current file? no - all imports used inside the code, complicated to do that... import can be manipulated and indirectly used in the component)

*/






const Tooltip = ({
    children,
    content,
    showDelay = 500,
    hideDelay = 0
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = useCallback(() => {
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
        const newTimeoutId = setTimeout(() => setIsVisible(true), showDelay)
        timeoutIdRef.current = newTimeoutId
    }, [showDelay]);

    const handleMouseLeave = useCallback(() => {
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
        const newTimeoutId = setTimeout(() => setIsVisible(false), hideDelay)
        timeoutIdRef.current = newTimeoutId
    }, [hideDelay]);

    useEffect(() => {
        return () => { if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current) };
    }, []);

    return (
        <div className="relative">
            <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
                {children}
            </div>

            {isVisible && (
                <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 transform">
                    {/* Arrow */}
                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 transform rotate-45 bg-gray-100" />

                    {/* Tooltip content */}
                    <div className="relative rounded max-w-[900px] min-w-[170px] bg-gray-100 px-4 py-2 text-gray-800 shadow-lg text-xs whitespace-normal text-center">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
};




const drawMarginPadding = (ctx: CanvasRenderingContext2D, element: HTMLElement, opacity: number) => {
    const style = window.getComputedStyle(element)
    const rect = element.getBoundingClientRect();

    // draw padding
    const hole = {
        top: rect.top + parseInt(style.paddingTop),
        left: rect.left + parseInt(style.paddingLeft),
        right: rect.right - parseInt(style.paddingRight),
        bottom: rect.bottom - parseInt(style.paddingBottom),
    }
    ctx.beginPath()
    ctx.rect(rect.left, rect.top, rect.width, rect.height); // outer rectangle (clockwise)
    ctx.moveTo(hole.left, hole.top); // inner rectangle hole (counter-clockwise)
    ctx.lineTo(hole.left, hole.bottom);
    ctx.lineTo(hole.right, hole.bottom);
    ctx.lineTo(hole.right, hole.top);
    ctx.closePath();
    ctx.fillStyle = `rgba(0, 200, 0, ${.2 + opacity})`;
    ctx.fill('evenodd');



    // draw content (within padding)
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    gradient.addColorStop(0, `rgba(200, 230, 255, ${.5 + opacity})`);
    gradient.addColorStop(1, `rgba(230, 240, 255, ${.5 + opacity})`);
    ctx.fillStyle = gradient
    ctx.fillRect(hole.left, hole.top, hole.right - hole.left, hole.bottom - hole.top)


    // draw margin
    const marginBox = {
        top: rect.top - parseInt(style.marginTop),
        left: rect.left - parseInt(style.marginLeft),
        right: rect.right + parseInt(style.marginRight),
        bottom: rect.bottom + parseInt(style.marginBottom),
    }
    ctx.beginPath()
    ctx.rect(marginBox.left, marginBox.top, marginBox.right - marginBox.left, marginBox.bottom - marginBox.top); // outer rectangle (clockwise)
    ctx.moveTo(rect.left, rect.top); // inner rectangle as "hole" (counter-clockwise)
    ctx.lineTo(rect.left, rect.bottom);
    ctx.lineTo(rect.right, rect.bottom);
    ctx.lineTo(rect.right, rect.top);
    ctx.closePath();
    ctx.fillStyle = 'rgba(252 186 56 / 0.2)';
    ctx.fill('evenodd');

}




// keep going up till get elt with data-glass_in_component
const get_component_name_of = (elt: HTMLElement | null) => {
    // return elt?.['data-glass_in_component'] ?? null  // <-- this is bad
    while (elt && !elt['data-glass_in_component'])
        elt = elt.parentElement

    return elt === null ? null : [elt['data-glass_in_component'], elt['data-glass_info']?.file_name] as const
}


// get the HTML name like "div"
const get_HTML_name_of = (elt: HTMLElement | null) => {

    if (elt === null) return null

    const name = elt === null ? null : elt.tagName

    return name
}

let roundToScreenCoords = (o_top: number, o: number, o_bottom: number, rect: { top: number, bottom: number }) => {
    let rect_top: number;
    if (rect.top + o_top > o)
        rect_top = rect.top + o_top;
    else if (rect.bottom + o_bottom > o)
        rect_top = o
    else
        rect_top = rect.bottom + o_bottom
    return rect_top
}


const get_highest_elt_with_same_area_in_same_cpt = (element: HTMLElement | null) => {
    if (!element) return null;

    let elt_rect = element.getBoundingClientRect()
    let area = elt_rect.width * elt_rect.height

    let parent = element.parentElement;

    while (parent) {
        let parent_rect = parent.getBoundingClientRect();
        let parent_area = parent_rect.width * parent_rect.height;

        // if the areas are not equal or the components are not equal, break
        if (Math.abs(area - parent_area) > 1 || parent['data-glass_in_component'] !== element['data-glass_in_component']) {  // allow for small rounding differences
            break;
        }

        element = parent;
        parent = element.parentElement;
    }

    return element;

};


const grayColor = 'rgb(160, 160, 160)'

const drawText = (ctx: CanvasRenderingContext2D, rect: DOMRect, options: { text: string | null | undefined, font?: string, color?: string, textColor?: string, keepOnScreen?: boolean }) => {
    const { text, color = grayColor, textColor = 'white', font = '12px sans-serif' } = options

    if (!text) return;

    // draw colored bg
    let text_top = roundToScreenCoords(-4, 16, -8, rect)

    // let text_top = rect.top - 4
    // text_top = text_top >= -20 ? Math.max(14, text_top) : text_top

    ctx.font = font; // needs to come before measureText
    const textWidth = ctx.measureText(text).width;
    const textHeight = ctx.measureText(text).actualBoundingBoxAscent + ctx.measureText(text).actualBoundingBoxDescent;
    const padding = 4; // adjust the padding value as needed

    ctx.fillStyle = color;
    ctx.fillRect(rect.left - padding, text_top - textHeight - padding, textWidth + 2 * padding, textHeight + 3 * padding);

    // draw text
    ctx.fillStyle = textColor;
    ctx.fillText(text, rect.left, text_top) // apply a correction if text_top is only *slightly* out of bounds (within 20px)

}


type outlineOptions = {
    name?: string | null,
    file?: string | null,
    lineDash?: number[],
    color?: string,
    lineWidth?: number,
    showMarginPadding?: boolean,
}
// name, margin + padding
const drawHTMLBorder = (elt: HTMLElement | null, ctx: CanvasRenderingContext2D, options: outlineOptions) => {

    const { lineDash = [0], lineWidth = 1, color = 'black', showMarginPadding = false } = options

    if (!elt) return

    const rect = elt.getBoundingClientRect()

    if (!rect) return

    // draw outline
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash(lineDash);
    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

    // draw name
    // drawText(ctx, rect, { text: name })

    // draw margin/padding
    if (showMarginPadding) {
        drawMarginPadding(ctx, elt, 0)
    }

}


// whether elt is in same component as component=name and component_file_name=file
let is_in_same_component = (elt: Element | null | undefined, cpt_name: string | null | undefined, cpt_file: string | null | undefined) => {
    if (!elt) return false;
    let curr_cpt_name = elt['data-glass_in_component']
    let curr_cpt_file = elt['data-glass_info']?.file_name
    return curr_cpt_name === cpt_name && curr_cpt_file === cpt_file
}



// name = cpt_name
let is_outer_elt_of_component = (elt: Element | null | undefined, cpt_name: string | null | undefined, cpt_file: string | null | undefined) => {
    let curr = elt?.parentElement
    while (curr !== undefined) {
        if (is_in_same_component(curr, cpt_name, cpt_file))
            return false
        curr = curr?.parentElement
    }
    return true
}




const glassInfosEqual = (i1: glassCallerInfoType | undefined | null, i2: glassCallerInfoType | undefined | null) => {
    return i1 && i1.file_name === i2?.file_name
        && i1.start_line === i2?.start_line
        && i1.end_line === i2?.end_line
        && i1.start_col === i2.start_col
        && i1.end_col === i2.end_col
}

const drawRelevantComponentBorders = (ctx: CanvasRenderingContext2D, options: outlineOptions, more: { editMode: 'this' | 'all' | null, selectionHTML: Element | null }, allElts: Element[]) => {

    const { name, file, lineDash = [0], lineWidth = 1, color = 'black', } = options
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    ctx.setLineDash(lineDash)

    let all_elts_in_component: Element[] = [];

    // if 'all', draw all elements in same component
    if (more.editMode === 'all') {
        // get all this highest up data-glass_in_component=${name}s by only selecting components that have no parent (or ancestor) in the same component
        all_elts_in_component = allElts.filter(elt =>
            is_in_same_component(elt, name, file) && is_outer_elt_of_component(elt, name, file)
        );
    }
    // if 'this' only, draw all component boxes of the parent component
    else if (more.editMode === 'this') {
        let name2 = more.selectionHTML?.['data-__glass_caller_in_component__'];
        let file2 = more.selectionHTML?.['data-__glass_caller_info__']?.file_name

        // let { name: name2, file: file2 } = get_parent_component_name_of(more.selectionHTML, name, file);
        all_elts_in_component = allElts.filter(elt =>
            (is_in_same_component(elt, name2, file2) && is_outer_elt_of_component(elt, name2, file2)) // highlight all instances of the parent component
            ||
            (is_in_same_component(elt, name, file) && is_outer_elt_of_component(elt, name, file) // highlight the current component that we're currently selecting
                && glassInfosEqual(elt['data-__glass_caller_info__'], more.selectionHTML?.['data-__glass_caller_info__'])
                && elt['data-__glass_caller_key__'] === more.selectionHTML?.['data-__glass_caller_key__']

            )
        );
    }


    for (let e of all_elts_in_component) {
        // draw box around elt
        const rect = e.getBoundingClientRect()
        ctx.strokeRect(rect.left - 1, rect.top, rect.width + 2, rect.height)
        // draw text
        const text = e['data-glass_in_component']
        drawText(ctx, rect, { text: text })

    }

}








const Loader = ({ ...props }) => <div role="status" {...props}><svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin fill-blue-700" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" /><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" /></svg><span className="sr-only">Loading...</span></div>
// const Loader = ({ ...props }) => <div role="status" {...props}><svg aria-hidden="true" className="w-8 h-8 fill-black text-gray-100  animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" /><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" /></svg><span className="sr-only">Loading...</span></div>









// LiaUndoSolid
// const undoIcon = <svg className='w-6 h-6 fill-gray-800 absolute top-0 right-0' stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M 12.78125 5.28125 L 4.78125 13.28125 L 4.09375 14 L 4.78125 14.71875 L 12.78125 22.71875 L 14.21875 21.28125 L 7.9375 15 L 21 15 C 23.753906 15 26 17.246094 26 20 L 26 27 L 28 27 L 28 20 C 28 16.15625 24.84375 13 21 13 L 7.9375 13 L 14.21875 6.71875 Z"></path></svg>
// const redoIcon = <svg className='size-6 fill-gray-800' stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 32 32" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M 19.21875 5.28125 L 17.78125 6.71875 L 24.0625 13 L 11 13 C 7.15625 13 4 16.15625 4 20 L 4 27 L 6 27 L 6 20 C 6 17.246094 8.246094 15 11 15 L 24.0625 15 L 17.78125 21.28125 L 19.21875 22.71875 L 27.21875 14.71875 L 27.90625 14 L 27.21875 13.28125 Z"></path></svg>

// const undoRedo = (thisIdx: number, historyIdx: number, vscodeFetch: (params: server_in) => void) => {
//     const this_is_ahead = thisIdx > historyIdx;
//     const this_is_behind = thisIdx < historyIdx;

//     return <div className='text-gray-600 hover:text-gray-800 hover:cursor-pointer'
//         onClick={() =>
//             this_is_ahead ? vscodeFetch({ type: 'history_jump_forward', toIdx: thisIdx })
//                 : this_is_behind ? vscodeFetch({ type: 'history_jump_back', toIdx: thisIdx })
//                     : {}}
//     >
//         {this_is_ahead && redoIcon}
//         {this_is_behind && undoIcon}
//     </div>
// }






type glassCallerInfoType = { start_line: number, end_line: number, start_col: number, end_col: number, file_name: string };
// extend Element to have these props
interface GlassElement {
    'data-glass_info': glassCallerInfoType | undefined, // info about where to find it in sourcecode
    'data-glass_in_component': string | undefined, // component this is in

    'data-__glass_caller_info__': glassCallerInfoType | undefined, // info about the place it was used in the source code
    'data-__glass_caller_key__': string | undefined, // the key of the instance where it was used if any
    'data-__glass_caller_in_component__': string | undefined, // component caller is in
}

// just used to iterate thru the keys
const glassElementObj: GlassElement = {
    'data-glass_info': undefined,
    'data-glass_in_component': undefined,

    'data-__glass_caller_info__': undefined,
    'data-__glass_caller_key__': undefined,
    'data-__glass_caller_in_component__': undefined,
}

declare global {
    interface Element extends GlassElement { }
}



const useAddGlassAttribsToHTML = (debug: boolean) => {
    // converts element's attributes data-glass-X to element[data-glass-X]
    useEffect(() => {

        const onChange = () => {

            for (let glass_attrib of Object.keys(glassElementObj) as (keyof typeof glassElementObj)[]) {
                for (let elt of document.querySelectorAll(`[${glass_attrib}]`)) {
                    if (glass_attrib === 'data-glass_info' || glass_attrib === 'data-__glass_caller_info__')
                        elt[glass_attrib] = JSON.parse(elt.getAttribute(glass_attrib) ?? '""') || undefined
                    else if (glass_attrib === 'data-glass_in_component' || glass_attrib === 'data-__glass_caller_key__' || glass_attrib === 'data-__glass_caller_in_component__')
                        elt[glass_attrib] = elt.getAttribute(glass_attrib) || undefined
                    else
                        console.error(`useGlassAttribs: ${glass_attrib} not implemented!`)

                    if (!debug)
                        elt.removeAttribute(glass_attrib)
                }
            }
        }

        const observer = new MutationObserver(() => onChange());

        observer.observe(document.body, { attributes: true, childList: true, subtree: true });

        return () => {
            observer.disconnect();
        };
    })
}


const GlassSideBar = ({ childrenWrapperRef, debug }: { childrenWrapperRef: MutableRefObject<HTMLDivElement | null>, debug: boolean }) => {
    useAddGlassAttribsToHTML(debug)

    const [selectedRef, setSelectedRef] = useInstantState<HTMLElement | null>(null)
    const selectedHTML = selectedRef.current
    const [hoveredRef, setHoveredRef] = useInstantState<HTMLElement | null>(null)


    const [isPointerActiveRef, setIsPointerActive] = useInstantState(false);
    const isPointerActive = isPointerActiveRef.current

    const [isSubmittingRef, setIsSubmitting] = useInstantState(false);
    const [promptTextRef, setPromptText] = useState<HTMLTextAreaElement | null>(null)

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [_isOutlineAllRef, _setIsOutlineAll] = useInstantState<boolean>(false)


    const [toast, setToast] = useState<{ title: string, actionButton?: React.ReactNode } | null>(null)
    const { history, historyIdx, vscodeFetch, codeEditorName } = useGlassVSCodeExtension(setToast, setIsSubmitting, setSelectedRef)
    const [editModeRef, setEditMode] = useInstantState<'all' | 'this'>('all')
    const [modalOpen, setModalOpen] = useState(false);


    // used to keep user scrolled to bottom
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const scrollPositionRef = useRef(0);
    const scrollHeightRef = useRef(0);

    const {
        alwaysScrollDown,
        setAlwaysScrollDown,

        isSidebarMinimized,
        setIsSidebarMinimized,

        isGlassEnabled,
        setIsGlassEnabled,

    } = useGlassSettings()



    // scroll to bottom if scroll locked
    useEffect(() => {
        if (alwaysScrollDown && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    });
    // set scrollLock and other variables on scroll
    const onScroll = (e) => {
        if (!e.target) return;
        const target = e.target as any


        const currTop = target.scrollTop;
        const prevTop = scrollPositionRef.current;

        const currHeight = target.scrollHeight;
        const prevHeight = scrollHeightRef.current || currHeight;

        if (Math.abs(currHeight - prevHeight) < 1) { // only change if user is scrolling (and not if resizing the chat bar triggers a scroll event)

            // Scrolling down
            if (currTop > prevTop) {

                const bottom = target.clientHeight
                const current = target.scrollHeight - currTop

                setAlwaysScrollDown(current <= bottom + 1) // 1 px buffer

            } else if (currTop < prevTop) {
                // Scrolling up
                setAlwaysScrollDown(false)

            }
        }

        scrollPositionRef.current = currTop;
        scrollHeightRef.current = currHeight;
    }

    // hover elt
    const currentMouseRef = useRef<{ clientX: number, clientY: number }>({ clientX: -1, clientY: -1 })
    const onMouseMove = useCallback(({ clientX, clientY }: { clientX: number, clientY: number }, calledManually?: boolean) => {
        currentMouseRef.current = { clientX: clientX, clientY: clientY }
        if (isPointerActiveRef.current || calledManually) {
            const elts_under_mouse = document.elementsFromPoint(clientX, clientY).filter(e => !!e['data-glass_in_component'])
            setHoveredRef((elts_under_mouse[0] as HTMLElement) ?? null);
        }
    }, [isPointerActiveRef, setHoveredRef])


    // ctrl or alt key detection
    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.repeat) return // if they're holding the key then it fires a lot, and repeat=true
        if (event.ctrlKey || event.metaKey) {
            setIsPointerActive(true)
            onMouseMove(currentMouseRef.current, true) // call mouseMove
        }
        if (event.key === 'Escape') {
            setSelectedRef(null)
        }
    }, [onMouseMove, setIsPointerActive, setSelectedRef])

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (!event.ctrlKey && !event.metaKey) {
            setIsPointerActive(false)
            setHoveredRef(null)
        }
    }, [setHoveredRef, setIsPointerActive])


    const onMouseDown = useCallback((event: Event) => {
        if (isPointerActiveRef.current) {
            if (canvasRef.current) canvasRef.current.style.pointerEvents = 'all' // this is a hack to make the user click not register; the user clicks on the canvas

            setSelectedRef(get_highest_elt_with_same_area_in_same_cpt(hoveredRef.current));
            setHoveredRef(null)
            // setIsPointerActive(false)
        }
    }, [hoveredRef, isPointerActiveRef, setHoveredRef, setSelectedRef])

    const onMouseUp = useCallback(() => {
        if (canvasRef.current) canvasRef.current.style.pointerEvents = 'none'
    }, [])

    const onVisibilityChange = useCallback(() => {
        setIsPointerActive(false)
    }, [setIsPointerActive])


    useEffect(() => {
        if (!isGlassEnabled)
            return;

        document.addEventListener('visibilitychange', onVisibilityChange)
        window.addEventListener('mouseup', onMouseUp, { capture: true })
        window.addEventListener('mousedown', onMouseDown, { capture: true })
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('keydown', onKeyDown)
        window.addEventListener('keyup', onKeyUp)

        return function removeEventListenersFromWindow() {
            document.removeEventListener('visibilitychange', onVisibilityChange)
            window.removeEventListener('mouseup', onMouseUp, { capture: true })
            window.removeEventListener('mousedown', onMouseDown, { capture: true })
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('keydown', onKeyDown)
            window.removeEventListener('keyup', onKeyUp)
        }

    }, [isGlassEnabled, isSidebarMinimized, onKeyDown, onKeyUp, onMouseDown, onMouseMove, onMouseUp, onVisibilityChange])

    useEffect(() => {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            if (isPointerActive) {
                iframe.style.pointerEvents = 'none';
            } else {
                iframe.style.pointerEvents = '';
            }
        });
    }, [isPointerActive]);


    // selectionHTML's data-glass-info object un-stringified
    const [info, caller_info, caller_key, caller_cpt] = useMemo(() => {
        if (!selectedHTML)
            return [null, null]

        let info = selectedHTML['data-glass_info'];
        if (!info) { console.error(`Glass object was null. Make sure you've installed Glass-swc properly - it's easy, see https://useglass.ai.`, selectedHTML); return [null, null] }

        let caller_info = selectedHTML['data-__glass_caller_info__']
        let caller_key = selectedHTML['data-__glass_caller_key__']

        let caller_cpt = selectedHTML['data-__glass_caller_in_component__']
        const res = [info, caller_info, caller_key, caller_cpt] as const
        return res

    }, [selectedHTML])


    const floatingSelectionMenuRef = useRef<HTMLDivElement | null>(null)
    const floatingToggleModeRef = useRef<HTMLDivElement | null>(null)

    const allEltsRef = useRef<Element[]>([])

    useEffect(() => {

        const ping = () => { allEltsRef.current = [...document.body.querySelectorAll("*")] }
        const iid = setInterval(ping, 500);

        return () => clearInterval(iid)

    }, [])

    const drawFn = useCallback((ctx: CanvasRenderingContext2D) => {


        // find names of items
        let hovered_HTML_name = get_HTML_name_of(hoveredRef.current)
        let selected_HTML_name = get_HTML_name_of(selectedRef.current)

        let [hovered_cpt_name, hovered_cpt_file] = get_component_name_of(hoveredRef.current) ?? []
        let [selected_cpt_name, selected_cpt_file] = get_component_name_of(selectedRef.current) ?? []

        ctx.font = '14px sans-serif';

        // ----- draw hovered HTML
        drawHTMLBorder(hoveredRef.current, ctx, {
            lineWidth: .5,
            color: grayColor, // this actually shows a border even if hovering, it's just light gray
            lineDash: [0],
            showMarginPadding: true,
        })

        // ----- draw selected HTML (the box around the div, not the component)
        if (selectedRef.current !== hoveredRef.current) { // don't draw selected outline if it is being hovered
            drawHTMLBorder(selectedRef.current, ctx, {
                lineWidth: 1,
                color: 'black',
                lineDash: [0],
                showMarginPadding: true,
            })
        }


        const otherHLcolor = 'black'//'rgba(118 118 244 / 0.5)'
        ctx.strokeStyle = otherHLcolor;
        ctx.lineWidth = 1;

        const allElts = allEltsRef.current

        // ----- 'all' - draw all selected divs / draw selected HTML on all the divs that are selected because this one is
        if (editModeRef.current === 'all') {
            // Draw a border around all HTML elements with same glass info 
            allElts.forEach((element: Element) => {
                if (element === selectedHTML) return;
                const elementInfo = element['data-glass_info'];
                if (glassInfosEqual(elementInfo, info)) {
                    const rect = element.getBoundingClientRect();
                    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                }
            });
        }
        else if (editModeRef.current === 'this') {
            // 'this' - draw the selected component and its parent / Draw a border around the HTML elements with the same info, caller info, and caller key
            allElts.forEach((element: Element) => {
                if (element === selectedHTML) return;
                const elementInfo = element['data-glass_info'];
                const elementCallerInfo = element['data-__glass_caller_info__'];
                const elementCallerKey = element['data-__glass_caller_key__'];
                if (
                    glassInfosEqual(elementInfo, info)
                    && glassInfosEqual(elementCallerInfo, caller_info)
                    && elementCallerKey === selectedHTML?.['data-__glass_caller_key__']
                ) {
                    const rect = element.getBoundingClientRect();
                    ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
                }
            });
        }



        // ----- draw selected components
        if (selectedRef.current && selected_cpt_name)
            drawRelevantComponentBorders(ctx, {
                name: selected_cpt_name,
                file: selected_cpt_file,
                lineWidth: 1,
                color: grayColor,
                lineDash: [2, 2],
            }, {
                editMode: editModeRef.current,
                selectionHTML: selectedRef.current
            },
                allElts
            )


        // ----- draw the component names and borders around all the relevant components we're hovering
        if (hoveredRef.current && hovered_cpt_name)
            drawRelevantComponentBorders(ctx, {
                name: hovered_cpt_name,
                file: hovered_cpt_file,
                lineWidth: 1,
                color: grayColor,
                lineDash: [2, 2],
            }, {
                editMode: 'all',
                selectionHTML: null
            },
                allElts
            )



        // ----- position the floating items properly
        if (floatingSelectionMenuRef.current && floatingToggleModeRef.current) {
            let sel_rect = selectedRef.current?.getBoundingClientRect()

            const innerWidth = childrenWrapperRef.current?.getBoundingClientRect().width ?? window.innerWidth

            let yoffset = 16
            let gap1 = -4
            let gap2 = -10
            // toggle edit mode
            if (sel_rect) {
                let rect_top = roundToScreenCoords(-20 + yoffset, 4 + yoffset + gap2, -40 + yoffset + gap2, sel_rect)
                const topPosition = rect_top;
                const leftPosition = Math.max(0, sel_rect.left);

                let width = floatingToggleModeRef.current.getBoundingClientRect().width + 5
                const rightPosition = Math.min(innerWidth - width, sel_rect.right + 4);

                floatingToggleModeRef.current.style.transform = `translate(${rightPosition}px, ${topPosition}px)`;
                floatingToggleModeRef.current.style.display = 'block'
            }
            else {
                floatingToggleModeRef.current.style.display = 'none'
            }

            // jump to code
            if (sel_rect) {
                let rect_top = roundToScreenCoords(6 + yoffset + gap1, 30 + yoffset + gap1 + gap2, -14 + yoffset + gap1 + gap2, sel_rect)
                const topPosition = rect_top;
                const leftPosition = Math.max(0, sel_rect.left);

                let width = floatingSelectionMenuRef.current.getBoundingClientRect().width + 5
                const rightPosition = Math.min(innerWidth - width, sel_rect.right + 4);

                floatingSelectionMenuRef.current.style.transform = `translate(${rightPosition}px, ${topPosition}px)`;
                floatingSelectionMenuRef.current.style.display = 'block'
            }
            else {
                floatingSelectionMenuRef.current.style.display = 'none'
            }

        }

        ctx.setLineDash([]); // Reset line style

    }, [hoveredRef, selectedRef, editModeRef, selectedHTML, info, caller_info, childrenWrapperRef])




    // when the selection changes, if toggle is disabled change mode back to 'all'
    const editToggleDisabled = !caller_info || !caller_cpt
    useEffect(() => {
        if (!selectedHTML)
            return;

        if (editToggleDisabled)
            setEditMode('all')
        // else
        //     setEditMode('this')
    }, [selectedHTML, editToggleDisabled, setEditMode])



    // jump to code button
    const jumpToCodeButton = (info || caller_info) && <button type='button' className={`block appearance-none border-none bg-transparent px-0 pointer-events-none`}
        onClick={() => {
            let is_outer = is_outer_elt_of_component(selectedRef.current, selectedRef.current?.['data-glass_in_component'], selectedRef.current?.['data-glass_info']?.file_name)
            let is_this_mode = editModeRef.current === 'this'
            if (caller_info && (is_outer || is_this_mode)) // this could be either or 
                openInCodeEditor(codeEditorName, caller_info.file_name, caller_info.start_line, caller_info.start_col)
            else if (info)
                openInCodeEditor(codeEditorName, info.file_name, info.start_line, info.start_col)
        }}>
        <div className='flex items-center cursor-pointer pointer-events-auto 
            text-center text-[12px] 
            border border-gray-300 bg-white
            text-black hover:text-gray-700 group-disabled:text-gray-300
            stroke-black hover:stroke-gray-700 group-disabled:stroke-gray-300  
            rounded-full px-2 gap-1'
        >
            <ExternalLink className={`size-4 stroke-[1.7]`} />
            {`View`}
        </div>
    </button>


    let optionalS = (name) => `${name?.substring(name.length - 1) === 's' ? '' : 's'}`


    let selected_cpt_name = selectedHTML?.['data-glass_in_component']
    const editModeToggleButton = info && <button disabled={editToggleDisabled} type='button' className={`group block appearance-none border-none px-0 pointer-events-none`}
        onClick={() => { setEditMode(editModeRef.current === 'this' ? 'all' : 'this') }}>
        <span className='block cursor-pointer pointer-events-auto 
        text-center text-[12px] 
        border border-gray-300 bg-white
        text-black hover:text-gray-700
        stroke-black hover:stroke-gray-700
        group-disabled:text-black group-disabled:stroke-black group-disabled:cursor-not-allowed
        rounded-full px-2
        '>
            {editModeRef.current === 'all' ?
                <span>
                    {'Editing all '}
                    <span className='underline'>{selected_cpt_name}</span>{optionalS(selected_cpt_name)}
                </span>
                : <span>
                    {`Editing this `}
                    <span className='underline'>{selected_cpt_name}</span>
                    {` instance in `}
                    <span className='underline'>{caller_cpt}</span>
                </span>
            }
        </span>
    </button>


    // disable when there's no target, or when already submitting
    const submitDisabled = !selectedRef.current || !info || !!isSubmittingRef.current
    const submitButton = <button type='submit' className=' flex justify-center items-center appearance-none border-none bg-transparent rounded-full overflow-hidden px-0 pointer-events-none'>
        {isSubmittingRef.current ?
            <Loader variant='oval' className={`cursor-default pointer-events-auto`} color={'gray'} />
            : <ArrowUp className={`stroke-white rounded-full size-10 p-2 pointer-events-auto ${submitDisabled ? 'bg-gray-500 cursor-default' : 'bg-black cursor-pointer'}`} />
        }
    </button>



    const UndoRedoButton = ({ action, className, children }: { action: 'undo' | 'redo', className: string, children: React.ReactNode }) => {
        return <button type='button'
            className={`${className} w-5 h-5 flex-shrink-0 flex-grow-0 flex items-center justify-center text-black rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black`}
            onClick={async () => {
                setIsSubmitting(true);
                vscodeFetch({ type: action === 'undo' ? 'history_jump_back' : 'history_jump_forward', toIdx: action === 'undo' ? historyIdx - 1 : historyIdx + 1 })
            }}>{children}</button>
    }

    let undoIsDisabled = isSubmittingRef.current || !(0 <= historyIdx)
    const undoButton = <UndoRedoButton action={'undo'} className={`group ${undoIsDisabled ? 'cursor-default pointer-events-none' : ''}`}>
        <Undo2 className={`w-5 h-5 group-hover:text-gray-700 ${undoIsDisabled ? 'text-gray-500' : 'text-black'}`} />
    </UndoRedoButton>

    let redoIsDisabled = isSubmittingRef.current || !(historyIdx < history.length - 1)
    const redoButton = <UndoRedoButton action={'redo'} className={`group ${redoIsDisabled ? 'cursor-default pointer-events-none' : ''}`}>
        <Redo2 className={`w-5 h-5 group-hover:text-gray-700 ${redoIsDisabled ? 'text-gray-500' : 'text-black'}`} />
    </UndoRedoButton>



    // TODO! make this only run on page refresh (complicated due to differences in Pages vs App router)
    // useEffect(() => {
    //     vscodeFetch({ type: 'refresh', msgOnSuccess: undefined, })
    // }, [vscodeFetch])


    // onsubmit function
    const onSubmitPrompt = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (isSubmittingRef.current) return // dont submit concurrently
        if (!selectedHTML || !info) return // we need both these to not be null here

        const { start_line, start_col, end_line, end_col, file_name } = info

        let caller_info_ = editModeRef.current === 'all' ? null : caller_info; // if 'all', act like there is no caller info (aka edit the raw definition code)

        // get all the relevant files, starting with the current selection (if 'this'), then the selected HTML, then the rest of the files
        const relevant_files: string[] = removeDupesAndKeepOrder([file_name,
            ...(caller_info_ ? [caller_info_.file_name] : []),
            ...[...selectedHTML.querySelectorAll('*')].map(el => el['data-glass_info']?.file_name).filter(filename => !!filename) as string[]]
        )

        const body: server_onsubmit_in['body'] = {
            globalPaths: relevant_files, instructions: promptTextRef?.value ?? '', startLine: start_line, endLine: end_line, startCol: start_col, endCol: end_col,
            selectionCaller: !caller_info_ ? undefined : { startLine: caller_info_.start_line, endLine: caller_info_.end_line, globalPath: caller_info_.file_name, key: caller_key }
        }

        // console.log('sent!', body, relevant_files)

        vscodeFetch({ type: 'submit', body: body, })

    }, [caller_info, caller_key, editModeRef, info, isSubmittingRef, promptTextRef?.value, selectedHTML, vscodeFetch])


    const toastNotif = toast && <div className='mb-2 p-2 mx-auto group relative max-w-[700px] pointer-events-auto bg-white rounded-lg shadow-md border border-solid border-gray-300'>
        <button className='absolute top-2 right-2 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-700' onClick={() => { setToast(null) }}>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12'></path></svg>
        </button>
        <div className='flex justify-between items-center'>
            <span className='font-medium'>{toast.title}</span>
            {toast.actionButton ?? null}
        </div>
    </div>



    // textarea
    const textarea = <textarea ref={setPromptText}
        className="shadow appearance-none border-none rounded-[5px] w-full py-3 px-5 text-[15px] bg-white leading-tight focus:outline-none focus:shadow-outline resize-none overflow-y-auto transition-height duration-200 max-h-[50vh]"
        placeholder={selectedRef.current ? 'Enter your changes (try "make this look better")' : 'Select something! (Cmd + Click)'}
        rows={1}
        onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} // Adjust height dynamically
    />



    // let latestHistoryElt = history[history.length - 1]
    // const latestGPTEdit = latestHistoryElt?.type === 'GPT' && latestHistoryElt;
    const latestGPTEdit = history.slice(0, historyIdx + 1).findLast(v => v.type === 'GPT')

    const GPTChange = useMemo(() => {
        const GPTChange = ({ e, thisIdx, historyIdx, codeEditorName }: { e: historyGPTElt, thisIdx: number, historyIdx: number, codeEditorName: 'vscode' | 'cursor', }) => {


            const [isEditMode, setIsEditMode] = useState(false)
            const [promptText, setPromptText] = useState('')


            const promptHTML = <div className="w-full flex group">

                <div className={`relative w-full bg-gray-200 pb-2 px-2 rounded-md flex flex-row items-start text-sm ${historyIdx < thisIdx ? 'opacity-30' : ''}`}>
                    {/* Glass Icon */}
                    <div className='flex-shrink-0 pr-2'>
                        <div className='flex h-full'>
                            <svg className='size-5 rounded-md' id="euVAoNPzqM21" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" shapeRendering="geometricPrecision" textRendering="geometricPrecision"><defs><linearGradient id="euVAoNPzqM27-stroke" x1="0" y1="0.5" x2="1" y2="0.5" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)"><stop id="euVAoNPzqM27-stroke-0" offset="0%" stopColor="#4fa8c6" /><stop id="euVAoNPzqM27-stroke-1" offset="100%" stopColor="#227b9e" /></linearGradient><linearGradient id="euVAoNPzqM211-fill" x1="0.090424" y1="0.786788" x2="0.909576" y2="0.213212" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)"><stop id="euVAoNPzqM211-fill-0" offset="0%" stopColor="rgba(76,110,245,0.67)" /><stop id="euVAoNPzqM211-fill-1" offset="100%" stopColor="#30dcf4" /></linearGradient><linearGradient id="euVAoNPzqM211-stroke" x1="0.853553" y1="0.146447" x2="0.146447" y2="0.853553" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)"><stop id="euVAoNPzqM211-stroke-0" offset="0%" stopColor="#6176c9" /><stop id="euVAoNPzqM211-stroke-1" offset="100%" stopColor="#15aabf" /></linearGradient><linearGradient id="euVAoNPzqM213-stroke" x1="0.853553" y1="0.146447" x2="0.146447" y2="0.853553" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)"><stop id="euVAoNPzqM213-stroke-0" offset="0%" stopColor="#6176c9" /><stop id="euVAoNPzqM213-stroke-1" offset="100%" stopColor="#15aabf" /></linearGradient><linearGradient id="euVAoNPzqM214-fill" x1="-0.441963" y1="1.312391" x2="0.909576" y2="0.213212" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)"><stop id="euVAoNPzqM214-fill-0" offset="0%" stopColor="rgba(76,110,245,0.82)" /><stop id="euVAoNPzqM214-fill-1" offset="100%" stopColor="#30dcf4" /></linearGradient><linearGradient id="euVAoNPzqM214-stroke" x1="0.853553" y1="0.146447" x2="-0.116574" y2="1.105375" spreadMethod="pad" gradientUnits="objectBoundingBox" gradientTransform="translate(0 0)"><stop id="euVAoNPzqM214-stroke-0" offset="0%" stopColor="#6176c9" /><stop id="euVAoNPzqM214-stroke-1" offset="100%" stopColor="#15aabf" /></linearGradient></defs><g transform="matrix(3.923563 0 0 3.92361-384.137262-468.284973)"><rect width="256" height="256" rx="28" ry="28" transform="matrix(.470639 0 0 0.470639 184.254136 173.262972)" fill="rgba(255,255,255,0)" stroke="url(#euVAoNPzqM213-stroke)" strokeWidth="40" strokeLinejoin="round" /><rect width="256" height="256" rx="28" ry="28" transform="matrix(.470639 0 0 0.470639 152.173578 206.369669)" fill="url(#euVAoNPzqM214-fill)" stroke="url(#euVAoNPzqM214-stroke)" strokeWidth="40" /></g></svg>
                        </div>
                    </div>
                    {/* Text */}
                    {/* Text */}
                    {e.userPrompt}
                </div>
                {/* Open Editor Button */}
                {/* <button
                    className='hidden ml-2 size-8 justify-center items-center my-auto text-white font-bold rounded-full bg-transparent bg-gray-400 hover:bg-gray-500 group-hover:opacity-100 opacity-0 transition-all duration-300'
                    onClick={() => {
                        setIsEditMode(v => !v);
                        setPromptText(e.userPrompt);
                    }}
                >
                    <Pencil className='p-1' />
                </button> */}
            </div>


            const editorHTML = (<div className='bg-gray-100 p-2 rounded-lg border border-gray-300'>
                {/* Text Editor */}
                <textarea
                    className='w-full bg-gray-100 p-2 rounded-md flex flex-col items-start text-sm resize-none focus:outline-none overflow-hidden max-h-[500px] overflow-y-auto'
                    onChange={(e) => setPromptText(e.target.value)}
                    value={promptText}
                    placeholder='Edit prompt text here...'
                    rows={1}
                    onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} // Adjust height dynamically
                    ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }} // Ensure correct initial height
                >
                </textarea>

                {/* Submit and Cancel Buttons */}
                <div className='flex justify-end w-full gap-2'>
                    <button
                        className='w-auto px-4 py-2 bg-white text-black hover:bg-slate-50 font-medium text-sm rounded-full border border-gray-300'
                        onClick={() => { setIsEditMode(false) }}
                    >
                        Cancel
                    </button>
                    <button
                        disabled={!!isSubmittingRef.current}
                        onClick={async () => {
                            setIsSubmitting(true);
                            vscodeFetch({ type: 'history_jump_back', toIdx: Math.max(thisIdx - 1, 0) })

                        }}
                        className='w-auto px-4 py-2 bg-black text-white hover:bg-slate-800 font-medium text-sm rounded-full'
                    >
                        Submit
                    </button>
                </div>
                {/* Edit Button */}
            </div>
            )


            return (
                <>
                    {/* Prompt and Edits Container */}
                    <div className='flex flex-col w-full'>

                        {/* Prompt */}
                        <div className={`relative w-[85%] bg-gray-200 pt-2 pb-4 px-2 rounded-md flex flex-col gap-0 items-start text-sm ${historyIdx < thisIdx ? 'opacity-30' : ''}`}>
                            {promptHTML}
                            <FileDiffs start_open={true} trimCode={true}
                                beforeFiles={e.files.map(v => ({ content: v.before, globalPath: v.globalPath }))}
                                afterFiles={e.files.map(v => ({ content: v.after, globalPath: v.globalPath }))}
                                codeEditorName={codeEditorName}
                            />
                        </div>
                    </div>

                </>
            );
        }
        return GPTChange
    }, [isSubmittingRef, setIsSubmitting, vscodeFetch])

    const UserChange = useMemo(() => {

        const UserChange = ({ e, thisIdx, historyIdx, codeEditorName }: { e: historySaveElt, thisIdx: number, historyIdx: number, codeEditorName: 'vscode' | 'cursor' }) => {

            return (
                <div className={`w-fit min-w-32 self-end bg-gray-200 p-2 rounded-md flex flex-col items-start text-sm resize-none focus:outline-none overflow-hidden max-h-[500px] overflow-y-auto ${historyIdx < thisIdx ? 'opacity-30' : ''}`}>
                    <p className="text-black leading-5 text-left pb-1">
                        {'Saved'}
                    </p>
                    <ul className='flex flex-col gap-1 text-xs text-gray-400'>
                        {Object.keys(e.afterOfGlobalPath).map((globalPath, i) => {
                            return (
                                <li key={i} className='cursor-pointer mb-[2px] text-slate-500 text-xs hover:text-slate-400 flex items-center' onClick={() => { openInCodeEditor(codeEditorName, globalPath, 1, 0) }}>
                                    {/* <span className=''><Dot className='size-5' /></span> */}
                                    {getBasename(globalPath)}
                                </li>
                            );
                        })}
                    </ul>
                </div>



            );
        }

        return UserChange

    }, [])

    const undoRedoButtons = !(undoIsDisabled && redoIsDisabled) && <div className='flex self-end justify-center items-center px-1 gap-1'>
        {undoButton}
        {redoButton}
    </div>

    const sidebar = <>

        {/* Sidebar Show/Hide Button */}
        <div className={`fixed top-0 h-full z-[2147483646] flex items-center ${isSidebarMinimized ? 'right-0' : '-right-[500px]'} transition-all duration-300`}>
            <button type='button' onClick={() => {
                setIsSidebarMinimized(v => !v)
            }} className='absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-100 py-2 px-1 rounded-l-lg shadow-md flex justify-center items-center'>
                {/* {isSidebarMinimized ? <FaChevronLeft /> : <FaChevronRight />} */}
                <div className='h-5 w-5'>
                    <img src='https://useglass.ai/glass.svg' alt='Glass Logo' />
                </div>
            </button>
        </div>

        {/* Sidebar */}
        <div ref={scrollRef}
            className={`z-[21474836] fixed top-0 right-0 w-[500px] h-full bg-white text-black shadow-[0_2px_px_rgba(0,0,0,1)] flex flex-col overflow-auto border-l border-gray-300 ${isSidebarMinimized ? 'translate-x-full' : 'translate-x-0'} transition-transform duration-300`}
            onScroll={onScroll}
            onChange={() => {
                // Scroll to bottom if scroll is locked
                if (alwaysScrollDown && scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            }}
        >
            <div className='flex flex-col'>
                <div className={`sticky top-0 z-[500] bg-white flex justify-between items-center py-2 px-4`}>


                    <div className="flex items-center gap-2">

                        {/* enabled button (wrapped in label) */}
                        <button className={`px-2 py-1 text-xs rounded-[4px] flex items-center gap-1 
                        ${isGlassEnabled ? 'border border-blue-500 text-blue-500 hover:brightness-95' : 'text-gray-500 border border-gray-300 hover:brightness-95'} 
                        `}
                            onClick={() => {
                                setIsGlassEnabled(v => !v);
                                setSelectedRef(null);
                                setHoveredRef(null);
                            }}>
                            <span>{isGlassEnabled ? 'Enabled' : 'Disabled'}</span>
                        </button>


                        <Tooltip content='Built with ❤️ by Glass.js.'>
                            <button className={`px-2 py-1 text-[10px] flex items-center justify-center rounded-full border border-gray-200 size-5 cursor-default text-gray-400 font-mono `}>
                                <span>{'i'}</span>
                            </button>
                        </Tooltip>

                    </div>


                    <div className="flex items-center gap-2">
                        {/* Clear */}
                        <button className='px-2 py-1 text-xs text-white bg-orange-700 rounded-[4px] border hover:brightness-105 focus:outline-none'
                            onClick={async () => {
                                vscodeFetch({ type: 'clear_history' })
                            }}
                        >Clear History</button>

                        {/* X button */}
                        <button
                            onClick={() => {
                                setIsSidebarMinimized(v => !v)
                                // if they just disabled glass, clear selection
                                if (!isSidebarMinimized) {
                                    setIsSidebarMinimized(true);
                                    // setSelectedRef(null);
                                    // setHoveredRef(null);
                                }
                            }}
                            className="flex items-center focus:outline-none"
                        >
                            <X className='size-5 hover:text-gray-700' />
                        </button>

                    </div>

                    {/* <button
                        className='px-2 gap-2 py-1.5 flex flex-row items-center bg-black text-white text-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 rounded-md'
                        onClick={() => setModalOpen(true)}
                    >
                        <Code className='align-bottom size-4' />
                        <div className="tracking-tight pb-[2px]">Review changes</div>
                    </button>
                    {modalOpen && createPortal(
                        <div className='fixed inset-0 z-[2147483647] flex items-center justify-center bg-black bg-opacity-50'>
                            <div className='bg-white rounded-lg shadow-lg overflow-hidden w-3/4 h-3/4 flex flex-col'>
                                <div className='flex justify-between items-center p-4 border-b border-gray-200'>
                                    <button className='px-4 py-2 text-black rounded-md bg-gray-200 hover:bg-gray-300' onClick={() => setModalOpen(false)}>Close</button>
                                    <h2 className='text-xl font-semibold'>Modal Header</h2>
                                    <button className='px-4 py-2 text-black rounded-md bg-gray-200 hover:bg-gray-300' onClick={() => setModalOpen(false)}>Save</button>
                                </div>
                                <div className='flex-grow p-4 overflow-y-auto'>
                                    <p>Modal Body Content</p>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )} */}

                </div>

                {/* History sidebar */}
                <div className='min-h-[calc(100vh-125px)] space-y-4 py-4 px-4 flex flex-col justify-start items-start'>
                    {history.length === 0 ?
                        <p className='text-gray-500'>No changes yet.</p> :
                        <>
                            {historyIdx === -1 && undoRedoButtons}
                            {/* history entries */}
                            {history.map((e, i) => <Fragment key={i}>
                                {/* chat entry */}
                                {e.type === 'GPT' ?
                                    <GPTChange e={e} thisIdx={i} historyIdx={historyIdx} codeEditorName={codeEditorName} />
                                    : <UserChange e={e} thisIdx={i} historyIdx={historyIdx} codeEditorName={codeEditorName} />}

                                {historyIdx === i && undoRedoButtons}
                            </Fragment>
                            )}
                        </>
                    }
                </div>

                {/*  Glass bar container */}


                <div className='sticky bottom-0 px-2 pb-4 bg-white w-full z-[99999]'>
                    {toastNotif}


                    <form className='flex justify-center items-center pl-4 py-4 min-h-[80px] w-full rounded-[10px] bg-gradient-to-tr from-blue-400 to-blue-200 shadow-md border border-black/50 border-1 border-solid pointer-events-auto transition-all duration-200'
                        onClick={() => promptTextRef?.focus()}
                        onBlur={() => promptTextRef?.blur()}
                        onSubmit={onSubmitPrompt}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) onSubmitPrompt(e) }}
                    >

                        {textarea}

                        <div className='flex flex-col justify-center items-center px-2'>
                            {submitButton}
                        </div>
                    </form>
                </div>
            </div>
        </div>


        <FullscreenCanvas ref={canvasRef} draw={drawFn} zIndex={2147483644} />

        <div className='fixed top-0 left-0 w-full h-full pointer-events-none z-[2147483645]'>
            <div ref={floatingToggleModeRef} className='fixed flex'>
                {editModeToggleButton}
            </div>
            <div ref={floatingSelectionMenuRef} className='fixed flex'>
                {jumpToCodeButton}
            </div>
        </div>
    </>

    return sidebar

}


const GlassWrapper = ({ children, debug, trackingDisabled }) => {

    const [sidebar, setSidebar] = useState<React.ReactNode>(null)
    const { isSidebarMinimized } = useGlassSettings()
    const childrenWrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        // scope the glass TW - IMPORTANT TO DO IT HERE, because it gets mounted to document.body and separated from the rest of the code that looks like its parent here
        const p = createPortal(<div className='scope'>
            <PHProvider trackingDisabled={trackingDisabled}>
                <GlassSideBar childrenWrapperRef={childrenWrapperRef} debug={debug} />
            </PHProvider>
        </div>, document.body)
        setSidebar(p)
    }, [debug, trackingDisabled])

    // MAKE SURE 'scope' IS ALWAYS THE OUTER LAYER!!!!!!!!!!!!!!!!!!!
    return <div style={{ maxWidth: '100%', maxHeight: '100vh', overflow: 'hidden' }}>
        <div ref={childrenWrapperRef} style={{ maxHeight: '100vh', overflowY: 'auto', ...isSidebarMinimized ? { width: '100%' } : { width: 'calc(100% - 500px)' } }}>
            {children}
        </div>
        <div style={{ background: 'rgb(239, 246, 255)', ...isSidebarMinimized ? { width: '0px' } : { width: '500px' } }}>
            {sidebar}
        </div>
    </div>
}


export const GlassProvider = ({ children, debug, trackingDisabled }: { children?: React.ReactNode, debug?: boolean, trackingDisabled?: boolean }) => {

    if ((typeof process === 'undefined' || process.env.NODE_ENV !== 'development')) // VERY IMPORTANT!!!!!!!!!!!!!
        return children;

    return <GlassSettingsProvider>
        <GlassWrapper debug={debug} trackingDisabled={trackingDisabled}>
            {children}
        </GlassWrapper>
    </GlassSettingsProvider>
}


export default GlassProvider



// const FwdRefTest = forwardRef(function AA({ }, ref: React.ForwardedRef<any>) {
//     return <div ref={ref}>hihiihihihi</div>
// })

// export function X() {
//     return <div>this is X</div>
// }