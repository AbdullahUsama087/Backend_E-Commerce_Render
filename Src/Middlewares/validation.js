import Joi from "joi";
import { Types } from "mongoose";

const reqMethods = ["body", "query", "params", "headers", "file", "files"];

// Validation for ID
const validateObjectId = (value, helper) => {
  if (Types.ObjectId.isValid(value)) {
    true;
  } else {
    helper.message("Invalid ObjectId");
  }
};

const generalFields = {
  email: Joi.string()
    .email({ tlds: { allow: ["com", "net", "org"] } }),
  password: Joi.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .messages({
      "string.pattern.base": "Password Regex Fail",
    }),
  ID: Joi.string().custom(validateObjectId),
};

function validationCoreFunction(schema) {
  return (req, res, next) => {
    const validationErrorArr = [];
    for (const key of reqMethods) {
      if (schema[key]) {
        const validationResult = schema[key].validate(req[key], {
          abortEarly: false,
        });
        if (validationResult.error) {
          validationErrorArr.push(validationResult.error.details);
        }
      }
    }
    if (validationErrorArr.length) {
      // res
      //   .status(400)
      //   .json({ message: "Validation Error", Errors: validationErrorArr });
      req.validationErrorArr = validationErrorArr;
      next(new Error(validationErrorArr, { cause: 400 }));
    } else {
      next();
    }
  };
}

export { validationCoreFunction, generalFields };
