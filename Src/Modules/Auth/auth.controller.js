import { nanoid } from "nanoid";
import userModel from "../../../DataBase/Models/user.model.js";

import sendEmailService from "../../Services/sendEmail.js";
import emailTemplate from "../../Utils/emailTemplate.js";

import { generateToken, verifyToken } from "../../Utils/tokenFunctions.js";

import pkg from "bcrypt";

import { OAuth2Client } from "google-auth-library";

// ===================== Sign UP =================

const signUp = async (req, res, next) => {
  const { userName, email, password, age, gender, phoneNumber, address, role } =
    req.body;

  // Check if email is already exists
  const isEmailExists = await userModel.findOne({ email });
  if (isEmailExists) {
    return next(
      new Error("This Email is already exists, Please Choose a different one", {
        cause: 400,
      })
    );
  }

  // Generate Token
  const token = generateToken({
    payload: { email },
    signature: process.env.CONFIRM_EMAIL_TOKEN,
    expiresIn: "1h",
  });

  // Generate Confirmation Link
  const confirmationLink = `${req.protocol}://${req.headers.host}/auth/confirm/${token}`;

  // Send Confirmation Email
  const isEmailSent = sendEmailService({
    to: email,
    subject: "Confirmation Email",
    // message: `<a href=${confirmationLink}>Click here to Confirm Email</a>`,
    message: emailTemplate({
      link: confirmationLink,
      linkData: "Click here to Confirm Email",
      subject: "Confirmation Email",
    }),
  });
  if (!isEmailSent) {
    return next(
      new Error("Fail to send confirmation email, Please try again later", {
        cause: 400,
      })
    );
  }

  // Upload User Date on DataBase
  const userInstance = new userModel({
    userName,
    email,
    password,
    age,
    gender,
    phoneNumber,
    address,
    role,
  });
  await userInstance.save();

  if (!userInstance) {
    return next(
      new Error("Fail to add User, Please try again", { cause: 400 })
    );
  }
  res.status(200).json({ message: "User added successfully", userInstance });
};

// ===================== Confirm Email =================

const confirmEmail = async (req, res, next) => {
  const { token } = req.params;

  // Verify Token
  const decodeData = verifyToken({
    token,
    signature: process.env.CONFIRM_EMAIL_TOKEN,
  });

  // Update Conirmation status
  const user = await userModel.findOneAndUpdate(
    { email: decodeData.email, isConfirmed: false },
    { isConfirmed: true },
    { new: true }
  );
  if (!user) {
    return next(new Error("Already Confirmed", { cause: 400 }));
  }
  res.status(200).json({ message: "Email Confirmed Successfully", user });
};

// ===================== Sign IN =================

const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  // Check on email
  const userExists = await userModel.findOne({ email });
  if (!userExists) {
    return next(new Error("Invalid Login Credentials", { cause: 400 }));
  }

  // Check on Password
  const isPassMatch = pkg.compareSync(password, userExists.password);
  if (!isPassMatch) {
    return next(new Error("Invalid Login Credentials", { cause: 400 }));
  }

  // Generate Token
  const token = generateToken({
    payload: { email, Id: userExists._id, role: userExists.role },
    signature: process.env.SIGN_IN_TOKEN,
    expiresIn: "1h",
  });

  // Update User Status
  const updatedUser = await userModel.findOneAndUpdate(
    { email },
    { token, status: "Online" },
    { new: true }
  );
  if (!updatedUser) {
    return next(new Error("Fail to update user status", { cause: 400 }));
  }
  res.status(200).json({ message: "LoggedIn successfully", updatedUser });
};

// ===================== Forget Password =================

const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  // Check if user exists
  const findUser = await userModel.findOne({ email });
  if (!findUser) {
    return next(new Error("Invalid Email", { cause: 400 }));
  }

  // Generate code
  const code = nanoid();
  const hashedCode = pkg.hashSync(code, +process.env.SALT_ROUNDS);

  // Generate Token
  const token = generateToken({
    payload: { email, sentCode: hashedCode },
    signature: process.env.RESET_PASSWORD_TOKEN,
    expiresIn: "1h",
  });

  // Generate Reset Password Link
  const resetPasswordLink = `${req.protocol}://${req.headers.host}/auth/reset/${token}`;

  // Send Reset Password Link Email
  const isEmailSent = sendEmailService({
    to: email,
    subject: "Reset Password",
    message: emailTemplate({
      link: resetPasswordLink,
      linkData: "Click to Reset your Password",
      subject: "Reset Password Email",
    }),
  });
  if (!isEmailSent) {
    return next(
      new Error("Fail to send reset password email, please try again", {
        cause: 400,
      })
    );
  }

  // Update forget Code in DataBase
  const user = await userModel.findOneAndUpdate(
    { email },
    { forgetCode: hashedCode },
    { new: true }
  );
  res.status(200).json({ message: "Done", user });
};

// ===================== Reset Password =================

const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  // Verify Token
  const decodeData = verifyToken({
    token,
    signature: process.env.RESET_PASSWORD_TOKEN,
  });

  // Find User to Update his password
  const user = await userModel.findOne({
    email: decodeData.email,
    forgetCode: decodeData.sentCode,
  });
  if (!user) {
    return next(
      new Error("You already reset your password, Try to Login", { cause: 400 })
    );
  }

  // Check if password matchs the old password
  const isPassMatch = pkg.compareSync(newPassword, user.password);
  if (isPassMatch) {
    return next(
      new Error("This password matches the old password, Try a new password", {
        cause: 400,
      })
    );
  }

  // Update New Password
  user.password = newPassword;
  user.forgetCode = null;
  await user.save();

  res.status(200).json({ message: "Password updated successfully", user });
};

// ===================== Login with Gmail =================

const loginWithGmail = async (req, res, next) => {
  const client = new OAuth2Client();
  const { idToken } = req.body;
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { email_verified, email, name } = await verify();
  if (!email_verified) {
    return next(new Error("Invalid Email", { cause: 400 }));
  }
  const user = await userModel.findOne({ email, provider: "GOOGLE" });
  //=====>>>> Login if user found
  if (user) {
    // generate token
    const token = generateToken({
      payload: { email, Id: user._id, role: user.role },
      signature: process.env.SIGN_IN_TOKEN,
      expiresIn: "1h",
    });
    // update user status
    const updatedUser = await userModel.findOneAndUpdate(
      { email },
      { token, status: "Online" },
      { new: true }
    );
    if (!updatedUser) {
      return next(new Error("Fail to update user status", { cause: 400 }));
    }
    return res
      .status(200)
      .json({ message: "LoggedIn Successfully", updatedUser, token });
  }

  //=====>>>> SignUp if user not found
  const userObject = {
    userName: name,
    email,
    password: "defaultPassword",
    provider: "GOOGLE",
    isConfirmed: true,
    phoneNumber: " ",
    role: "User",
  };
  const newUser = await userModel.create(userObject);
  //generate token
  const token = generateToken({
    payload: { email: newUser.email, Id: newUser._id, role: newUser.role },
    signature: process.env.SIGN_IN_TOKEN,
    expiresIn: "1h",
  });
  newUser.token = token;
  newUser.status = "Online";
  await newUser.save();

  res.status(200).json({ message: "Verified", newUser });
};

export {
  signUp,
  confirmEmail,
  signIn,
  forgetPassword,
  resetPassword,
  loginWithGmail,
};
