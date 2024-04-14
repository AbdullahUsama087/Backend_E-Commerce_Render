import { Router } from "express";
import multerCloud from "../../Services/multerCloud.js";
import allowedExtensions from "../../Utils/allowedExtensions.js";

import * as SubCategoryControllers from "./subCategory.controller.js";

import * as SubCategoryValidators from "./subCategory.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";
import { asyncHandler } from "../../Utils/errorHandling.js";
import isAuth from "../../Middlewares/authentication.js";
import subCategoryApisRoles from "./subCategory.endpoints.js";

const router = Router({ mergeParams: true }); // To access subcategory routes from category routes

router.post(
  "/create",
  isAuth(subCategoryApisRoles.SUBCATEGORY_ROLES),
  multerCloud(allowedExtensions.Image).single("image"),
  validationCoreFunction(SubCategoryValidators.createSubCategoryValidation),
  asyncHandler(SubCategoryControllers.createSubCategory)
);

router.put(
  "/update",
  isAuth(subCategoryApisRoles.SUBCATEGORY_ROLES),
  multerCloud(allowedExtensions.Image).single("image"),
  validationCoreFunction(SubCategoryValidators.updateSubCategoryValidation),
  asyncHandler(SubCategoryControllers.updateSubCategory)
);

router.get(
  "/get",
  isAuth(subCategoryApisRoles.SUBCATEGORY_ROLES),
  asyncHandler(SubCategoryControllers.getAllSubCategories)
);

router.delete(
  "/delete",
  isAuth(subCategoryApisRoles.SUBCATEGORY_ROLES),
  validationCoreFunction(SubCategoryValidators.deleteSubCategoryValidation),
  asyncHandler(SubCategoryControllers.deleteSubCategory)
);

export default router;
