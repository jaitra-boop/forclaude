/**
 * An editable wireframe frame: the shared <WireframeScreen> plus selection,
 * pin dropping and drag-to-reorder/move. Used by the storyboard and the screen
 * editor. All edits go through store actions.
 */
import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { actions, activeFlow, useStore } from "../../store/store";
import { findElement } from "../../model/ops";
import { ELEMENT_TYPES, type Element, type ElementType, type Platform, type Screen } from "../../model/schema";
import { ELEMENT_LABELS } from "../../wireframe/elements";
import { WireframeScreen } from "../../wireframe/WireframeScreen";

const EL = "el:";
const FRAME = "frame:";
const PALETTE = "palette:";

/** Wrap frames and a palette in this so elements can be dragged between frames and from the palette. */
export function FrameDndProvider({ children }: { children: ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const onDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    if (id.startsWith(PALETTE)) setDragLabel(ELEMENT_LABELS[id.slice(PALETTE.length) as ElementType]);
    else setDragLabel(null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragLabel(null);
    const flow = activeFlow();
    if (!flow || !e.over) return;
    const activeId = String(e.active.id);
    const overId = String(e.over.id);
    // Resolve the drop target into (screen, index).
    let toScreenId: string | undefined;
    let toIndex = 0;
    if (overId.startsWith(EL)) {
      const over = findElement(flow, overId.slice(EL.length));
      if (!over) return;
      toScreenId = over.screen.id;
      toIndex = over.index;
    } else if (overId.startsWith(FRAME)) {
      toScreenId = overId.slice(FRAME.length);
      toIndex = flow.screens.find((s) => s.id === toScreenId)?.elements.length ?? 0;
    }
    if (!toScreenId) return;

    if (activeId.startsWith(PALETTE)) {
      actions.addElement(toScreenId, activeId.slice(PALETTE.length) as ElementType, toIndex);
      return;
    }
    if (activeId.startsWith(EL)) {
      const elementId = activeId.slice(EL.length);
      const from = findElement(flow, elementId);
      if (!from || (from.screen.id === toScreenId && from.index === toIndex)) return;
      actions.moveElement(elementId, toScreenId, toIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {children}
      <DragOverlay dropAnimation={null}>
        {dragLabel ? <div className="rounded border border-dashed border-neutral-900 bg-white px-2 py-1 text-xs">{dragLabel}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableElement({ el, children }: { el: Element; children: ReactNode }) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({ id: EL + el.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.4 : 1, marginTop: el.type === "nav-bar" ? "auto" : undefined }}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function EditableFrame({
  screen,
  platform,
  pinMode = false,
  onPinPlaced,
}: {
  screen: Screen;
  platform: Platform;
  pinMode?: boolean;
  onPinPlaced?: () => void;
}) {
  const selection = useStore((s) => s.selection);
  const { setNodeRef, isOver } = useDroppable({ id: FRAME + screen.id });
  const selectedElementId = selection?.kind === "element" && selection.screenId === screen.id ? selection.id : undefined;
  const selectedAnnotationId = selection?.kind === "annotation" ? selection.id : undefined;

  return (
    <div ref={setNodeRef} style={{ outline: isOver ? "2px dashed #858585" : undefined, outlineOffset: 3, borderRadius: 10, cursor: pinMode ? "crosshair" : undefined }}>
      <SortableContext items={screen.elements.map((e) => EL + e.id)} strategy={verticalListSortingStrategy}>
        <WireframeScreen
          screen={screen}
          platform={platform}
          selectedElementId={selectedElementId}
          selectedAnnotationId={selectedAnnotationId}
          onElementClick={(id) => {
            if (pinMode) {
              actions.addAnnotation({ screenId: screen.id }, { targetElementId: id });
              onPinPlaced?.();
            } else {
              actions.select({ kind: "element", id, screenId: screen.id });
            }
          }}
          onBackgroundClick={() => {
            if (pinMode) {
              actions.addAnnotation({ screenId: screen.id });
              onPinPlaced?.();
            } else {
              actions.select({ kind: "screen", id: screen.id });
            }
          }}
          onPinClick={(id) => actions.select({ kind: "annotation", id, screenId: screen.id })}
          wrapElement={(el, node) => <SortableElement el={el}>{node}</SortableElement>}
        />
      </SortableContext>
    </div>
  );
}

function PaletteItem({ type, onAdd }: { type: ElementType; onAdd: (t: ElementType) => void }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: PALETTE + type });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onAdd(type)}
      className="w-full rounded border border-neutral-300 bg-white px-1.5 py-1 text-left text-[11px] hover:border-neutral-900"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      title="Click to add to the selected screen, or drag into a frame"
      data-testid={`palette-${type}`}
    >
      {ELEMENT_LABELS[type]}
    </button>
  );
}

/** Element palette. Click adds after the selected element (or at the end of the target screen); drag drops anywhere. */
export function ElementPalette({ targetScreenId }: { targetScreenId?: string }) {
  const selection = useStore((s) => s.selection);
  const flow = useStore((s) => activeFlow(s));
  const onAdd = (type: ElementType) => {
    if (!flow || !targetScreenId) return;
    let index: number | undefined;
    if (selection?.kind === "element" && selection.screenId === targetScreenId) {
      const found = findElement(flow, selection.id);
      if (found) index = found.index + 1;
    }
    actions.addElement(targetScreenId, type, index);
  };
  const target = flow?.screens.find((s) => s.id === targetScreenId);
  return (
    <div className="flex h-full flex-col">
      <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Elements</div>
      <div className="px-1 pb-2 text-[10px] text-neutral-500">{target ? `Adds to “${target.title}”` : "Select a screen"}</div>
      <div className="flex flex-col gap-1 overflow-y-auto px-1 pb-2">
        {ELEMENT_TYPES.map((t) => <PaletteItem key={t} type={t} onAdd={onAdd} />)}
      </div>
    </div>
  );
}
