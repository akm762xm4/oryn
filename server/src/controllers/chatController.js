import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { generateAIResponse } from "../utils/openRouter.js";

// Special ObjectId for AI Assistant
const AI_USER_ID = new mongoose.Types.ObjectId("000000000000000000000000");

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    // Add virtual AI participant to AI conversations
    const conversationsWithAI = conversations.map((conv) => {
      if (conv.isAI) {
        return {
          ...conv.toObject(),
          participants: [
            ...conv.participants,
            {
              _id: "ai-assistant",
              username: "AI Assistant",
              email: "ai@chatapp.com",
              avatar: "",
              isOnline: true,
              lastSeen: new Date(),
            },
          ],
        };
      }
      return conv;
    });

    res.json(conversationsWithAI);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { participantId, isGroup, groupName, isAI } = req.body;

    // Handle AI conversation creation
    if (isAI) {
      // Check if AI conversation already exists for this user
      const existingAIConversation = await Conversation.findOne({
        participants: req.user._id,
        isAI: true,
      });

      if (existingAIConversation) {
        await existingAIConversation.populate(
          "participants",
          "username avatar isOnline lastSeen"
        );

        // Add virtual AI participant to response
        const aiConversationWithAI = {
          ...existingAIConversation.toObject(),
          participants: [
            ...existingAIConversation.participants,
            {
              _id: "ai-assistant",
              username: "AI Assistant",
              email: "ai@chatapp.com",
              avatar: "",
              isOnline: true,
              lastSeen: new Date(),
            },
          ],
        };

        return res.json(aiConversationWithAI);
      }

      // Create new AI conversation with only current user (AI participant added virtually)
      const aiConversation = new Conversation({
        participants: [req.user._id],
        isGroup: false,
        groupName: "AI Assistant",
        isAI: true,
      });

      await aiConversation.save();
      await aiConversation.populate(
        "participants",
        "username avatar isOnline lastSeen"
      );

      // Add virtual AI participant to response
      const aiConversationWithAI = {
        ...aiConversation.toObject(),
        participants: [
          ...aiConversation.participants,
          {
            _id: "ai-assistant",
            username: "AI Assistant",
            email: "ai@chatapp.com",
            avatar: "",
            isOnline: true,
            lastSeen: new Date(),
          },
        ],
      };

      return res.status(201).json(aiConversationWithAI);
    }

    if (!isGroup) {
      // Validate that participantId is different from current user
      if (participantId === req.user._id.toString()) {
        return res.status(400).json({
          message: "Cannot create conversation with yourself",
        });
      }

      // Check if conversation already exists
      const existingConversation = await Conversation.findOne({
        participants: { $all: [req.user._id, participantId], $size: 2 },
        isGroup: false,
      });

      if (existingConversation) {
        await existingConversation.populate(
          "participants",
          "username avatar isOnline lastSeen"
        );
        return res.json(existingConversation);
      }
    }

    const participants = isGroup
      ? [req.user._id, ...participantId]
      : [req.user._id, participantId];

    // Additional validation for non-group conversations
    if (!isGroup && participants.length !== 2) {
      return res.status(400).json({
        message: "Direct conversation must have exactly 2 participants",
      });
    }

    // Check for duplicate participants
    const uniqueParticipants = [
      ...new Set(participants.map((p) => p.toString())),
    ];
    if (uniqueParticipants.length !== participants.length) {
      return res.status(400).json({
        message: "Cannot have duplicate participants in conversation",
      });
    }

    const conversation = new Conversation({
      participants: uniqueParticipants,
      isGroup,
      groupName,
      admin: isGroup ? req.user._id : undefined,
    });

    await conversation.save();
    await conversation.populate(
      "participants",
      "username avatar isOnline lastSeen"
    );

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50, sort = "desc" } = req.query;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Parse limit to number and apply reasonable bounds
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 100);
    const parsedPage = Math.max(parseInt(page), 1);

    // Determine sort order based on sort parameter
    const sortOrder = sort === "asc" ? 1 : -1;

    // Optimized query with lean() for better performance
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: sortOrder })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .lean(); // Use lean() for better performance

    // Get unique sender IDs for batch population
    const senderIds = [
      ...new Set(messages.map((msg) => msg.sender.toString())),
    ].filter((id) => id !== AI_USER_ID.toString());

    // Batch fetch users for better performance
    const users = await User.find({ _id: { $in: senderIds } })
      .select("username avatar")
      .lean();

    // Create a map for quick user lookup
    const userMap = users.reduce((map, user) => {
      map[user._id.toString()] = user;
      return map;
    }, {});

    // Populate messages with sender data
    const populatedMessages = messages.map((message) => {
      if (message.sender.toString() === AI_USER_ID.toString() || message.isAI) {
        // Handle AI messages with virtual AI user
        return {
          ...message,
          sender: {
            _id: "ai-assistant",
            username: "AI Assistant",
            avatar: "",
          },
        };
      } else {
        // Handle regular user messages
        const sender = userMap[message.sender.toString()];
        return {
          ...message,
          sender: sender || {
            _id: message.sender,
            username: "Unknown",
            avatar: "",
          },
        };
      }
    });

    // For reverse pagination (desc sort), return messages as-is (newest first)
    // For normal pagination (asc sort), reverse to show oldest first
    const finalMessages =
      sort === "desc" ? populatedMessages : populatedMessages.reverse();

    // Add cache headers for better performance (cache for 1 minute)
    res.set("Cache-Control", "private, max-age=60");

    res.json(finalMessages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      content,
      messageType = "text",
      imageUrl,
    } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = new Message({
      conversation: conversationId,
      sender: req.user._id,
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

    // If this is an AI conversation, automatically generate AI response
    if (conversation.isAI && messageType === "text") {
      try {
        // Get recent messages for context
        const recentMessages = await Message.find({
          conversation: conversationId,
        })
          .sort({ createdAt: -1 })
          .limit(10);

        const aiResponse = await generateAIResponse(content, recentMessages);

        // Create a virtual AI user for the message
        const aiUser = {
          _id: AI_USER_ID,
          username: "AI Assistant",
          avatar: "",
        };

        const aiMessage = new Message({
          conversation: conversationId,
          sender: AI_USER_ID, // Use special AI assistant ObjectId as sender
          content: aiResponse,
          messageType: "ai",
          isAI: true,
        });

        await aiMessage.save();

        // Manually populate the sender with AI user data since it's not in the database
        aiMessage.sender = aiUser;

        // Update conversation with AI message
        conversation.lastMessage = aiMessage._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Return both messages
        return res.status(201).json({
          userMessage: message,
          aiMessage: aiMessage,
        });
      } catch (aiError) {
        console.error("AI response error:", aiError);
        // Still return the user message even if AI fails
      }
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q ?? req.query.query ?? "").toString();

    const baseFilter = { _id: { $ne: req.user._id } };
    const textFilter = q
      ? {
          $or: [
            { username: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({
      ...baseFilter,
      ...textFilter,
    })
      .select("username email avatar isOnline lastSeen")
      .sort(q ? { username: 1 } : { isOnline: -1, lastSeen: -1 })
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;

    const searchFilter = {
      content: { $regex: query, $options: "i" },
    };

    if (conversationId) {
      searchFilter.conversation = conversationId;
    } else {
      // Search in user's conversations only
      const userConversations = await Conversation.find({
        participants: req.user._id,
      }).select("_id");

      searchFilter.conversation = {
        $in: userConversations.map((conv) => conv._id),
      };
    }

    const messages = await Message.find(searchFilter)
      .populate("conversation", "participants isGroup groupName")
      .sort({ createdAt: -1 })
      .limit(20);

    // Manually populate senders, handling AI messages specially
    const populatedMessages = await Promise.all(
      messages.map(async (message) => {
        if (
          message.sender.toString() === AI_USER_ID.toString() ||
          message.isAI
        ) {
          // Handle AI messages with virtual AI user
          return {
            ...message.toObject(),
            sender: {
              _id: "ai-assistant",
              username: "AI Assistant",
              avatar: "",
            },
          };
        } else {
          // Handle regular user messages
          await message.populate("sender", "username avatar");
          return message;
        }
      })
    );

    res.json(populatedMessages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const sendAIMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify this is an AI conversation
    if (!conversation.isAI) {
      return res
        .status(400)
        .json({ message: "This is not an AI conversation" });
    }

    // Get recent messages for context
    const recentMessages = await Message.find({
      conversation: conversationId,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const aiResponse = await generateAIResponse(message, recentMessages);

    const aiMessage = new Message({
      conversation: conversationId,
      sender: req.user._id,
      content: aiResponse,
      messageType: "ai",
      isAI: true,
    });

    await aiMessage.save();
    await aiMessage.populate("sender", "username avatar");

    // Update conversation
    conversation.lastMessage = aiMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.status(201).json(aiMessage);
  } catch (error) {
    console.error("AI message error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Debug endpoint to check conversation data
export const debugConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "username avatar isOnline lastSeen")
      .sort({ updatedAt: -1 });

    const debugInfo = conversations.map((conv) => ({
      _id: conv._id,
      participants: conv.participants.map((p) => ({
        _id: p._id,
        username: p.username,
        email: p.email,
      })),
      isGroup: conv.isGroup,
      currentUserId: req.user._id,
      currentUsername: req.user.username,
    }));

    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Clear all messages in a conversation
export const clearMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Delete all messages in the conversation
    const deleteResult = await Message.deleteMany({
      conversation: conversationId,
    });

    // Update conversation to remove lastMessage reference
    conversation.lastMessage = null;
    conversation.updatedAt = new Date();
    await conversation.save();

    res.json({
      message: "Chat cleared successfully",
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Clear messages error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a conversation
export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    res.json({ message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Toggle pin conversation
export const togglePinConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.pinnedAt = conversation.pinnedAt ? null : new Date();
    await conversation.save();

    res.json({ message: "Pin updated", pinnedAt: conversation.pinnedAt });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
// Fix conversations with duplicate participants
export const fixDuplicateConversations = async (req, res) => {
  try {
    // Find conversations with duplicate participants
    const conversations = await Conversation.find({
      isGroup: false,
      isAI: false,
    });

    let fixedCount = 0;
    const problematicConversations = [];

    for (const conv of conversations) {
      const participantIds = conv.participants.map((p) => p.toString());
      const uniqueParticipants = [...new Set(participantIds)];

      if (participantIds.length !== uniqueParticipants.length) {
        problematicConversations.push({
          _id: conv._id,
          participants: participantIds,
          uniqueParticipants,
        });

        // Delete conversations with duplicate participants
        await Conversation.findByIdAndDelete(conv._id);
        fixedCount++;
      }
    }

    res.json({
      message: `Fixed ${fixedCount} conversations with duplicate participants`,
      problematicConversations,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
