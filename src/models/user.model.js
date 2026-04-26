import { Schema } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
  {
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://placehold.co/400x600`,
        localPath: "",
      },
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    role: {
      type: String,
      enum: ["admin", "project_admin", "member"],
      default: "member",
    },
    refreshToken: {
      type: String,
    },

    forgotPasswordToken: {
      type: String,
    },

    forgotPasswordExpiry: {
      type: Date,
    },

    emailVerificationToken: {
      type: String,
    },

    emailVerificationExpiry: {
      type: Date,
    },
  },
  { timestamps: true },
);

//implemetation of pre-hook

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});
//implemetation of methods

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//JWT ACCESS TOKEN
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, username: this.username },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

//JWT REFRESH TOKEN
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

//Dataless Tokens
userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(24).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 10 * 60 * 1000; //10 minutes

  return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
