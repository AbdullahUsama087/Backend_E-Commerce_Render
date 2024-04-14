import mongoose, { Schema } from "mongoose";

import pkg from "bcrypt";
import systemRoles from "../../Src/Utils/systemRoles.js";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: String,
      default: systemRoles.USER,
      enum: [systemRoles.USER, systemRoles.ADMIN, systemRoles.SUPER_ADMIN],
      required: true,
    },
    address: [
      {
        type: String,
        required: true,
      },
    ],
    profilePicture: {
      secure_url: {
        type: String,
        // required: true,
      },
      public_id: {
        type: String,
        // required: true,
      },
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Offline",
      enum: ["Offline", "Online"],
    },
    gender: {
      type: String,
      default: "Not Specified",
      enum: ["Male", "Female", "Not Specified"],
    },
    age: Number,
    token: String,
    forgetCode: String,
    provider: {
      type: String,
      default: "System",
      enum: ["System", "GOOGLE", "facebook"],
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next, hash) {
  this.password = pkg.hashSync(this.password, +process.env.SALT_ROUNDS);
  next();
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
