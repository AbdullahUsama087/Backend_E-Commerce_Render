import {
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql";

import categoryModel from "../../../../DataBase/Models/category.model.js";

import { categoryType } from "./graphQLCategoryTypes.js";

import { isAuthGraphQL } from "../../../Middlewares/authentication.js";

import systemRoles from "../../../Utils/systemRoles.js";

import { graphQLValidation } from "../../../Middlewares/validation.js";
import { createCategoryValidationGraphQL } from "./graphQLCategoryValidations.js";

const getAllCategories = {
  type: new GraphQLList(categoryType),
  resolve: async () => {
    const Categories = await categoryModel.find();
    return Categories;
  },
};

const createCategory = {
  type: new GraphQLObjectType({
    name: "createCategory",
    fields: {
      message: { type: GraphQLString },
      category: { type: categoryType },
    },
  }),
  args: {
    name: { type: new GraphQLNonNull(GraphQLString) },
    token: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async (__, args) => {
    // Apply Authentication and Authorization
    const isAuthUser = await isAuthGraphQL(args.token, [systemRoles.ADMIN]);
    console.log({ isAuthUser });
    if (!isAuthUser.code) {
      return isAuthUser;
    }

    //====>>> Apply Validation
    const validationResult = await graphQLValidation(
      createCategoryValidationGraphQL,
      args
    );
    console.log({ validationResult });
    if (validationResult !== true) {
      return validationResult;
    }

    // destruct name from args
    const { name } = args;

    // Check the name is unique
    const categoryExists = await categoryModel.find({ name });
    if (categoryExists) {
      return new Error("Duplicate Category Name");
    }

    // create category object
    // We must disable image requirement from category model
    const categoryObject = {
      name,
      slug: name.replace(/ /g, "_").toLowerCase(),
      createdBy: isAuthUser.findUser._id,
    };

    const category = await categoryModel.create(categoryObject);
    return {
      message: "Category created successfully",
      category,
    };
  },
};

export { getAllCategories, createCategory };
