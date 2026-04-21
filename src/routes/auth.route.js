import { Router } from "express";
import { login, registerUser, logoutUser } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import {
  userLoginValidator,
  userRegisterValidator,
} from "../validators/index.js";
import { verfiyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator, validate, login);

//protected routes
router.route("/logout").post(verfiyJWT, logoutUser);

export default router;
