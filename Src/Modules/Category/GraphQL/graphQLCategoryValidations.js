import Joi from "joi";

const createCategoryValidationGraphQL = Joi.object({
  name: Joi.string().min(5).max(20),
  token: Joi.string(),
})
  .required()
  .options({ presence: "required" });

export { createCategoryValidationGraphQL };
