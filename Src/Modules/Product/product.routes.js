import { Router } from "express";

import * as ProductControllers from "./product.controller.js";
import { asyncHandler } from "../../Utils/errorHandling.js";

import * as ProductValidators from "./product.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";

import multerCloud from "../../Services/multerCloud.js";
import allowedExtensions from "../../Utils/allowedExtensions.js";

import isAuth from "../../Middlewares/authentication.js";
import productApisRoles from "./product.endpoints.js";

const router = Router();

router.post(
  "/add",
  isAuth(productApisRoles.PRODUCT_ROLES),
  multerCloud(allowedExtensions.Image).array("image", 2),
  validationCoreFunction(ProductValidators.addProductValidation),
  asyncHandler(ProductControllers.addProduct)
);

router.put(
  "/update",
  isAuth(productApisRoles.PRODUCT_ROLES),
  multerCloud(allowedExtensions.Image).array("image", 2),
  validationCoreFunction(ProductValidators.updateProductValidation),
  asyncHandler(ProductControllers.updateProduct)
);

router.get(
  "/get",
  isAuth(productApisRoles.PRODUCT_ROLES),
  asyncHandler(ProductControllers.getAllProducts)
);

router.get("/search", asyncHandler(ProductControllers.getProducts));

router.delete(
  "/delete",
  isAuth(productApisRoles.PRODUCT_ROLES),
  validationCoreFunction(ProductValidators.deleteProductValidation),
  asyncHandler(ProductControllers.deleteProduct)
);

export default router;
