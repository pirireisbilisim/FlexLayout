import * as React from "react";
import { TabNode } from "../model/TabNode";
import { Actions } from "../model/Actions";
import { CLASSES } from "../Types";
import { LayoutInternal } from "./Layout";

/** @internal */
export interface IFloatingTabWindowProps {
    layout: LayoutInternal;
    node: TabNode;
    factory: (node: TabNode) => React.ReactNode;
}

interface IFloatingTabWindowState {
    isDragging: boolean;
    isResizing: boolean;
    position: { x: number; y: number };
    size: { width: number; height: number };
}

/** @internal */
export class FloatingTabWindow extends React.Component<IFloatingTabWindowProps, IFloatingTabWindowState> {
    private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
    private resizeStartPos: { x: number; y: number } = { x: 0, y: 0 };
    private resizeStartSize: { width: number; height: number } = { width: 0, height: 0 };
    private windowRef = React.createRef<HTMLDivElement>();

    constructor(props: IFloatingTabWindowProps) {
        super(props);
        const { node } = props;
        this.state = {
            isDragging: false,
            isResizing: false,
            position: node.getFloatingPosition() || { x: 200, y: 200 },
            size: node.getFloatingSize() || { width: 600, height: 400 },
        };
    }

    componentDidUpdate(_prevProps: IFloatingTabWindowProps, prevState: IFloatingTabWindowState) {
        // Update node if position or size changed
        if (prevState.position !== this.state.position && !this.state.isDragging) {
            this.props.node._setFloatingPosition(this.state.position);
        }
        if (prevState.size !== this.state.size && !this.state.isResizing) {
            this.props.node._setFloatingSize(this.state.size);
        }
    }

    onHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
            return; // Don't drag when clicking buttons
        }
        e.preventDefault();
        e.stopPropagation();
        this.dragOffset = {
            x: e.clientX - this.state.position.x,
            y: e.clientY - this.state.position.y,
        };
        this.setState({ isDragging: true });
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    };

    onResizeMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.resizeStartPos = { x: e.clientX, y: e.clientY };
        this.resizeStartSize = { ...this.state.size };
        this.setState({ isResizing: true });
        document.addEventListener('mousemove', this.onResizeMouseMove);
        document.addEventListener('mouseup', this.onResizeMouseUp);
    };

    onMouseMove = (e: MouseEvent) => {
        if (this.state.isDragging) {
            const newPosition = {
                x: Math.max(0, e.clientX - this.dragOffset.x),
                y: Math.max(0, e.clientY - this.dragOffset.y),
            };
            this.setState({ position: newPosition });
        }
    };

    onMouseUp = () => {
        if (this.state.isDragging) {
            this.setState({ isDragging: false });
            this.props.layout.doAction(
                Actions.floatTab(this.props.node.getId(), this.state.position, this.state.size)
            );
        }
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    };

    onResizeMouseMove = (e: MouseEvent) => {
        if (this.state.isResizing) {
            const deltaX = e.clientX - this.resizeStartPos.x;
            const deltaY = e.clientY - this.resizeStartPos.y;
            const newSize = {
                width: Math.max(300, this.resizeStartSize.width + deltaX),
                height: Math.max(200, this.resizeStartSize.height + deltaY),
            };
            this.setState({ size: newSize });
        }
    };

    onResizeMouseUp = () => {
        if (this.state.isResizing) {
            this.setState({ isResizing: false });
            this.props.layout.doAction(
                Actions.floatTab(this.props.node.getId(), this.state.position, this.state.size)
            );
        }
        document.removeEventListener('mousemove', this.onResizeMouseMove);
        document.removeEventListener('mouseup', this.onResizeMouseUp);
    };

    onClose = () => {
        this.props.layout.doAction(Actions.deleteTab(this.props.node.getId()));
    };

    onDock = () => {
        this.props.layout.doAction(Actions.unfloatTab(this.props.node.getId()));
    };

    onContentClick = () => {
        // Select this floating tab when clicking on it
        this.props.layout.doAction(Actions.selectTab(this.props.node.getId()));
    };

    render() {
        const { node, factory, layout } = this.props;
        const { position, size, isDragging, isResizing } = this.state;

        const cm = layout.getClassName;

        const style: React.CSSProperties = {
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
        };

        const headerStyle: React.CSSProperties = {
            padding: '8px 12px',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            userSelect: 'none',
        };

        const contentStyle: React.CSSProperties = {
            flex: 1,
            overflow: 'auto',
            position: 'relative',
        };

        const resizeHandleStyle: React.CSSProperties = {
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: 'nwse-resize',
        };

        return (
            <div
                ref={this.windowRef}
                className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW)}
                style={style}
            >
                <div
                    className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_HEADER)}
                    style={headerStyle}
                    onMouseDown={this.onHeaderMouseDown}
                >
                    <span className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_TITLE)}>
                        {node.getName()}
                    </span>
                    <div className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_BUTTONS)}>
                        <button
                            className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_BUTTON_DOCK)}
                            onClick={this.onDock}
                            title="Dock back to layout"
                        >
                            ⛶
                        </button>
                        <button
                            className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_BUTTON_CLOSE)}
                            onClick={this.onClose}
                            title="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                <div
                    className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_CONTENT)}
                    style={contentStyle}
                    onMouseDown={this.onContentClick}
                >
                    {factory(node)}
                </div>
                <div
                    className={cm(CLASSES.FLEXLAYOUT__FLOATING_WINDOW_RESIZE_HANDLE)}
                    style={resizeHandleStyle}
                    onMouseDown={this.onResizeMouseDown}
                />
            </div>
        );
    }
}
