import { mongo, Schema } from "mongoose";
import mongoose from "mongoose";
import { TaskStatusEnum, AvailableTaskStatus } from "../utils/constants.js";

const subtaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },

    isCompleted: {
      type: Boolean,
      default: false,
    },

    CreatedBy: {
      type: Schema.Types.ObjectId(),
      ref: "User",
    },
  },
  { timestamps: true },
);

export const subtask = mongoose.model("Subtask", subtaskSchema);
