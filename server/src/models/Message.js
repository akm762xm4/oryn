import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "ai"],
      default: "text",
    },
    imageUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isAI: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

// Reply reference
messageSchema.add({
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
});

// Reactions: array of { emoji, users: [ObjectId] }
messageSchema.add({
  reactions: [
    {
      emoji: { type: String },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
});

export default mongoose.model("Message", messageSchema);
