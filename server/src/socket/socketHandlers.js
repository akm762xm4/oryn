import User from "../models/User.js";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";

const connectedUsers = new Map();
const typingUsers = new Map();

export const handleConnection = (io, socket) => {
  console.log(`User connected: ${socket.user.username}`);

  // Store user connection
  connectedUsers.set(socket.userId, socket.id);

  // Update user online status
  updateUserStatus(socket.userId, true);

  // Join user to their conversations
  joinUserRooms(socket);

  // Notify others about online status
  socket.broadcast.emit("userOnline", {
    userId: socket.userId,
    username: socket.user.username,
  });

  // Handle joining conversation
  socket.on("joinConversation", (conversationId) => {
    socket.join(conversationId);
  });

  // Handle leaving conversation
  socket.on("leaveConversation", (conversationId) => {
    socket.leave(conversationId);
  });

  // Handle new message
  socket.on("sendMessage", async (data) => {
    try {
      const { conversationId, content, messageType = "text", imageUrl } = data;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.includes(socket.userId)) {
        return socket.emit("error", { message: "Unauthorized" });
      }

      const message = new Message({
        conversation: conversationId,
        sender: socket.userId,
        content,
        messageType,
        imageUrl,
      });

      await message.save();
      await message.populate("sender", "username avatar");

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Emit to all participants
      io.to(conversationId).emit("newMessage", message);

      // Send push notification to offline users
      const offlineParticipants = conversation.participants.filter(
        (participantId) =>
          participantId.toString() !== socket.userId &&
          !connectedUsers.has(participantId.toString())
      );

      // Here you would implement push notifications for offline users
    } catch (error) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing", ({ conversationId, isTyping }) => {
    const typingKey = `${conversationId}-${socket.userId}`;

    if (isTyping) {
      typingUsers.set(typingKey, {
        userId: socket.userId,
        username: socket.user.username,
        conversationId,
      });
    } else {
      typingUsers.delete(typingKey);
    }

    // Emit typing status to other participants
    socket.to(conversationId).emit("userTyping", {
      userId: socket.userId,
      username: socket.user.username,
      isTyping,
    });

    // Clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        if (typingUsers.has(typingKey)) {
          typingUsers.delete(typingKey);
          socket.to(conversationId).emit("userTyping", {
            userId: socket.userId,
            username: socket.user.username,
            isTyping: false,
          });
        }
      }, 3000);
    }
  });

  // Handle message read status
  socket.on("markAsRead", async ({ conversationId, messageId }) => {
    try {
      const message = await Message.findById(messageId);
      if (
        message &&
        !message.readBy.some((read) => read.user.toString() === socket.userId)
      ) {
        message.readBy.push({
          user: socket.userId,
          readAt: new Date(),
        });
        await message.save();

        // Emit read status to sender
        const senderSocketId = connectedUsers.get(message.sender.toString());
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRead", {
            messageId,
            readBy: socket.userId,
            readAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username}`);

    // Remove from connected users
    connectedUsers.delete(socket.userId);

    // Update user offline status
    updateUserStatus(socket.userId, false);

    // Clear typing indicators
    for (const [key, typing] of typingUsers.entries()) {
      if (typing.userId === socket.userId) {
        typingUsers.delete(key);
        socket.to(typing.conversationId).emit("userTyping", {
          userId: socket.userId,
          username: socket.user.username,
          isTyping: false,
        });
      }
    }

    // Notify others about offline status
    socket.broadcast.emit("userOffline", {
      userId: socket.userId,
      username: socket.user.username,
      lastSeen: new Date(),
    });
  });
};

const updateUserStatus = async (userId, isOnline) => {
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: new Date(),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

const joinUserRooms = async (socket) => {
  try {
    const conversations = await Conversation.find({
      participants: socket.userId,
    }).select("_id");

    conversations.forEach((conv) => {
      socket.join(conv._id.toString());
    });
  } catch (error) {
    console.error("Error joining user rooms:", error);
  }
};
