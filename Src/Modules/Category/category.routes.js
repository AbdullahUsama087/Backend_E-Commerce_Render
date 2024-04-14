import { Router } from "express";
import multerCloud from "../../Services/multerCloud.js";
import allowedExtensions from "../../Utils/allowedExtensions.js";
import { asyncHandler } from "../../Utils/errorHandling.js";

import * as CategoryController from "./category.controller.js";

import * as CategoryValidators from "./category.validation.js";
import { validationCoreFunction } from "../../Middlewares/validation.js";
import subCategoryRouter from "../SubCateogory/subCategory.routes.js";
import isAuth from "../../Middlewares/authentication.js";
import categoryApisRoles from "./category.endpoints.js";

const router = Router();

router.use("/:categoryId", subCategoryRouter); // To access subcategory routes from category routes

router.post(
  "/create",
  isAuth(categoryApisRoles.CATEGORY_ROLES),
  multerCloud(allowedExtensions.Image).single("image"),
  validationCoreFunction(CategoryValidators.createCategoryValidation),
  asyncHandler(CategoryController.createCategory)
);

router.put(
  "/update/:categoryId",
  isAuth(categoryApisRoles.CATEGORY_ROLES),
  multerCloud(allowedExtensions.Image).single("image"),
  validationCoreFunction(CategoryValidators.updateCategoryValidation),
  asyncHandler(CategoryController.updateCategory)
);

router.get(
  "/get",
  isAuth(categoryApisRoles.CATEGORY_ROLES),
  asyncHandler(CategoryController.getAllCategories)
);

router.delete(
  "/delete/:categoryId",
  isAuth(categoryApisRoles.CATEGORY_ROLES),
  validationCoreFunction(CategoryValidators.deleteCategoryValidation),
  asyncHandler(CategoryController.deleteCategory)
);

export default router;
