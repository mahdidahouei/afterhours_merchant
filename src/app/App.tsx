import { RouterProvider } from "react-router-dom";
import { DialogProvider } from "./providers/DialogProvider";
import { QueryProvider } from "./providers/QueryProvider";
import { router } from "./router";

export default function App() {
  return (
    <QueryProvider>
      <DialogProvider>
        <RouterProvider router={router} />
      </DialogProvider>
    </QueryProvider>
  );
}
