import Joi from "joi";

import { generalFields } from "../../Middlewares/validation.js";

const createCategoryValidation = {
  body: Joi.object({
    name: Joi.string().min(5).max(20),
  })
    .required()
    .options({ presence: "required" }),
};

const updateCategoryValidation = {
  body: Joi.object({
    name: Joi.string().min(5).max(20).optional(),
  }).required(),
  params: Joi.object({
    categoryId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const deleteCategoryValidation = {
  params: Joi.object({
    categoryId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

export {
  createCategoryValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
};
