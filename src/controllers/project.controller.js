import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { Project } from "../models/project.model.js";
import { ProjectMember } from "../models/projectmember.model.js";

const getProjects = asyncHandler(async (req,res) => {
    continue
})

const getProjectsById = asyncHandler(async (req,res) => {
    continue
})

const createProjects = asyncHandler(async (req,res) => {
    continue
})

const updateProjects = asyncHandler(async (req,res) => {
    continue
})

const deleteProjects = asyncHandler(async (req,res) => {
    continue
})
const addMembersToProjects = asyncHandler(async (req,res) => {
    continue
})
const getProjectMembers = asyncHandler(async (req,res) => {
    continue
})
const updateMemberRole = asyncHandler(async (req,res) => {
    continue
})

const deleteMembersFromProject = asyncHandler(async (req,res) => {
    continue
})

export  {getProjects,
    getProjectsById,
    createProjects,
    updateProjects,
    deleteProjects,
    addMembersToProjects,
    getProjectMembers,
    updateMemberRole,
    deleteMembersFromProject,
}