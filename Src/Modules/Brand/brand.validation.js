import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const createBrandValidation = {
  body: Joi.object({
    name: Joi.string().min(2).max(25),
  })
    .required()
    .options({ presence: "required" }),
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const updateBrandValidation = {
  body: Joi.object({
    name: Joi.string().min(2).max(25),
  })
    .required()
    .options({ presence: "optional" }),
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
    brandId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const deleteBrandValidation = {
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
    brandId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

export { createBrandValidation, updateBrandValidation, deleteBrandValidation };
