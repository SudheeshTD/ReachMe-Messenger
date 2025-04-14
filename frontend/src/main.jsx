// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";
// import { BrowserRouter } from "react-router-dom";

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </StrictMode>
// );

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useNetwork } from "./hooks/useNetwork";
import NetworkStatus from "./components/NetworkStatus";
import { useEffect } from "react";
import { useChatStore } from "./store/useChatStore.js";

// New wrapper component for initializations
const InitWrapper = () => {
  // Initialize network detection
  useNetwork();

  // Load cached user on mount
  useEffect(() => {
    const loadCachedUser = async () => {
      const user = await useAuthStore.getState().getCachedUser();
      if (user) {
        useAuthStore.setState({ authUser: user });
      }
    };
    loadCachedUser();
  }, []);

  // Setup periodic sync
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        useChatStore.getState().syncMessages();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <StrictMode>
        <NetworkStatus />
        <App />
      </StrictMode>
    </>
  );
};

// Service worker registration

if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  //
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => console.log("SW registered:", reg))
      .catch((err) => console.log("SW registration failed:", err));
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <InitWrapper />
    </BrowserRouter>
  </StrictMode>
);
