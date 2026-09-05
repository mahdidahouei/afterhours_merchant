import { useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "@/ui/Spinner";

export type FileDropProps = {
  /** What the owner is choosing, in their words: "PDF", "image". */
  what: string;
  /** Accepted MIME types. Also what the browser's picker filters on. */
  accept: readonly string[];
  maxBytes: number;
  /** The file already attached, if there is one. */
  fileName?: string | null;
  /** Where that file lives, so it can be opened to check. */
  href?: string | null;
  isUploading?: boolean;
  /** A failure from the caller's upload, shown under the zone. */
  errorMessage?: string;
  onSelect: (file: File) => void;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
};

const megabytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))}MB`;

/**
 * Pick one file, by clicking or by dropping it.
 *
 * Type and size are checked here rather than by the caller, because the message
 * belongs next to the zone that refused the file. Anything the caller's upload
 * goes on to reject arrives back through `errorMessage` and prints in the same
 * place, so there is only ever one line to read.
 */
export function FileDrop({
  what,
  accept,
  maxBytes,
  fileName,
  href,
  isUploading,
  errorMessage,
  onSelect,
  onClear,
  disabled,
  className,
}: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const describedBy = useId();

  const take = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (accept.length > 0 && !accept.includes(file.type)) {
      setRejected(`That one needs to be ${extensions(accept)}.`);
      return;
    }
    if (file.size > maxBytes) {
      setRejected(`That file is over ${megabytes(maxBytes)}.`);
      return;
    }

    setRejected(null);
    onSelect(file);
  };

  const browse = () => inputRef.current?.click();
  const message = rejected ?? errorMessage;

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          take(event.target.files);
          // Reset, or choosing the same file twice fires no change event.
          event.target.value = "";
        }}
      />

      {fileName ? (
        <div className="flex items-center gap-2 rounded-[12px] border border-[color:var(--color-field-border)] bg-color-background px-3 py-2.5">
          <PaperclipIcon />

          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 flex-1 truncate font-satoshi text-[13px] font-medium text-color-primary-text underline-offset-4 hover:underline"
            >
              {fileName}
            </a>
          ) : (
            <span className="min-w-0 flex-1 truncate font-satoshi text-[13px] font-medium text-color-primary-text">
              {fileName}
            </span>
          )}

          {isUploading ? (
            <Spinner small />
          ) : (
            <>
              <button
                type="button"
                onClick={browse}
                disabled={disabled}
                className="shrink-0 font-satoshi text-[12px] font-medium text-color-primary underline underline-offset-4"
              >
                Replace
              </button>
              {onClear && (
                <button
                  type="button"
                  onClick={onClear}
                  disabled={disabled}
                  className="shrink-0 font-satoshi text-[12px] text-color-secondary-text transition-colors hover:text-color-danger"
                >
                  Remove
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={browse}
          disabled={disabled || isUploading}
          aria-describedby={describedBy}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDropping(true);
          }}
          onDragLeave={() => setIsDropping(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDropping(false);
            if (!disabled && !isUploading) take(event.dataTransfer.files);
          }}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed px-4 py-4 transition-colors",
            "font-satoshi text-[13px]",
            isDropping
              ? "border-color-primary bg-color-secondary/30 text-color-primary"
              : "border-[color:var(--color-field-border)] bg-color-background text-color-secondary-text hover:border-color-primary hover:text-color-primary",
            (disabled || isUploading) && "pointer-events-none opacity-60",
          )}
        >
          {isUploading ? (
            <>
              <Spinner small />
              Uploading…
            </>
          ) : (
            <>
              <UploadIcon />
              <span>
                Drop your {what} here, or{" "}
                <span className="font-medium text-color-primary underline underline-offset-4">
                  browse
                </span>
              </span>
            </>
          )}
        </button>
      )}

      <p
        id={describedBy}
        role={message ? "alert" : undefined}
        className={cn(
          "mt-1.5 pl-1 font-satoshi text-[12px]",
          message ? "text-color-danger" : "text-color-secondary-text",
        )}
      >
        {message ?? `${extensions(accept)}, up to ${megabytes(maxBytes)}.`}
      </p>
    </div>
  );
}

/** "application/pdf" reads as "PDF" to everyone who isn't a browser. */
function extensions(accept: readonly string[]) {
  const names = [
    ...new Set(accept.map((type) => type.split("/")[1]?.toUpperCase() ?? type)),
  ];
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} or ${names[names.length - 1]}`;
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className="size-4 shrink-0">
      <path
        d="M8 10.5V2m0 0L5 5m3-3l3 3M2.5 11v1.5A1.5 1.5 0 004 14h8a1.5 1.5 0 001.5-1.5V11"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-4 shrink-0 text-color-secondary-text"
    >
      <path
        d="M10.5 5.5L5.9 10.1a1.6 1.6 0 002.2 2.2l4.9-4.9a3 3 0 00-4.2-4.2L3.6 8.4a4.4 4.4 0 006.2 6.2l4.2-4.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
