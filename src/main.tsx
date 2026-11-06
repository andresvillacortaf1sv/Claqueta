import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initProjects } from "./lib/projects";
import "./styles/app.css";
import "./styles/editor.css";

// Inicializa el sistema de documentos (y migra el guion existente) antes de todo.
initProjects();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
