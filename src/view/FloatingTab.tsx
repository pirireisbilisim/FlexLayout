import * as React from "react";
import { CLASSES } from "../Types";
import { LayoutInternal } from "./Layout";
import { IJsonFloating } from "../model/IJsonModel";
import { Rect } from "../Rect";
import { Actions } from "../model/Actions";
import { TabNode } from "../model/TabNode";

/** @internal */
export interface IFloatingTabProps {
    floating: IJsonFloating;
    floatingId: string;
    layout: LayoutInternal;
    tabNode: TabNode;
    onCloseFloating: (floatingId: string) => void;
    onDockFloating: (floatingId: string, x: number, y: number) => void;
    onUpdateFloating: (floatingId: string, rect: Rect, zIndex: number) => void;
}

/** @internal */
export const FloatingTab = (props: React.PropsWithChildren<IFloatingTabProps>) => {
    const { floating, floatingId, layout, tabNode, onDockFloating, onUpdateFloating, children } = props;
    const [isDragging, setIsDragging] = React.useState(false);
    const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });

    // Ensure minimum size on initial state
    const initialWidth = Math.max(floating.rect.width || 600, 400);
    const initialHeight = Math.max(floating.rect.height || 400, 300);

    const [position, setPosition] = React.useState({ x: floating.rect.x, y: floating.rect.y });
    const [size, setSize] = React.useState({ width: initialWidth, height: initialHeight });
    const [zIndex, setZIndex] = React.useState(floating.zIndex);
    const [isResizing, setIsResizing] = React.useState(false);
    const floatingRef = React.useRef<HTMLDivElement>(null);
    const headerRef = React.useRef<HTMLDivElement>(null);
    const resizeStartSize = React.useRef({ width: 0, height: 0 });
    const resizeStartPos = React.useRef({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        // Allow dragging only from header area
        if (headerRef.current && headerRef.current.contains(e.target as Node)) {
            const target = e.target as HTMLElement;
            // Don't start dragging if clicking on buttons
            if (!target.closest('button')) {
                setIsDragging(true);
                setDragOffset({
                    x: e.clientX - position.x,
                    y: e.clientY - position.y
                });
                // Bring to front
                const newZ = layout.getModel().getNextZIndex();
                setZIndex(newZ);


            }
        }
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            setPosition({ x: newX, y: newY });
        }
    }, [isDragging, dragOffset]);

    const handleMouseUp = React.useCallback((e: MouseEvent) => {
        if (isDragging) {
            setIsDragging(false);

            // Update the floating position in the model
            const rect = new Rect(position.x, position.y, size.width, size.height);
            onUpdateFloating(floatingId, rect, zIndex);
        }
    }, [isDragging, position, size, zIndex, floatingId, onUpdateFloating]);

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        resizeStartSize.current = { width: size.width, height: size.height };
        resizeStartPos.current = { x: e.clientX, y: e.clientY };
        // Bring to front
        const newZ = layout.getModel().getNextZIndex();
        setZIndex(newZ);
    };

    const handleResizeMove = React.useCallback((e: MouseEvent) => {
        if (isResizing) {
            const deltaX = e.clientX - resizeStartPos.current.x;
            const deltaY = e.clientY - resizeStartPos.current.y;
            const newWidth = Math.max(200, resizeStartSize.current.width + deltaX);
            const newHeight = Math.max(100, resizeStartSize.current.height + deltaY);
            setSize({ width: newWidth, height: newHeight });
        }
    }, [isResizing]);

    const handleResizeUp = React.useCallback(() => {
        if (isResizing) {
            setIsResizing(false);
            // Update the floating size in the model
            const rect = new Rect(position.x, position.y, size.width, size.height);
            onUpdateFloating(floatingId, rect, zIndex);
        }
    }, [isResizing, position, size, zIndex, floatingId, onUpdateFloating]);

    React.useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    React.useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeUp);
            
        }
        return () => {
                document.removeEventListener('mousemove', handleResizeMove);
                document.removeEventListener('mouseup', handleResizeUp);
            };
    }, [isResizing, handleResizeMove, handleResizeUp]);

    const handleDock = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        console.log("Dock button clicked!");
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        onDockFloating(floatingId, centerX, centerY);
    };

    const cm = layout.getClassName;
    const icons = layout.getIcons();

    const isActive = floating.isActive || false;

    // Debug: log when component renders
    React.useEffect(() => {
        console.log(`FloatingTab ${floatingId} rendered, isActive:`, isActive, 'floating:', floating);
    });

    const style: React.CSSProperties = {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        minWidth: 200,
        minHeight: 100,
        zIndex: zIndex,
        cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'default',
        overflow: 'auto',
        userSelect: isDragging || isResizing ? 'none' : 'auto'
    };

    // Build className with active state
    let className = cm(CLASSES.FLEXLAYOUT__FLOATING_TAB);
    if (isActive) {
        className += " " + cm(CLASSES.FLEXLAYOUT__FLOATING_TAB) + "--active";
    }
    console.log('FloatingTab className:', className, 'isActive:', isActive);

    return (
        <div
            ref={floatingRef}
            className={className}
            style={style}
            onClick={(e)=>{
                // Select this floating tab
                console.log('FloatingTab clicked, tabNode ID:', tabNode.getId());
                layout.doAction(Actions.selectTab(tabNode.getId()));
            }}
            onDrag={(e)=>{
                e.preventDefault();
                e.stopPropagation();
            }}
            onDragStart={(e)=>{
                e.preventDefault();
                e.stopPropagation();
            }}
            draggable={false}
            onMouseDown={handleMouseDown}
        >
            <div
                ref={headerRef}

                className={cm(CLASSES.FLEXLAYOUT__FLOATING_TAB_HEADER)}
            >
                <div className={cm(CLASSES.FLEXLAYOUT__FLOATING_TAB_TITLE)}>
                    {tabNode?.getName() || "[Unnamed Tab]"}
                </div>
                <div className={cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR)}>
                    <button
                        className={cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__FLOATING_TAB_DOCK)}
                        onClick={handleDock}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Dock back to layout"
                    >
                        {typeof icons.restore === "function" ? icons.restore(tabNode as any) : icons.restore}
                    </button>
                    {/* <button
                        className={cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__FLOATING_TAB_CLOSE)}
                        onClick={handleClose}
                        //onMouseDown={(e) => e.stopPropagation()}
                        title="Close tab"
                    >
                        {typeof icons.close === "function" ? icons.close(tabNode) : icons.close}
                    </button> */}
                </div>
            </div>
            <div
                className={cm(CLASSES.FLEXLAYOUT__FLOATING_TAB_CONTENT)}
            >
                {children}
            </div>
            <div
                className={cm(CLASSES.FLEXLAYOUT__FLOATING_TAB_RESIZE_HANDLE)}
                onMouseDown={handleResizeMouseDown}
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 16,
                    height: 16,
                    cursor: 'nwse-resize',
                    zIndex: 1000
                }}
            />
        </div>
    );
};
