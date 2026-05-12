import { Router } from "express";

import {
  getProjects,
  getProjectsById,
  createProjects,
  updateProjects,
  deleteProjects,
  addMembersToProjects,
  getProjectMembers,
  updateMemberRole,
  deleteMembersFromProject,
} from "../controllers/project.controller.js";

import {
  addMembertoProjectValidator,
  createProjectValidator,
} from "../validators/index.js";

import { validate } from "../middlewares/validator.middleware.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validateProjectPermission } from "../middlewares/project.middleware.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT); //middleware for protected routes

router
  .route("/")
  .get(getProjects)
  .post(createProjectValidator(), validate, createProjects);

router
  .route("/:projectId")
  .get(validateProjectPermission(AvailableUserRole), getProjectsById)
  .put(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    createProjectValidator(),
    validate,
    updateProjects,
  )
  .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProjects);

router
  .route("/:projectId/members/")
  .get(getProjectMembers)
  .post(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    addMembertoProjectValidator(),
    validate,
    addMembersToProjects,
  );

router
  .route("/:projectId/members/:userId")
  .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
  .delete(
    validateProjectPermission([UserRolesEnum.ADMIN]),
    deleteMembersFromProject,
  );

export default router;
