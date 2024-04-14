import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const addReviewValidation = {
  body: Joi.object({
    reviewRate: Joi.number().positive().integer().min(1).max(5).required(),
    reviewComment: Joi.string().min(4).max(255).optional(),
  }),
  query: Joi.object({
    productId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const deleteReviewValidation = {
  query: Joi.object({
    reviewId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

export { addReviewValidation, deleteReviewValidation };
