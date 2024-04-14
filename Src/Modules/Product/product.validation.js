import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const addProductValidation = {
  body: Joi.object({
    title: Joi.string().min(4).max(55).required(),
    desc: Joi.string().min(4).max(255).optional(),
    colors: Joi.array().items(Joi.string().required()).optional(),
    sizes: Joi.array().items(Joi.string().required()).optional(),
    price: Joi.number().positive().required(),
    appliedDiscount: Joi.number().positive().min(1).max(100).optional(),
    stock: Joi.number().integer().positive().required(),
  }).required(),
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
    brandId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const updateProductValidation = {
  body: Joi.object({
    title: Joi.string().min(4).max(55),
    desc: Joi.string().min(4).max(255),
    colors: Joi.array().items(Joi.string().min(4).max(25).required()),
    sizes: Joi.array().items(Joi.string().min(4).max(25).required()),
    price: Joi.number().positive(),
    appliedDiscount: Joi.number().positive().min(1).max(100),
    stock: Joi.number().positive(),
  })
    .required()
    .options({ presence: "optional" }),
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
    brandId: generalFields.ID,
    productId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const deleteProductValidation = {
  query: Joi.object({
    categoryId: generalFields.ID,
    subCategoryId: generalFields.ID,
    brandId: generalFields.ID,
    productId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

export {
  addProductValidation,
  updateProductValidation,
  deleteProductValidation,
};
