import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";

const NetworkStatus = () => {
  const isOnline = useAuthStore((state) => state.isOnline);

  useEffect(() => {
    if (!isOnline) {
      toast("Working offline - messages will send when online", {
        icon: "⚠️",
        duration: Infinity,
        id: "network-status",
      });
    } else {
      toast.dismiss("network-status");
    }
  }, [isOnline]);

  return null;
};

export default NetworkStatus;
