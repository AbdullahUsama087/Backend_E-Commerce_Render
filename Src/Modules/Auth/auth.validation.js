import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";
import systemRoles from "../../Utils/systemRoles.js";

const signUpValidation = {
  body: Joi.object({
    userName: Joi.string().max(20).required(),
    email: generalFields.email.required(),
    password: generalFields.password.required(),
    age: Joi.number().positive().integer().optional(),
    gender: Joi.string().valid("Male", "Female").optional(),
    phoneNumber: Joi.string()
      .length(11)
      .regex(/^01[0125][0-9]{8}$/m)
      .required(),
    address: Joi.array()
      .items(Joi.string().min(3).max(25).required())
      .required(),
    role: Joi.string()
      .valid(systemRoles.SUPER_ADMIN, systemRoles.ADMIN, systemRoles.USER)
      .required(),
  }).required(),
};

const signInValidation = {
  body: Joi.object({
    email: generalFields.email,
    password: generalFields.password,
  })
    .required()
    .options({ presence: "required" }),
};

const forgetPasswordValidation = {
  body: Joi.object({
    email: generalFields.email,
  })
    .required()
    .options({ presence: "required" }),
};

const resetPasswordValidation = {
  body: Joi.object({
    newPassword: generalFields.password,
  })
    .required()
    .options({ presence: "required" }),
};

export {
  signUpValidation,
  signInValidation,
  forgetPasswordValidation,
  resetPasswordValidation,
};
