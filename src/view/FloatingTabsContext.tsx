import * as React from "react";

export interface IFloatingTabState {
    isFloating: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
}

export interface IFloatingTabsContext {
    floatingTabs: Map<string, IFloatingTabState>;
    setFloatingTab: (tabId: string, state: IFloatingTabState) => void;
    removeFloatingTab: (tabId: string) => void;
    getFloatingTab: (tabId: string) => IFloatingTabState | undefined;
    isFloating: (tabId: string) => boolean;
}

export const FloatingTabsContext = React.createContext<IFloatingTabsContext | undefined>(undefined);

export const FloatingTabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [floatingTabs, setFloatingTabsState] = React.useState<Map<string, IFloatingTabState>>(new Map());

    const setFloatingTab = React.useCallback((tabId: string, state: IFloatingTabState) => {
        setFloatingTabsState(prev => {
            const newMap = new Map(prev);
            newMap.set(tabId, state);
            return newMap;
        });
    }, []);

    const removeFloatingTab = React.useCallback((tabId: string) => {
        setFloatingTabsState(prev => {
            const newMap = new Map(prev);
            newMap.delete(tabId);
            return newMap;
        });
    }, []);

    const getFloatingTab = React.useCallback((tabId: string) => {
        return floatingTabs.get(tabId);
    }, [floatingTabs]);

    const isFloating = React.useCallback((tabId: string) => {
        return floatingTabs.has(tabId) && floatingTabs.get(tabId)!.isFloating;
    }, [floatingTabs]);

    const value = React.useMemo(() => ({
        floatingTabs,
        setFloatingTab,
        removeFloatingTab,
        getFloatingTab,
        isFloating,
    }), [floatingTabs, setFloatingTab, removeFloatingTab, getFloatingTab, isFloating]);

    return (
        <FloatingTabsContext.Provider value={value}>
            {children}
        </FloatingTabsContext.Provider>
    );
};

export const useFloatingTabs = () => {
    const context = React.useContext(FloatingTabsContext);
    if (!context) {
        throw new Error("useFloatingTabs must be used within FloatingTabsProvider");
    }
    return context;
};
