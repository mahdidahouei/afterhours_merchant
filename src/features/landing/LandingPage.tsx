import { Suspense, lazy } from "react";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Hero } from "./sections/Hero";

/*
 * Everything below the fold is code-split. The chunks start downloading as soon
 * as this page mounts — in parallel with the hero — and each section renders at
 * its natural height when its chunk lands.
 *
 * Deliberately NOT wrapped in a scroll-triggered mount: doing that made sections
 * swap from a placeholder to their real height mid-scroll, which shoved content
 * out of the viewport and read as the page jumping back to the top.
 */
const Complement = lazy(() =>
  import("./sections/Complement").then((m) => ({ default: m.Complement })),
);
const WhatWeDo = lazy(() =>
  import("./sections/WhatWeDo").then((m) => ({ default: m.WhatWeDo })),
);
const HowItWorks = lazy(() =>
  import("./sections/HowItWorks").then((m) => ({ default: m.HowItWorks })),
);
const WhoWeWorkWith = lazy(() =>
  import("./sections/WhoWeWorkWith").then((m) => ({ default: m.WhoWeWorkWith })),
);
const UseCase = lazy(() =>
  import("./sections/UseCase").then((m) => ({ default: m.UseCase })),
);
const Pricing = lazy(() =>
  import("./sections/Pricing").then((m) => ({ default: m.Pricing })),
);
const Community = lazy(() =>
  import("./sections/Community").then((m) => ({ default: m.Community })),
);
const Benefits = lazy(() =>
  import("./sections/Benefits").then((m) => ({ default: m.Benefits })),
);
const Faq = lazy(() => import("./sections/Faq").then((m) => ({ default: m.Faq })));

/** Section order is the page's narrative; keep edits to this list. */
const SECTIONS = [
  { id: "complement", Component: Complement },
  { id: "what-we-do", Component: WhatWeDo },
  { id: "how-it-works", Component: HowItWorks },
  { id: "who-we-work-with", Component: WhoWeWorkWith },
  { id: "use-case", Component: UseCase },
  { id: "pricing", Component: Pricing },
  { id: "community", Component: Community },
  { id: "benefits", Component: Benefits },
  { id: "faq", Component: Faq },
  { id: "footer", Component: Footer },
] as const;

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col gap-[100px] overflow-x-hidden bg-white pb-[100px] tb:gap-[120px] tb:px-[30px] lg:gap-[150px] lg:px-12 3xl:px-36">
      <Header />
      <Hero />

      {/* Each section is isolated: a chunk that fails to load, or a section that
          throws while rendering, collapses to nothing rather than blanking the
          whole page. The marketing site staying up matters more than any one
          section being present. */}
      <Suspense fallback={null}>
        {SECTIONS.map(({ id, Component }) => (
          <ErrorBoundary key={id} fallback={() => null}>
            <Component />
          </ErrorBoundary>
        ))}
      </Suspense>
    </main>
  );
}
