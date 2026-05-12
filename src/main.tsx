import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import AppErrorBoundary from "@/components/shared/AppErrorBoundary";

window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global runtime error", {
    message,
    source,
    lineno,
    colno,
    error,
  });
  return false;
};

window.onunhandledrejection = (event) => {
<<<<<<< HEAD
  console.error("Unhandled promise rejection", event.reason); 
=======
  console.error("Unhandled promise rejection", event.reason);
>>>>>>> 67d1e15f2fd66c27748766bdee559c6aee16d96e
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element with id "root" was not found.');
}

createRoot(rootElement).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
