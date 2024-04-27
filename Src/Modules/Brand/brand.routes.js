import { Router } from "express";

import * as BrandControllers from "./brand.controller.js";

import * as BrandValidators from "./brand.validation.js";
import multerCloud from "../../Services/multerCloud.js";
import allowedExtensions from "../../Utils/allowedExtensions.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";
import { asyncHandler } from "../../Utils/errorHandling.js";
import { isAuth } from "../../Middlewares/authentication.js";
import brandApisRoles from "./brand.endpoints.js";

const router = Router();

router.post(
  "/create",
  isAuth(brandApisRoles.BRAND_ROLES),
  multerCloud(allowedExtensions.Image).single("logo"),
  validationCoreFunction(BrandValidators.createBrandValidation),
  asyncHandler(BrandControllers.createdBrand)
);

router.put(
  "/update",
  isAuth(brandApisRoles.BRAND_ROLES),
  multerCloud(allowedExtensions.Image).single("logo"),
  validationCoreFunction(BrandValidators.updateBrandValidation),
  asyncHandler(BrandControllers.updateBrand)
);

router.get(
  "/get",
  isAuth(brandApisRoles.BRAND_ROLES),
  asyncHandler(BrandControllers.getAllBrands)
);

router.delete(
  "/delete",
  isAuth(brandApisRoles.BRAND_ROLES),
  validationCoreFunction(BrandValidators.deleteBrandValidation),
  asyncHandler(BrandControllers.deleteBrand)
);

export default router;
