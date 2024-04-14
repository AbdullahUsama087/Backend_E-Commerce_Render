import Joi from "joi";
import { generalFields } from "../../Middlewares/validation.js";

const addCouponValidation = {
  body: Joi.object({
    couponCode: Joi.string().min(5).max(55).required(),
    couponAmount: Joi.number().positive().integer().min(1).max(100).required(),
    isPercentage: Joi.boolean().optional(),
    isFixedAmount: Joi.boolean().optional(),
    fromDate: Joi.date()
      .greater(Date.now() - 24 * 60 * 60 * 1000)
      .required(),
    toDate: Joi.date().greater(Joi.ref("fromDate")).required(),
    couponAssignedToUsers: Joi.array().items().required(),
  }).required(),
};

const updateCouponValidation = {
  body: Joi.object({
    couponCode: Joi.string().min(5).max(25),
    couponAmount: Joi.number().positive().integer().min(1).max(100),
    isPercentage: Joi.boolean(),
    isFixedAmount: Joi.boolean(),
    fromDate: Joi.date().greater(Date.now() - 24 * 60 * 60 * 1000),
    toDate: Joi.date().greater(Joi.ref("fromDate")),
    couponAssignedToUsers: Joi.array().items(),
  })
    .required()
    .options({ presence: "optional" }),
  params: Joi.object({
    couponId: generalFields.ID,
  })
    .required()
    .options({ presence: "required" }),
};

const deleteCouponValidation = {
  params: Joi.object({
    couponId: generalFields.ID.required(),
  }).required(),
};

export { addCouponValidation, updateCouponValidation, deleteCouponValidation };
