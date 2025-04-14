import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";
import { db } from "../lib/db";

const convertImageForOfflineStorage = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Image conversion failed:", error);
    return imageUrl; // Fallback to original URL
  }
};

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  // Add these actions:
  loadLocalMessages: async (receiverId) => {
    const messages = await db.messages
      .where("receiverId")
      .equals(receiverId)
      .sortBy("createdAt");
    set({ messages });
  },

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  // getMessages: async (userId) => {
  //   set({ isMessagesLoading: true });
  //   try {
  //     const res = await axiosInstance.get(`/messages/${userId}`);
  //     set({ messages: res.data });
  //   } catch (error) {
  //     toast.error(error.response.data.message);
  //   } finally {
  //     set({ isMessagesLoading: false });
  //   }
  // },

  // When fetching messages from server
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);

      // Process images for offline storage
      const processedMessages = await Promise.all(
        res.data.map(async (msg) => {
          if (msg.image) {
            const offlineImage = await convertImageForOfflineStorage(msg.image);
            return { ...msg, offlineImage };
          }
          return msg;
        })
      );

      // Store in local DB
      await db.messages.bulkPut(processedMessages);
      set({ messages: processedMessages });
    } catch (error) {
      // If offline, get from local DB
      if (!navigator.onLine) {
        const localMessages = await db.messages
          .where("receiverId")
          .equals(userId)
          .or("senderId")
          .equals(userId)
          .sortBy("createdAt");
        set({ messages: localMessages });
      } else {
        toast.error(error.response?.data?.message || "Failed to load messages");
      }
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // sendMessage: async (messageData) => {
  //   const { selectedUser, messages } = get();
  //   try {
  //     const res = await axiosInstance.post(
  //       `/messages/send/${selectedUser._id}`,
  //       messageData
  //     );
  //     set({ messages: [...messages, res.data] });
  //   } catch (error) {
  //     toast.error(error.response.data.message);
  //   }
  // },

  sendMessage: async (messageData) => {
    const { authUser, isOnline } = useAuthStore.getState();
    const { selectedUser, messages } = get();

    const tempMessage = {
      ...messageData,
      temporaryId: Date.now().toString(),
      senderId: authUser._id,
      receiverId: selectedUser._id,
      status: "local",
      createdAt: new Date(),
    };

    // Local update
    await db.messages.add(tempMessage);
    set({ messages: [...messages, tempMessage] });

    if (isOnline) {
      try {
        const res = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
          {
            ...messageData,
            temporaryId: tempMessage.temporaryId,
          }
        );

        // Update local record
        await db.messages.update(tempMessage.id, {
          _id: res.data._id,
          status: "sent",

          image: res.data.image || tempMessage.image, // Check image updated
        });
      } catch (error) {
        await db.messages.update(tempMessage.id, { status: "error" });
      }
    }
  },

  syncMessages: async () => {
    const { authUser } = useAuthStore.getState();

    if (!authUser) {
      console.log("Skipping sync - no authenticated user");
      return;
    }

    const unsentMessages = await db.messages
      .where("status")
      .anyOf(["local", "error"])
      .toArray();

    try {
      const res = await axiosInstance.post(
        "/messages/bulk",
        {
          messages: unsentMessages.map((msg) => ({
            ...msg,
            senderId: authUser._id, // Add sender ID
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${authUser.token}`, // Add if using JWT
          },
        }
      );

      // Update local messages
      await Promise.all(
        res.data.map((serverMsg) =>
          db.messages
            .where("temporaryId")
            .equals(serverMsg.temporaryId)
            .modify({
              _id: serverMsg._id,
              status: "sent",
              image: serverMsg.image,
            })
        )
      );
    } catch (error) {
      if (error.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      console.error("Sync failed:", error);
    }
  },

  initializeMessages: async (userId) => {
    try {
      // First load messages from local DB
      const localMessages = await db.messages
        .where("receiverId")
        .equals(userId)
        .or("senderId")
        .equals(userId)
        .sortBy("createdAt");

      set({ messages: localMessages });

      // Then fetch from server if online
      if (navigator.onLine) {
        const res = await axiosInstance.get(`/messages/${userId}`);

        // Find messages in server response not in local DB
        const localIds = new Set(
          localMessages.map((msg) => msg._id).filter(Boolean)
        );
        const newMessages = res.data.filter((msg) => !localIds.has(msg._id));

        // Add new messages to local DB
        await db.messages.bulkAdd(newMessages);

        // Update state with combined set
        set({
          messages: [...localMessages, ...newMessages].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          ),
        });
      }
    } catch (error) {
      console.error("Error initializing messages:", error);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return; // Prevents error when socket is null

    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;
      set({ messages: [...get().messages, newMessage] });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return; // Prevents error when socket is null
    socket.off("newMessage");
  },

  //Todo Optimize this
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
