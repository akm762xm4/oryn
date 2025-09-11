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

  // Join a personal room for direct emits
  socket.join(socket.userId.toString());

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
      const {
        conversationId,
        content,
        messageType = "text",
        imageUrl,
        replyTo,
      } = data;

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
        replyTo,
      });

      await message.save();
      await message.populate("sender", "username avatar");

      // Populate replyTo preview if present
      if (replyTo) {
        try {
          const replied = await Message.findById(replyTo).populate(
            "sender",
            "username"
          );
          if (replied) {
            message.replyTo = {
              _id: replied._id,
              content: replied.content,
              messageType: replied.messageType,
              imageUrl: replied.imageUrl,
              sender: {
                _id: replied.sender._id,
                username: replied.sender.username,
              },
            };
          }
        } catch {}
      }

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.updatedAt = new Date();
      await conversation.save();

      // Emit to all participants
      io.to(conversationId).emit("newMessage", message);

      // Immediately emit delivered to sender (message persisted)
      io.to(socket.id).emit("messageDelivered", {
        messageId: message._id.toString(),
        deliveredAt: new Date(),
      });

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

  // Toggle reaction on a message
  socket.on("toggleReaction", async ({ messageId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;
      // ensure participant
      const conversation = await Conversation.findById(message.conversation);
      if (!conversation || !conversation.participants.includes(socket.userId))
        return;

      const existing = (message.reactions || []).find((r) => r.emoji === emoji);
      if (!existing) {
        message.reactions = [
          ...(message.reactions || []),
          { emoji, users: [socket.userId] },
        ];
      } else {
        const idx = existing.users.findIndex(
          (u) => u.toString() === socket.userId
        );
        if (idx >= 0) {
          existing.users.splice(idx, 1);
        } else {
          existing.users.push(socket.userId);
        }
      }
      await message.save();
      await message.populate("sender", "username avatar");
      io.to(message.conversation.toString()).emit("reactionUpdated", {
        messageId: message._id.toString(),
        reactions: message.reactions,
      });
    } catch (e) {
      // ignore
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

        // Emit read status to room (so all participants update)
        io.to(conversationId).emit("messageRead", {
          messageId,
          readBy: socket.userId,
          readAt: new Date(),
        });

        // Notify the user's other sessions to clear unread badge for this conversation
        io.to(socket.userId.toString()).emit("conversationClearedUnread", {
          conversationId,
        });
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
