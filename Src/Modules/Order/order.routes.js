import { Router } from "express";

import * as orderControllers from "./order.controller.js";
import { asyncHandler } from "../../Utils/errorHandling.js";

import * as orderValidators from "./order.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";

import { isAuth } from "../../Middlewares/authentication.js";
import orderApisRoles from "./order.endpoints.js";

const router = Router();

router.post(
  "/create",
  isAuth(orderApisRoles),
  validationCoreFunction(orderValidators.createOrderValidation),
  asyncHandler(orderControllers.createOrder)
);

router.post(
  "/orderFromCart/:cartId",
  isAuth(orderApisRoles.ORDER_ROLES),
  validationCoreFunction(orderValidators.orderFromCartValidation),
  asyncHandler(orderControllers.orderFromCart)
);

router.get("/successOrder", asyncHandler(orderControllers.successPayment));

router.patch("/cancelOrder", asyncHandler(orderControllers.cancelPayment));

router.post(
  "/deliver",
  isAuth(orderApisRoles.DELIVER_ORDER),
  validationCoreFunction(orderValidators.deliverOrderValidation),
  asyncHandler(orderControllers.deliverOrder)
);

export default router;
