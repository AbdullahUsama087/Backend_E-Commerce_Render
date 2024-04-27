import { GraphQLID, GraphQLObjectType, GraphQLString } from "graphql";

const imageType = new GraphQLObjectType({
  name: "imageType",
  fields: {
    secure_url: { type: GraphQLString },
    public_id: { type: GraphQLString },
  },
});

const categoryType = new GraphQLObjectType({
  name: "categoryType",
  fields: {
    name: { type: GraphQLString },
    slug: { type: GraphQLString },
    Image: { type: imageType },
    createdBy: { type: GraphQLID },
    customId: { type: GraphQLString },
  },
});

export { imageType, categoryType };
