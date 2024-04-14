import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const createSubCategoryValidation = {
  body: Joi.object({
    name: Joi.string().min(5).max(25),
  })
    .required()
    .options({ presence: "required" }),
  params: Joi.object({
    categoryId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const updateSubCategoryValidation = {
  body: Joi.object({
    name: Joi.string().min(5).max(25).optional(),
  }).required(),
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const deleteSubCategoryValidation = {
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

export {
  createSubCategoryValidation,
  updateSubCategoryValidation,
  deleteSubCategoryValidation,
};
