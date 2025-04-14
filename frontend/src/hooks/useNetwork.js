// frontend/src/hooks/useNetwork.js
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

export const useNetwork = () => {
  useEffect(() => {
    const handleStatusChange = () => {
      useAuthStore.setState({ isOnline: navigator.onLine });
      if (navigator.onLine) useChatStore.getState().syncMessages();
    };

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
      window.removeEventListener("online", handleStatusChange);
      window.removeEventListener("offline", handleStatusChange);
    };
  }, []);
};
