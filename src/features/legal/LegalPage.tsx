import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Markdown from "react-markdown";
import { ErrorState } from "@/ui/ErrorState";
import Logo from "@/assets/brand/logo-mark.svg?react";
import styles from "./LegalPage.module.scss";

export type LegalDocument = "terms" | "privacy";

const DOCUMENTS = {
  terms: {
    heading: "Afterhours Terms and Conditions",
    file: "/legal/terms-and-conditions.md",
  },
  privacy: {
    heading: "Afterhours Privacy Policy",
    file: "/legal/privacy-policy.md",
  },
} as const;

/**
 * Legal copy is authored as markdown in /public/legal and fetched at runtime, so
 * updating it is a file change rather than a code change.
 */
export default function LegalPage({ document: kind }: { document: LegalDocument }) {
  const { heading, file } = DOCUMENTS[kind];
  const [content, setContent] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setContent(null);
    setHasFailed(false);

    fetch(file, { signal: controller.signal })
      .then((response) => {
        // Without this check a 404 resolves happily and the server's HTML error
        // page gets rendered as if it were the legal text.
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        return response.text();
      })
      // The layout already renders the page heading, so drop the document's own.
      // Strip an optional BOM plus the document's own top-level heading — the
      // layout already renders the title, so keeping it would duplicate it.
      .then((text) => setContent(text.replace(/^\uFEFF?\s*#\s+.*(?:\r?\n)+/, "")))
      .catch(() => {
        if (controller.signal.aborted) return;
        // An empty document and a failed fetch are not the same thing; the old
        // version rendered both as a silently blank page.
        setHasFailed(true);
      });

    return () => controller.abort();
  }, [file, attempt]);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-[860px] flex-col px-6 py-10 tb:px-10 tb:py-14 lg:px-12">
      <div className="flex w-full items-center">
        <Link to="/" aria-label="Afterhours home">
          <Logo />
        </Link>
      </div>

      <div className="mt-10 flex flex-col gap-4">
        <h1 className="font-lora text-2xl font-bold text-color-primary tb:text-[32px]">
          {heading}
        </h1>

        {hasFailed ? (
          <ErrorState
            className="items-start text-left"
            message="We couldn't load this document right now."
            onRetry={() => setAttempt((n) => n + 1)}
          />
        ) : content === null ? (
          <p className="text-[15px] text-color-secondary-text">Loading…</p>
        ) : (
          <div className={styles.prose}>
            <Markdown
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noreferrer noopener">
                    {children}
                  </a>
                ),
              }}
            >
              {content}
            </Markdown>
          </div>
        )}
      </div>
    </div>
  );
}
