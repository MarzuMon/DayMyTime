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
const initOnesignal = () => {
  import('./lib/onesignal').then(m => m.initOneSignal());
};

if ('requestIdleCallback' in globalThis) {
  requestIdleCallback(initOnesignal);
} else {
  globalThis.addEventListener('load', () => {
    setTimeout(initOnesignal, 3000);
  }, { once: true });
}
