import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { createCategory, getAllCategories } from "./graphQLCategoryResolvers.js";

const categorySchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "categoryQuery",
    description: "test category query",
    fields: {
      getAllCategories,
      createCategory
    },
  }),
});

export { categorySchema };
