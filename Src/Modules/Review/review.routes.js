import { Router } from "express";

import * as reviewControllers from "./review.controller.js";
import { asyncHandler } from "../../Utils/errorHandling.js";

import * as reviewValidators from "./review.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";

import { isAuth } from "../../Middlewares/authentication.js";

import reviewApisRoles from "./review.endpoints.js";

const router = Router();

router.post(
  "/add",
  isAuth(reviewApisRoles.REVIEW_ROLES),
  validationCoreFunction(reviewValidators.addReviewValidation),
  asyncHandler(reviewControllers.addReview)
);

router.put(
  "/update",
  isAuth(reviewApisRoles.REVIEW_ROLES),
  validationCoreFunction(reviewValidators.addReviewValidation),
  asyncHandler(reviewControllers.updateReview)
);

router.get("/get", asyncHandler(reviewControllers.getAllProductsWithReview));

router.delete(
  "/delete",
  isAuth(reviewApisRoles.REVIEW_ROLES),
  validationCoreFunction(reviewValidators.deleteReviewValidation),
  asyncHandler(reviewControllers.deleteReview)
);

export default router;
