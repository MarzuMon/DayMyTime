import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Defer OneSignal to idle time after page is fully loaded
if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(() => {
    import('./lib/onesignal').then(m => m.initOneSignal());
  });
} else {
  window.addEventListener('load', () => {
    setTimeout(() => {
      import('./lib/onesignal').then(m => m.initOneSignal());
    }, 3000);
  }, { once: true });
}
