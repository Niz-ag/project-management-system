import { mongo, Schema } from "mongoose";
import mongoose from "mongoose";
import { TaskStatusEnum, AvailableTaskStatus } from "../utils/constants.js";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: String,

    project: {
      type: Schema.Types.ObjectId(),
      ref: "Project",
      required: true,
    },

    assignedTo: {
      type: Schema.Types.ObjectId(),
      ref: "User",
    },

    assignedBy: {
      type: Schema.Types.ObjectId(),
      ref: "User",
    },
    status: {
      type: String,
      enum: AvailableTaskStatus,
      default: TaskStatusEnum.TODO,
    },

    attachment: {
      type: [{ url: String, MimeType: String, size: Number }],
      default: [],
    },
  },
  { timestamps: true },
);

export const task = mongoose.model("Task", taskSchema);
