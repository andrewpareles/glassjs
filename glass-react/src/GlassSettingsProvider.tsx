'use client'

import { createContext, useContext } from "react";
import { useLocalStorageState } from "./lib";


export type glassSettings = {
    alwaysScrollDown: boolean,
    setAlwaysScrollDown: React.Dispatch<React.SetStateAction<boolean>>,

    isSidebarMinimized: boolean,
    setIsSidebarMinimized: React.Dispatch<React.SetStateAction<boolean>>,

    isGlassEnabled: boolean,
    setIsGlassEnabled: React.Dispatch<React.SetStateAction<boolean>>,

}

const glassContext = createContext<glassSettings>(null as unknown as glassSettings)

export function GlassSettingsProvider({ children }: { children: React.ReactNode; }) {

    const [alwaysScrollDown, setAlwaysScrollDown,] = useLocalStorageState('___glass_is_always_scroll_down___', false);
    const [isSidebarMinimized, setIsSidebarMinimized] = useLocalStorageState('___glass_is_sidebar_minimized___', false, true);
    const [isGlassEnabled, setIsGlassEnabled] = useLocalStorageState('___is_glass_enabled___', true, true);

    return <glassContext.Provider value={{
        alwaysScrollDown,
        setAlwaysScrollDown,

        isSidebarMinimized,
        setIsSidebarMinimized,

        isGlassEnabled,
        setIsGlassEnabled,
    }}>
        {children}
    </glassContext.Provider>;
}

const useGlassSettings = () => {
    const c = useContext(glassContext)
    if (c === null)
        throw new Error(`useGlassSettings context was ${c}`)
    return c
}






export default GlassSettingsProvider;

export { useGlassSettings };