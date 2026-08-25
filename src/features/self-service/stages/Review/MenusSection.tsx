import { cn } from "@/lib/cn";
import { Button } from "@/ui/Button";
import type { Menu, MenuFile, Profile } from "../../api/types";

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
  const setMenus = (menus: Menu[]) => update("menus", menus);

  const patchMenu = (index: number, patch: Partial<Menu>) =>
    setMenus(draft.menus.map((menu, i) => (i === index ? { ...menu, ...patch } : menu)));

  const patchFile = (menuIndex: number, fileIndex: number, patch: Partial<MenuFile>) =>
    patchMenu(menuIndex, {
      files: draft.menus[menuIndex].files.map((file, i) =>
        i === fileIndex ? { ...file, ...patch } : file,
      ),
    });

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
            <input
              type="text"
              value={menu.title}
              placeholder="Menu name"
              onChange={(event) => patchMenu(menuIndex, { title: event.target.value })}
              className="min-w-0 flex-1 rounded-[10px] border border-color-border bg-white px-3 py-2 font-satoshi text-sm font-semibold outline-none focus:border-[color:var(--color-field-focus)]"
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
                        onClick={() => patchFile(menuIndex, fileIndex, { type: type.value })}
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
                    <input
                      type="text"
                      value={file.title ?? ""}
                      placeholder="File name"
                      onChange={(event) =>
                        patchFile(menuIndex, fileIndex, {
                          title: event.target.value.trim() || null,
                        })
                      }
                      className="min-w-0 rounded-[10px] border border-color-border px-3 py-2 font-satoshi text-sm outline-none focus:border-[color:var(--color-field-focus)] tb:w-[40%]"
                    />
                    <input
                      type="url"
                      inputMode="url"
                      value={file.link}
                      placeholder="https://…"
                      onChange={(event) =>
                        patchFile(menuIndex, fileIndex, { link: event.target.value })
                      }
                      className="min-w-0 flex-1 rounded-[10px] border border-color-border px-3 py-2 font-satoshi text-sm outline-none focus:border-[color:var(--color-field-focus)]"
                    />
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

export type { Language };
