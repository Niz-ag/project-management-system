import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import {
  emailVerificationMailContent,
  forgotPasswordMailContent,
  sendMail,
} from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating tokens",
      error,
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password, role } = req.body;

  const ExistedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (ExistedUser) {
    throw new ApiError(409, "User already exists", []);
  }

  const user = await User.create({
    email,
    username,
    password,
    role: role || "member",
    isEmailVerified: false,
  });

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify you email.",
    mailgenContent: emailVerificationMailContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser)
    throw new ApiError(500, "Something went wrong while registering a user");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User has been registered successfully and verification email has been sent",
      ),
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) throw new ApiError(400, "email is required");
  const user = await User.findOne({ email });

  if (!user) throw new ApiError(400, "user not found");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid credentials");
  const { accessToken, refreshToken } = await generateAccessandRefreshToken(
    user._id,
  );

  const loggedinUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true,
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params;

  if (!verificationToken) {
    throw new ApiError(400, "email verification token is missing");
  }

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });
  if (!user) throw new ApiError(400, "Token is invalid or expired");

  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true,
      },
      "email is verified",
    ),
  );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new ApiError(404, "User does not exist");
  if (user.isEmailVerified)
    throw new ApiError(409, "Email is already verified");

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Please verify you email.",
    mailgenContent: emailVerificationMailContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`,
    ),
  });
  return res.status(200).json(new ApiResponse(200, {}, "Mail has been sent"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Token");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessandRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "access token refreshed",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh Token");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, " User does not exist", []);
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  await sendMail({
    email: user?.email,
    subject: "Password reset request.",
    mailgenContent: forgotPasswordMailContent(
      user.username,
      `${req.protocol}://${req.get("host")}/${process.env.FORGOT_PASSWORD_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password Mail has been sent on your email address",
      ),
    );
});

const resetForgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  let hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(401, "Token is expired", {});

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password", {});
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

// const getCurrentUser = asyncHandler(async (req,res) => {})
export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
};
