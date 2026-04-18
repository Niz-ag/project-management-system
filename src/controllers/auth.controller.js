import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { emailVerificationMailContent, sendMail } from "../utils/mail.js";
const generateAccessandRefreshToken = async (userId) => {
  try {
    const user = await User.findbyId(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.renerateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "something went wrong while generating tokens");
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
      `${req.protocol}://${req.get("host")}//api/v1/users/verify-email/${unHashedToken}`,
    ),
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser)
    throw new ApiError(500, "Something went wrong while regestering a user");

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

export { registerUser };
