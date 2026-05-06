import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import { ProjectMember } from "../models/projectmember.model.js";
import mongoose from "mongoose";

export const validateProjectPermission = (roles = []) => {
  asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    if (!projectId) throw new ApiError(404, "project not found");
    const project = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(user._id),
    });

    if (!project) throw new ApiError(404, "project not found");

    const givenRole = project?.role;
    req.user.role = givenRole;

    if (!roles.includes(givenRole))
      throw new ApiError(403, "You do not have given permissions");
    next();
  });
};
