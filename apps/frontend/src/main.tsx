import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "@app/App";
import { ToastProvider } from "@app/ToastProvider";
import { AppStateProvider } from "@app/providers/AppStateProvider";
import "@shared/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <AppStateProvider>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </AppStateProvider>
);
