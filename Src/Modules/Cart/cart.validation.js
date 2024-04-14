import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const addToCartValidation = {
  body: Joi.object({
    productId: generalFields.ID,
    quantity: Joi.number().integer().positive().min(1).max(10),
  })
    .required()
    .options({ presence: "required" }),
};

const deleteFromCartValidation = {
  query: Joi.object({
    productId: generalFields.ID.required(),
  }).required(),
};

export { addToCartValidation, deleteFromCartValidation };
