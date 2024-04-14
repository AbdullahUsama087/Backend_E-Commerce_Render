import { Router } from "express";

import * as authControllers from "./auth.controller.js";

import * as authValidators from "./auth.validation.js";
import { asyncHandler } from "../../Utils/errorHandling.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";

const router = Router();

router.post(
  "/signup",
  validationCoreFunction(authValidators.signUpValidation),
  asyncHandler(authControllers.signUp)
);

router.get("/confirm/:token", asyncHandler(authControllers.confirmEmail));

router.post(
  "/login",
  validationCoreFunction(authValidators.signInValidation),
  asyncHandler(authControllers.signIn)
);

router.post("/loginWithGmail", asyncHandler(authControllers.loginWithGmail));

router.patch(
  "/forget",
  validationCoreFunction(authValidators.forgetPasswordValidation),
  asyncHandler(authControllers.forgetPassword)
);

router.patch(
  "/reset/:token",
  validationCoreFunction(authValidators.resetPasswordValidation),
  asyncHandler(authControllers.resetPassword)
);

export default router;
