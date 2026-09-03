import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/cn";
import { Spinner } from "@/ui/Spinner";
import type { Photo } from "../api/types";

type Props = {
  photos: Photo[];
  onReorder: (photoId: string, position: number) => void;
  onRemove: (photoId: string) => void;
  /** Ids currently being written, so their tile can show a spinner. */
  busyIds?: Set<string>;
  disabled?: boolean;
};

/**
 * The photo tiles, reorderable by drag or keyboard.
 *
 * dnd-kit rather than native HTML5 drag and drop because the latter does not
 * fire on touch at all, and this grid has to work on a phone. The keyboard
 * sensor comes free with it, which is the only way to reorder without a pointer.
 *
 * The first photo leads the listing, so it is badged — that ordering is the
 * whole reason reordering exists.
 */
export function PhotoGrid({ photos, onReorder, onRemove, busyIds, disabled }: Props) {
  const sensors = useSensors(
    // A small distance threshold so a tap-to-delete isn't read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = photos.map((photo) => photo.photoId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    // Reflect the move immediately; the server call reconciles.
    arrayMove(photos, from, to);
    onReorder(String(active.id), to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <PhotoTile
              key={photo.photoId}
              photo={photo}
              isLead={index === 0}
              isBusy={busyIds?.has(photo.photoId)}
              onRemove={() => onRemove(photo.photoId)}
              disabled={disabled}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function PhotoTile({
  photo,
  isLead,
  isBusy,
  onRemove,
  disabled,
}: {
  photo: Photo;
  isLead: boolean;
  isBusy?: boolean;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.photoId, disabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative aspect-[4/5] overflow-hidden rounded-[14px] bg-color-background",
        isDragging && "z-10 opacity-80 ring-2 ring-color-primary",
      )}
    >
      <img
        src={photo.url}
        alt=""
        className="size-full object-cover"
        draggable={false}
        loading="lazy"
      />

      {/* The drag handle is the tile itself; the buttons sit above it. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder photo ${photo.position + 1}`}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
      />

      {isLead && (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-color-primary px-2 py-0.5 font-satoshi text-[10px] font-semibold text-white">
          Leads
        </span>
      )}

      {isBusy ? (
        <span className="absolute right-2 top-2 grid size-6 place-content-center rounded-full bg-white/90">
          <Spinner small />
        </span>
      ) : (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Remove photo"
          className={cn(
            "absolute right-2 top-2 grid size-6 place-content-center rounded-full bg-black/55 text-white",
            "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
            // Always visible on touch, where there is no hover to reveal it.
            "[@media(hover:none)]:opacity-100",
          )}
        >
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
            <path
              d="M1 1l10 10M11 1L1 11"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </li>
  );
}
