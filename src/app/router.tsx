import { lazy, Suspense, useEffect } from "react";
import {
  createBrowserRouter,
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router-dom";
import { ErrorBoundary } from "@/ui/ErrorBoundary";
import { trackPageView } from "./analytics";
import { ServiceWorkerPrompt } from "./ServiceWorkerPrompt";
import ErrorPage from "@/features/errors/ErrorPage";
import RouteErrorPage from "@/features/errors/RouteErrorPage";

/*
 * Every route is code-split. There is no spinner fallback on purpose: React
 * keeps the previous screen painted until the chunk resolves, which reads far
 * better than a flash of empty page on a fast connection.
 */
const LandingPage = lazy(() => import("@/features/landing/LandingPage"));
const ConnectPage = lazy(() => import("@/features/connect/ConnectPage"));
const SelfServicePage = lazy(() => import("@/features/self-service/SelfServicePage"));
const ContactPage = lazy(() => import("@/features/contact/ContactPage"));
const LegalPage = lazy(() => import("@/features/legal/LegalPage"));
const NotFoundPage = lazy(() => import("@/features/errors/NotFoundPage"));

function RootLayout() {
  const { pathname } = useLocation();

  useEffect(() => trackPageView(pathname), [pathname]);

  return (
    <>
      <ScrollRestoration />

      {/* Keyed on the path so navigating away from a crashed screen clears it. */}
      <ErrorBoundary resetKey={pathname} fallback={(error) => <ErrorPage error={error} />}>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>

      <ServiceWorkerPrompt />
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    // Catches failures thrown outside React's render pass (loaders, actions,
    // and route resolution) that the boundary above can't see.
    errorElement: <RouteErrorPage />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/connect", element: <ConnectPage /> },
      { path: "/claim", element: <SelfServicePage /> },
      { path: "/contact-us", element: <ContactPage /> },
      { path: "/terms-and-conditions", element: <LegalPage document="terms" /> },
      { path: "/privacy-policy", element: <LegalPage document="privacy" /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  // BASE_URL is "/" for the container and "/afterhours_merchant/" on Pages;
  // the router has to know, or every link points outside the deployment.
], { basename: import.meta.env.BASE_URL });
