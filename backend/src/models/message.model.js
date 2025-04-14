import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    temporaryId: String, // New field
    status: {
      type: String,
      enum: ["sent", "delivered", "local"],
      default: "sent",
    }, //New Field
  },
  { timestamps: true }
);
const Message = mongoose.model("Message", messageSchema);

export default Message;
