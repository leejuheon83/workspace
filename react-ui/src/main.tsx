import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SbsmcWorkspaceRedesign from "./SbsmcWorkspaceRedesign";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SbsmcWorkspaceRedesign />
  </StrictMode>
);
