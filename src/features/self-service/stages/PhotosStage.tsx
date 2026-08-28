import { useRef, useState } from "react";
import { ArrowLeft } from "iconsax-reactjs";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { useAddPhoto, useMovePhoto, useRemovePhoto } from "../api/queries";
import { PHOTO_LIMITS, PHOTO_PROMPTS, PHOTO_TARGET, type Claim } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";
import { FeedCards } from "../components/FeedCards";
import { PhotoGrid } from "../components/PhotoGrid";

type Props = {
  claim: Claim;
  onBack: () => void;
  onContinue: () => void;
};

/** Reject before uploading rather than round-tripping a 413 or a 415. */
function rejectionReason(file: File): string | null {
  if (!PHOTO_LIMITS.accept.includes(file.type as (typeof PHOTO_LIMITS.accept)[number])) {
    return `${file.name} isn't a JPEG, PNG or WebP.`;
  }
  if (file.size > PHOTO_LIMITS.maxBytes) {
    return `${file.name} is over 10 MB.`;
  }
  return null;
}

export function PhotosStage({ claim, onBack, onContinue }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const addPhoto = useAddPhoto();
  const movePhoto = useMovePhoto();
  const removePhoto = useRemovePhoto();

  const remaining = PHOTO_LIMITS.maxCount - claim.photos.length;
  const isFull = remaining <= 0;

  const upload = async (files: FileList | File[]) => {
    setLocalError(null);
    const queue = Array.from(files).slice(0, Math.max(0, remaining));

    if (Array.from(files).length > queue.length) {
      setLocalError(`You can add ${PHOTO_LIMITS.maxCount} photos in total.`);
    }

    // Sequential: the server assigns position by arrival, so parallel uploads
    // would land in a nondeterministic order.
    for (const file of queue) {
      const reason = rejectionReason(file);
      if (reason) {
        setLocalError(reason);
        continue;
      }
      await addPhoto.mutateAsync(file).catch(() => null);
    }
  };

  const move = (photoId: string, position: number) => {
    setBusyIds((prev) => new Set(prev).add(photoId));
    movePhoto
      .mutateAsync({ photoId, position })
      .catch(() => null)
      .finally(() =>
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        }),
      );
  };

  const pick = () => inputRef.current?.click();

  /** Dashed tiles for the photos not added yet, so the grid reads as a target. */
  const emptySlots = Math.max(0, PHOTO_TARGET - claim.photos.length);

  return (
    <StagePanel>
      <StageHeading title="Show them the room.">
        Add 5–7 photos of your atmosphere, interior, and food. Warm, evening light works
        best — guests choose with their eyes.
      </StageHeading>

      <FeedCards connections={claim.social} />

      <div className="mt-7 flex flex-wrap items-center gap-2">
        <p className="mr-1 font-satoshi text-[11px] font-semibold uppercase tracking-[0.12em] text-color-secondary-text">
          What to show
        </p>
        {PHOTO_PROMPTS.map((prompt) => (
          <span
            key={prompt}
            className="rounded-full bg-color-secondary/60 px-3 py-1 font-satoshi text-[12px] text-color-primary-text"
          >
            {prompt}
          </span>
        ))}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDropping(true);
        }}
        onDragLeave={() => setIsDropping(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDropping(false);
          if (!isFull) void upload(event.dataTransfer.files);
        }}
        className={cn(
          "mt-4 rounded-[16px] transition-colors",
          isDropping && "bg-color-secondary/30 outline-dashed outline-2 outline-color-primary",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={PHOTO_LIMITS.accept.join(",")}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
            event.target.value = "";
          }}
        />

        {claim.photos.length > 0 && (
          <PhotoGrid
            photos={claim.photos}
            onReorder={move}
            onRemove={(photoId) => removePhoto.mutate(photoId)}
            busyIds={busyIds}
            disabled={removePhoto.isPending}
          />
        )}

        {emptySlots > 0 && (
          <ul
            className={cn(
              "grid grid-cols-2 gap-2.5 sm:grid-cols-3",
              claim.photos.length > 0 && "mt-2.5",
            )}
          >
            {Array.from({ length: emptySlots }, (_, offset) => (
              <li key={offset}>
                <button
                  type="button"
                  onClick={pick}
                  disabled={addPhoto.isPending}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-color-border bg-color-background-3 px-3 text-center transition-colors hover:border-color-primary/50 hover:bg-color-secondary/25 disabled:opacity-60"
                >
                  <PhotoIcon />
                  <span className="font-satoshi text-[13px] text-color-secondary-text">
                    Photo {claim.photos.length + offset + 1} — PNG or JPG
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="responsive"
          disabled={isFull || addPhoto.isPending}
          isLoading={addPhoto.isPending}
          onClick={pick}
          className="h-[42px] rounded-full text-[13px] font-normal"
        >
          {claim.photos.length > 0 ? "Add more" : "Choose photos"}
        </Button>

        <p className="font-satoshi text-[12px] text-color-secondary-text">
          Drag to reorder — the first photo leads your listing. Up to 10 MB each ·{" "}
          {claim.photos.length} of {PHOTO_LIMITS.maxCount} added.
        </p>
      </div>

      {(localError || addPhoto.isError || movePhoto.isError || removePhoto.isError) && (
        <p role="alert" className="mt-3 font-satoshi text-[13px] text-color-danger">
          {localError ??
            errorMessage(addPhoto.error ?? movePhoto.error ?? removePhoto.error)}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 mt-6 flex flex-wrap items-center gap-3 border-t border-color-border bg-white/95 px-6 pb-1 pt-4 backdrop-blur-sm tb:-mx-8 tb:px-8">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 font-satoshi text-[13px] font-medium text-color-secondary-text transition-colors hover:text-color-primary"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex-1" />

        <Button
          variant="primary"
          size="responsive"
          onClick={onContinue}
          className="h-[48px] rounded-full px-6 text-[13px] font-medium max-tb:w-full"
        >
          Save my profile
        </Button>
      </div>
    </StagePanel>
  );
}

function PhotoIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="size-6 text-color-disabled-text"
    >
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M4 17l4.5-4.5a2 2 0 0 1 2.8 0L16 17" strokeLinecap="round" />
    </svg>
  );
}
