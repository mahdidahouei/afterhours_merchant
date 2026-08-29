import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import { reloadOnStaleChunk } from "./app/reloadOnStaleChunk";
import "./styles/global.css";

// Before render: a chunk can fail on the very first lazy route.
reloadOnStaleChunk();

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
