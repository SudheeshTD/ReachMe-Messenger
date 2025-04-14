import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { db } from "../lib/db";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  isOnline: navigator.onLine,

  // Add actions:
  cacheUser: async (user) => {
    await db.table("users").put(user);
  },

  getCachedUser: async () => {
    return await db.table("users").toCollection().first();
  },

  // checkAuth: async () => {
  //   try {
  //     const res = await axiosInstance.get("/auth/check");

  //     set({ authUser: res.data });
  //     get().connectSocket();
  //   } catch (error) {
  //     console.log("Error in checkAuth:", error);
  //     set({ authUser: null });
  //   } finally {
  //     set({ isCheckingAuth: false });
  //   }
  // },

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      await db.table("users").put(res.data); // Cache user
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      const cachedUser = await db.table("users").toCollection().first();
      set({ authUser: cachedUser || null }); // Fallback to cached
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true }); // Changed from usSignUp to isSigningUp
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      await db.table("users").put(res.data);
      toast.success("Account Created Successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      await db.table("users").put(res.data);
      toast.success("Login Successful");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      const updatedUser = res.data;
      set({ authUser: updatedUser });
      await db.table("users").put(updatedUser); // Add this line
      toast.success("Profile Picture Updated successfully");
    } catch (error) {
      console.log("Error in uploading Profile:", error);
      console.log(error.response.data.message);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      // getOnlineUsers shoud be same as the socketIO emit name
      set({ onlineUsers: userIds });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket?.disconnect();
  },
}));
