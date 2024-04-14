import { Router } from "express";

import * as cartControllers from "./cart.controller.js";
import { asyncHandler } from "../../Utils/errorHandling.js";

import * as cartValidators from "./cart.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";

import isAuth from "../../Middlewares/authentication.js";
import cartApisRoles from "./cart.endpoints.js";

const router = Router();

router.post(
  "/add",
  isAuth(cartApisRoles.CART_ROLES),
  validationCoreFunction(cartValidators.addToCartValidation),
  asyncHandler(cartControllers.addToCart)
);

router.delete(
  "/delete",
  isAuth(cartApisRoles.CART_ROLES),
  validationCoreFunction(cartValidators.deleteFromCartValidation),
  asyncHandler(cartControllers.deleteFromCart)
);

export default router;
