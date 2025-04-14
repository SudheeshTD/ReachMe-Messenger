import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getMessages Controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// export const sendMessage = async (req, res) => {
//   try {
//     const { text, image } = req.body;
//     const { id: receiverId } = req.params;
//     const senderId = req.user._id;

//     if (!receiverId) {
//       return res.status(400).json({ message: "Receiver ID is required" });
//     }

//     let imageUrl;
//     if (image) {
//       const uploadResponse = await cloudinary.uploader.upload(image);
//       imageUrl = uploadResponse.secure_url;
//     }
//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       text,
//       image: imageUrl,
//     });

//     await newMessage.save();

//     //realtime Func(Socket.io)

//     const receiverSocketId = getReceiverSocketId(receiverId);
//     if (receiverSocketId) {
//       io.to(receiverSocketId).emit("newMessage", newMessage);
//     }

//     res.status(201).json(newMessage);
//   } catch (error) {
//     console.error("Error in SendMessage Controller:", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// backend/src/controllers/message.controller.js
export const sendMessage = async (req, res) => {
  try {
    const { text, image, temporaryId } = req.body; // Add temporaryId
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      temporaryId, // Add temporary ID field
    });

    await newMessage.save();

    // Socket.io notification
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Return both server ID and temporary ID
    res.status(201).json({
      ...newMessage.toObject(),
      temporaryId, // Include temporary ID in response
    });
  } catch (error) {
    console.error("Error in SendMessage Controller:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//New Code

// backend/src/controllers/message.controller.js

export const bulkCreateMessages = async (req, res) => {
  try {
    // Process images first if they exist
    const processedMessages = await Promise.all(
      req.body.messages.map(async (msg) => {
        let imageUrl;
        if (msg.image && msg.image.startsWith("data:")) {
          const uploadResponse = await cloudinary.uploader.upload(msg.image);
          imageUrl = uploadResponse.secure_url;
        }

        return {
          senderId: req.user._id,
          receiverId: msg.receiverId,
          text: msg.text,
          image: imageUrl || msg.image,
          temporaryId: msg.temporaryId || undefined, // 👈 Ensure tempId goes through
          status: "sent",
        };
      })
    );

    const createdMessages = await Message.insertMany(processedMessages);

    // Socket notifications
    const io = req.app.get("socketio");
    createdMessages.forEach((msg, index) => {
      msg.temporaryId = processedMessages[index].temporaryId; // 👈 map back
      const receiverSocketId = getReceiverSocketId(msg.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", msg);
      }
    });

    res.status(201).json(createdMessages);
  } catch (error) {
    res.status(500).json({ error: "Bulk create failed: " + error.message });
  }
};
