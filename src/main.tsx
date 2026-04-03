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

// Defer OneSignal to first user interaction to break critical request chain
let onesignalLoaded = false;
const loadOnesignal = () => {
  if (onesignalLoaded) return;
  onesignalLoaded = true;
  import('./lib/onesignal').then(m => m.initOneSignal());
};
['scroll', 'click', 'touchstart', 'keydown'].forEach(e => {
  addEventListener(e, loadOnesignal, { once: true, passive: true });
});
