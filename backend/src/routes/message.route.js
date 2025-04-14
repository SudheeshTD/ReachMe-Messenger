import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getUsersForSidebar,
  getMessages,
  sendMessage,
  bulkCreateMessages, //New File
} from "../controllers/message.controller.js";

const router = express.Router();

// Add this before existing routes
router.post("/bulk", protectRoute, bulkCreateMessages); // New File

router.get("/users", protectRoute, getUsersForSidebar);

router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);

export default router;
