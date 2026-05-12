import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { Task } from "../models/task.model.js";
import { Subtask } from "../models/subtask.model.js";
import { ProjectMember } from "../models/projectmember.model.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const getTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) throw new ApiError(404, "Project not found");

  const tasks = await Task.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("assignedTo", "username avatar fullName");

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "task has been fetched succesfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const task = await Task.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project:
            {_id: 1,
            username: 1,
            avatar: 1,
            fullName: 1,}
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: { $arrayElemAt: ["$createdBy", 0] },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "task not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task fetched succesfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, assignedTo } = req.body;
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) throw new ApiError(404, "Project not found");

  const files = req.files || [];
  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.originalname}`,
      mimeTypes: file.mimeType,
      size: file.size,
    };
  });
  const task = await Task.create({
    title,
    description,
    status,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task has been created"));
});

const updateTask = asyncHandler(async (req, res) => {});

const deleteTask = asyncHandler(async (req, res) => {});

const createSubtask = asyncHandler(async (req, res) => {});

const updateSubtask = asyncHandler(async (req, res) => {});

const deleteSubtask = asyncHandler(async (req, res) => {});

export {
  getTask,
  getTaskById,
  createTask,
  createSubtask,
  updateTask,
  updateSubtask,
  deleteTask,
  deleteSubtask,
};
