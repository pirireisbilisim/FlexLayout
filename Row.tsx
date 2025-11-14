import * as React from "react";
import { RowNode } from "../model/RowNode";
import { TabSetNode } from "../model/TabSetNode";
import { CLASSES } from "../Types";
import { LayoutInternal } from "./Layout";
import { TabSet } from "./TabSet";
import { Splitter } from "./Splitter";
import { Orientation } from "../Orientation";

/** @internal */
export interface IRowProps {
    layout: LayoutInternal;
    node: RowNode;
}

/** @internal */
export const Row = (props: IRowProps) => {
    const { layout, node } = props;
    const selfRef = React.useRef<HTMLDivElement | null>(null);

    const horizontal = node.getOrientation() === Orientation.HORZ;

    React.useLayoutEffect(() => {
        node.setRect(layout.getBoundingClientRect(selfRef.current!));
    });

    const items: React.ReactNode[] = [];
    const floatingCtx = layout.getFloatingContext();
    const children = node.getChildren();

    // Helper function to check if a node is hidden (recursively for rows)
    const isNodeHidden = (child: RowNode | TabSetNode): boolean => {
        if (child instanceof TabSetNode) {
            const nonFloatingChildren = child.getChildren().filter(c => !floatingCtx || !floatingCtx.isFloating(c.getId()));
            return nonFloatingChildren.length === 0;
        } else if (child instanceof RowNode) {
            // Row is hidden if ALL its children are hidden
            return child.getChildren().every(c => isNodeHidden(c as RowNode | TabSetNode));
        }
        return false;
    };

    // Build list of visible children with their original indices
    const visibleChildren: Array<{ child: RowNode | TabSetNode; originalIndex: number }> = [];
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!isNodeHidden(child)) {
            visibleChildren.push({ child, originalIndex: i });
        }
    }

    // Render visible children with splitters only between visible items
    for (let visIndex = 0; visIndex < visibleChildren.length; visIndex++) {
        const { child, originalIndex } = visibleChildren[visIndex];

        // Add splitter before this child if it's not the first visible child
        if (visIndex > 0) {
            const prevOriginalIndex = visibleChildren[visIndex - 1].originalIndex;
            // Use the index between the two visible children
            const splitterIndex = originalIndex;
            items.push(<Splitter key={"splitter" + splitterIndex} layout={layout} node={node} index={splitterIndex} horizontal={horizontal} />);
        }

        // Render the child
        if (child instanceof RowNode) {
            items.push(<Row key={child.getId()} layout={layout} node={child} />);
        } else if (child instanceof TabSetNode) {
            items.push(<TabSet key={child.getId()} layout={layout} node={child} />);
        }
    }

    // Check if all children are hidden
    const allChildrenHidden = children.every(child => isNodeHidden(child));

    const style: Record<string, any> = {
        flexGrow: Math.max(1, node.getWeight()*1000), // NOTE:  flex-grow cannot have values < 1 otherwise will not fill parent, need to normalize
        minWidth: node.getMinWidth(),
        minHeight: node.getMinHeight(),
        maxWidth: node.getMaxWidth(),
        maxHeight: node.getMaxHeight(),
    };

    // Hide row if all children are hidden
    if (allChildrenHidden) {
        style.display = "none";
        style.width = 0;
        style.height = 0;
        style.minWidth = 0;
        style.minHeight = 0;
        style.flexGrow = 0;
        style.flexShrink = 1;
        style.flexBasis = 0;
    }

    if (horizontal) {
        style.flexDirection = "row";
    } else {
        style.flexDirection = "column";
    }

     return (
        <div
            ref={selfRef}
            className={layout.getClassName(CLASSES.FLEXLAYOUT__ROW)}
            style={style}
            >
            {items}
        </div>
    );
};


