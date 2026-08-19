const mongoose = require("mongoose");
const jobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    attempts: {
      type: Number,
      default: 0,
    },

    scheduledAt: {
      type: Date,
      default: Date.now,
    },

    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const Job = mongoose.model("Job", jobSchema);
module.exports = Job;