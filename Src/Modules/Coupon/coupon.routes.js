import { Router } from "express";

import * as CouponControllers from "./coupon.controller.js";
import { asyncHandler } from "../../Utils/errorHandling.js";

import * as CouponValidators from "./coupon.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";

import isAuth from "../../Middlewares/authentication.js";
import couponApisRoles from "./coupon.endpoints.js";

const router = Router();

router.post(
  "/add",
  isAuth(couponApisRoles.COUPON_ROLES),
  validationCoreFunction(CouponValidators.addCouponValidation),
  asyncHandler(CouponControllers.addCoupon)
);

router.put(
  "/update/:couponId",
  isAuth(couponApisRoles.COUPON_ROLES),
  validationCoreFunction(CouponValidators.updateCouponValidation),
  asyncHandler(CouponControllers.updateCoupon)
);

router.get(
  "/get",
  isAuth(couponApisRoles.COUPON_ROLES),
  asyncHandler(CouponControllers.getAllCoupons)
);

router.delete(
  "/delete/:couponId",
  isAuth(couponApisRoles.COUPON_ROLES),
  validationCoreFunction(CouponValidators.deleteCouponValidation),
  asyncHandler(CouponControllers.deleteCoupon)
);

export default router;
