import { useCallback, useEffect, useRef, useState } from "react";

export const getBasename = (s: string) => {
    let i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
    return s.substring(i + 1);
}

export const removeDupesAndKeepOrder = <T,>(arr: T[]) => {
    let newarr: T[] = []
    let S = new Set<T>()
    for (let elt of arr) {
        if (S.has(elt))
            continue
        newarr.push(elt)
        S.add(elt)
    }
    return newarr
}


// const [stateRef, setState] = useInstantAccessState(initVal)
// setState instantly changes the value of stateRef instead of having to wait till the next render to have it (useful for javascript + logic)
// re-renders happen like any other useState()
export const useInstantState = <T,>(initVal: T) => {
    const stateRef = useRef<T>(initVal)
    const [_, setS] = useState<T>(initVal)
    const setState = useCallback((newVal: T) => {
        setS(newVal);
        stateRef.current = newVal;
    }, [])
    return [stateRef as React.RefObject<T>, setState] as const // make s.current readonly; setState handles changes.
}

// open the target's file 
// the inputted line is 1-indexed
// the inputted column is 0-indexed
export const openInCodeEditor = (codeEditorName: 'vscode' | 'cursor', globalPath: string, line: number, column: number) => {

    const codeUri = `${codeEditorName}://file/${encodeURIComponent(globalPath)}:${line}:${column + 1}`;

    // we create an iframe instead of doing window.open() so that theres not a flash of opening a new browser tab
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    iframe.src = codeUri;
    setTimeout(() => document.body.removeChild(iframe), 100);

}


export function useLocalStorageState(key: string, initialValue?, loadingValue?) {
    const [storedValue, setStoredValue] = useState(loadingValue);
    const [isLoading, setIsLoading] = useState(true);

    const getInitialState = useCallback(() => {
        try {
            if (typeof window === 'undefined') return loadingValue;

            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('useLocalStorageState/useState error:', error);
            return initialValue;
        }
    }, [initialValue, key, loadingValue]);


    // on mount, get the initial state
    useEffect(() => {
        const value = getInitialState();
        setStoredValue(value);
        setIsLoading(false);
    }, [getInitialState]);

    const setValue = useCallback((value) => {
        try {
            if (typeof window === 'undefined') return;

            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error('useLocalStorageState/setValue error:', error);
        }
    }, [key, storedValue]);

    return [storedValue, setValue, isLoading] as const;
}