import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const createOrderValidation = {
  body: Joi.object({
    productId: generalFields.ID.required(),
    quantity: Joi.number().integer().positive().min(1).max(10).required(),
    address: Joi.string().min(3).max(25).required(),
    phoneNumbers: Joi.array().items(
      Joi.string()
        .length(11)
        .regex(/^01[0125][0-9]{8}$/m)
        .required()
    ),
    paymentMethod: Joi.string().valid("Cash", "Card").required(),
    couponCode: Joi.string().min(5).max(25).optional(),
  }).required(),
};

const orderFromCartValidation = {
  body: Joi.object({
    address: Joi.string().min(5).max(25).required(),
    phoneNumbers: Joi.array().items(
      Joi.string()
        .length(11)
        .regex(/^01[0125][0-9]{8}$/m)
        .required()
    ),
    paymentMethod: Joi.string().valid("Cash", "Card").required(),
    couponCode: Joi.string().min(5).max(25).optional(),
  }).required(),
  params: Joi.object({
    cartId: generalFields.ID.required(),
  }).required(),
};

const deliverOrderValidation = {
  query: Joi.object({
    orderId: generalFields.ID.required(),
  }).required(),
};

export {
  createOrderValidation,
  orderFromCartValidation,
  deliverOrderValidation,
};
