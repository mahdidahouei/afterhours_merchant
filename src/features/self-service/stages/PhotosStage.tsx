import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { errorMessage, isProblem } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { Switch } from "@/ui/Switch";
import {
  useAddPhoto,
  useMovePhoto,
  useRemovePhoto,
  useSubmitClaim,
} from "../api/queries";
import { PHOTO_LIMITS, type Claim, type PendingApi } from "../api/types";
import { StageHeading, StagePanel } from "../components/ClaimLayout";
import { PhotoGrid } from "../components/PhotoGrid";

type Props = {
  claim: Claim;
  onBack: () => void;
  /** PENDING_API — feed connection is explicitly not in v1. */
  feeds: PendingApi["feeds"];
  onFeedsChange: (feeds: PendingApi["feeds"]) => void;
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

export function PhotosStage({ claim, onBack, feeds, onFeedsChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const addPhoto = useAddPhoto();
  const movePhoto = useMovePhoto();
  const removePhoto = useRemovePhoto();
  const submit = useSubmitClaim();

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

  const missingPhotos = isProblem(submit.error, "profile_incomplete");

  return (
    <StagePanel>
      <StageHeading title="Show them the room.">
        Add 5–7 photos of your atmosphere, interior, and food. Warm, evening light works
        best — guests choose with their eyes.
      </StageHeading>

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
          "rounded-[16px] border-2 border-dashed p-6 text-center transition-colors",
          isDropping ? "border-color-primary bg-color-secondary/30" : "border-color-border",
          isFull && "opacity-50",
        )}
      >
        <p className="font-satoshi text-[14px] font-medium text-color-primary-text">
          Drag photos here, or browse
        </p>
        <p className="mt-1 font-satoshi text-[12px] text-color-secondary-text">
          JPEG, PNG or WebP · up to 10 MB each · {claim.photos.length} of{" "}
          {PHOTO_LIMITS.maxCount} added
        </p>

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

        <Button
          variant="secondary"
          size="responsive"
          disabled={isFull || addPhoto.isPending}
          isLoading={addPhoto.isPending}
          onClick={() => inputRef.current?.click()}
          className="mt-3.5 h-[42px] rounded-full text-[13px] font-normal"
        >
          Choose photos
        </Button>
      </div>

      {(localError || addPhoto.isError) && (
        <p role="alert" className="mt-3 font-satoshi text-[13px] text-color-danger">
          {localError ?? errorMessage(addPhoto.error)}
        </p>
      )}

      {claim.photos.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-satoshi text-[12px] text-color-secondary-text">
            Drag to reorder — the first photo leads your listing.
          </p>
          <PhotoGrid
            photos={claim.photos}
            onReorder={move}
            onRemove={(photoId) => removePhoto.mutate(photoId)}
            busyIds={busyIds}
            disabled={removePhoto.isPending}
          />
        </div>
      )}

      <FeedCards feeds={feeds} onChange={onFeedsChange} />

      {submit.isError && (
        <p role="alert" className="mt-4 font-satoshi text-[13px] text-color-danger">
          {missingPhotos
            ? "A few things are still missing — go back and check the highlighted sections."
            : errorMessage(submit.error)}
        </p>
      )}

      <div className="sticky bottom-0 -mx-6 mt-6 flex gap-2.5 border-t border-color-border bg-white/95 px-6 pb-1 pt-4 backdrop-blur-sm tb:-mx-8 tb:px-8">
        <Button
          variant="secondary"
          size="responsive"
          onClick={onBack}
          className="h-[46px] rounded-full text-[13px] font-normal"
        >
          Back
        </Button>
        <Button
          variant="primary"
          size="responsive"
          isLoading={submit.isPending}
          onClick={() => submit.mutate(undefined)}
          className="h-[46px] flex-1 rounded-full text-[13px] font-medium"
        >
          Submit for review
        </Button>
      </div>
    </StagePanel>
  );
}

/**
 * PENDING_API — Instagram and TikTok feed connection is explicitly not in v1.
 *
 * The cards are built because the design leads with them and the integration is
 * planned, but they cannot connect anything yet, and they say so rather than
 * pretending to work.
 */
function FeedCards({
  feeds,
  onChange,
}: {
  feeds: PendingApi["feeds"];
  onChange: (feeds: PendingApi["feeds"]) => void;
}) {
  return (
    <div className="mt-8 rounded-[16px] border border-color-border bg-color-background-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-satoshi text-[15px] font-semibold text-color-primary-text">
          Bring your listing to life.
        </p>
        <span className="rounded-full bg-color-secondary px-2.5 py-0.5 font-satoshi text-[11px] font-medium text-color-primary">
          Coming soon
        </span>
      </div>

      <p className="mt-1.5 font-satoshi text-[13px] leading-[160%] text-color-secondary-text">
        Connect your feeds and your newest posts show on your listing automatically —
        guests see tonight's dishes, not last year's. No re-uploading, ever.
      </p>

      <div className="mt-4 flex flex-col gap-2.5">
        <Switch
          checked={feeds.instagram}
          onChange={(checked) => onChange({ ...feeds, instagram: checked })}
          label="Instagram — remind me when this is ready"
        />
        <Switch
          checked={feeds.tiktok}
          onChange={(checked) => onChange({ ...feeds, tiktok: checked })}
          label="TikTok — remind me when this is ready"
        />
      </div>
    </div>
  );
}
