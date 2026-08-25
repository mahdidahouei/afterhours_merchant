import { useRouteError } from "react-router-dom";
import ErrorPage from "./ErrorPage";

/**
 * Router `errorElement`. Exists only so `useRouteError` is called somewhere it
 * is guaranteed to be valid, keeping ErrorPage itself free of router context.
 */
export default function RouteErrorPage() {
  return <ErrorPage error={useRouteError()} source="route" />;
}
