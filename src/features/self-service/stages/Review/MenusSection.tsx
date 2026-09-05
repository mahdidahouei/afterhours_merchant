import { useState } from "react";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { Button } from "@/ui/Button";
import { FileDrop } from "@/ui/FileDrop";
import { TextField } from "@/ui/TextField";
import { ownerApi } from "../../api";
import {
  MENU_FILE_LIMITS,
  type Menu,
  type MenuFile,
  type Profile,
} from "../../api/types";

/** The contract's three file types. "webpage", not "link". */
const FILE_TYPES: { value: MenuFile["type"]; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "webpage", label: "Webpage" },
  { value: "image", label: "Image" },
];

/** PENDING_API — menu files carry no language in v1. */
const LANGUAGES = ["NL", "EN", "DE", "FR"] as const;
type Language = (typeof LANGUAGES)[number];

type Props = {
  draft: Profile;
  update: <K extends keyof Profile>(key: K, value: Profile[K]) => void;
  /** PENDING_API — keyed by `${menuIndex}:${fileIndex}`. */
  languages: Record<string, Language>;
  onLanguageChange: (key: string, language: Language) => void;
};

export function MenusSection({ draft, update, languages, onLanguageChange }: Props) {
  /** Upload state per file row, keyed the same way the languages are. */
  const [uploads, setUploads] = useState<
    Record<string, { busy?: boolean; error?: string }>
  >({});

  const setMenus = (menus: Menu[]) => update("menus", menus);

  const patchMenu = (index: number, patch: Partial<Menu>) =>
    setMenus(draft.menus.map((menu, i) => (i === index ? { ...menu, ...patch } : menu)));

  const patchFile = (menuIndex: number, fileIndex: number, patch: Partial<MenuFile>) =>
    patchMenu(menuIndex, {
      files: draft.menus[menuIndex].files.map((file, i) =>
        i === fileIndex ? { ...file, ...patch } : file,
      ),
    });

  /**
   * Upload the chosen file and store the link it comes back with.
   *
   * The link is all the contract keeps — `ClaimMenuFile` has no notion of an
   * upload — so the file itself is never part of the draft. The name is
   * borrowed as the row's title when it hasn't got one, which is what the owner
   * would have typed anyway.
   */
  const upload = async (menuIndex: number, fileIndex: number, file: File) => {
    const key = `${menuIndex}:${fileIndex}`;
    setUploads((prev) => ({ ...prev, [key]: { busy: true } }));

    try {
      const { link } = await ownerApi.uploadMenuFile(file);
      patchFile(menuIndex, fileIndex, {
        link,
        title: draft.menus[menuIndex].files[fileIndex].title || file.name,
      });
      setUploads((prev) => ({ ...prev, [key]: {} }));
    } catch (error) {
      setUploads((prev) => ({ ...prev, [key]: { error: errorMessage(error) } }));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {draft.menus.length === 0 && (
        <p className="font-satoshi text-[13px] text-color-secondary-text">
          No menus yet. Add one so guests know what they're coming for.
        </p>
      )}

      {draft.menus.map((menu, menuIndex) => (
        <div
          key={menuIndex}
          className="rounded-[16px] border border-color-border bg-color-background-3 p-4"
        >
          <div className="flex items-center gap-2">
            <TextField
              size="responsive"
              containerClassName="min-w-0 flex-1"
              value={menu.title}
              placeholder="Menu name"
              onChange={(event) => patchMenu(menuIndex, { title: event.target.value })}
            />
            <button
              type="button"
              onClick={() => setMenus(draft.menus.filter((_, i) => i !== menuIndex))}
              aria-label={`Remove ${menu.title || "menu"}`}
              className="shrink-0 rounded-[10px] px-2.5 py-2 font-satoshi text-[12px] font-medium text-color-secondary-text transition-colors hover:text-color-danger"
            >
              Remove
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {menu.files.map((file, fileIndex) => {
              const key = `${menuIndex}:${fileIndex}`;

              return (
                <div
                  key={fileIndex}
                  className="rounded-[12px] border border-color-border bg-white p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    {FILE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          patchFile(menuIndex, fileIndex, { type: type.value })
                        }
                        aria-pressed={file.type === type.value}
                        className={cn(
                          "rounded-full px-3 py-1 font-satoshi text-[12px] font-medium transition-colors",
                          file.type === type.value
                            ? "bg-color-primary text-white"
                            : "border border-color-border text-color-secondary-text hover:border-color-primary",
                        )}
                      >
                        {type.label}
                      </button>
                    ))}

                    <span className="ml-auto flex items-center gap-1.5">
                      {/*
                        PENDING_API — the contract has no language on MenuFile.
                        Kept because the design shows it and it is expected soon;
                        held locally and labelled below.
                      */}
                      {LANGUAGES.map((language) => (
                        <button
                          key={language}
                          type="button"
                          onClick={() => onLanguageChange(key, language)}
                          aria-pressed={languages[key] === language}
                          className={cn(
                            "rounded-full px-2 py-1 font-satoshi text-[11px] font-medium transition-colors",
                            languages[key] === language
                              ? "bg-color-secondary text-color-primary"
                              : "text-color-secondary-text hover:text-color-primary",
                          )}
                        >
                          {language}
                        </button>
                      ))}
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-col gap-2 tb:flex-row">
                    <TextField
                      size="responsive"
                      containerClassName="min-w-0 tb:w-[40%]"
                      value={file.title ?? ""}
                      placeholder="File name"
                      onChange={(event) =>
                        patchFile(menuIndex, fileIndex, {
                          title: event.target.value.trim() || null,
                        })
                      }
                    />

                    {/*
                      A webpage is a link the owner types; a PDF or an image is
                      a file they hand over. Same field slot, different control.
                    */}
                    {file.type === "webpage" ? (
                      <TextField
                        size="responsive"
                        containerClassName="min-w-0 flex-1"
                        inputMode="url"
                        value={file.link}
                        placeholder="https://…"
                        onChange={(event) =>
                          patchFile(menuIndex, fileIndex, { link: event.target.value })
                        }
                      />
                    ) : (
                      <FileDrop
                        className="min-w-0 flex-1"
                        what={file.type === "pdf" ? "PDF" : "image"}
                        accept={MENU_FILE_LIMITS.accept[file.type]}
                        maxBytes={MENU_FILE_LIMITS.maxBytes}
                        fileName={file.link ? (file.title ?? nameOf(file.link)) : null}
                        href={file.link || null}
                        isUploading={uploads[key]?.busy}
                        errorMessage={uploads[key]?.error}
                        onSelect={(chosen) => void upload(menuIndex, fileIndex, chosen)}
                        onClear={() => patchFile(menuIndex, fileIndex, { link: "" })}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      patchMenu(menuIndex, {
                        files: menu.files.filter((_, i) => i !== fileIndex),
                      })
                    }
                    className="mt-2 font-satoshi text-[12px] text-color-secondary-text underline underline-offset-4 transition-colors hover:text-color-danger"
                  >
                    Remove file
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() =>
              patchMenu(menuIndex, {
                files: [...menu.files, { title: null, link: "", type: "webpage" }],
              })
            }
            className="mt-3 font-satoshi text-[13px] font-medium text-color-primary underline underline-offset-4"
          >
            Add file or link
          </button>
        </div>
      ))}

      <Button
        variant="secondary"
        size="responsive"
        onClick={() => setMenus([...draft.menus, { title: "", files: [] }])}
        className="h-[46px] w-full rounded-full text-[13px] font-normal"
      >
        Add another menu
      </Button>

      {draft.menus.some((menu) => menu.files.length > 0) && (
        <p className="font-satoshi text-[12px] text-color-secondary-text">
          Menu language isn't saved yet — it arrives with the next API release.
        </p>
      )}
    </div>
  );
}

/** The last path segment of a link, for a file that arrived without a title. */
function nameOf(link: string): string {
  try {
    const path = new URL(link, window.location.origin).pathname;
    return decodeURIComponent(path.split("/").filter(Boolean).pop() ?? link);
  } catch {
    return link;
  }
}

export type { Language };
