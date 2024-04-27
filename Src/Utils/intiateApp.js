import DbConnection from "../../DataBase/connection.js";
import {
  globalErrorResponse,
  globalNotFoundPageError,
} from "./errorHandling.js";

import * as Routers from "../Modules/index.routes.js";
import { changeCouponStatus } from "./crons.js";

import cors from "cors";

import { gracefulShutdown } from "node-schedule";

import { intiateIO } from "./ioFunctions.js";

import productModel from "../../DataBase/Models/product.model.js";


import { createHandler } from "graphql-http/lib/use/express";
import { categorySchema } from "../Modules/Category/GraphQL/graphQLCategorySchemas.js";

function intiateApp(app, express) {
  const port = process.env.PORT;

  DbConnection();
  app.use(express.json());

  app.use(cors()); // Allow anyone to access the server

  app.use("/category", Routers.categoryRouter);
  app.use("/subCategory", Routers.subCategoryRouter);
  app.use("/brand", Routers.brandRouter);
  app.use("/product", Routers.productRouter);
  app.use("/coupon", Routers.couponRouter);
  app.use("/cart", Routers.cartRouter);
  app.use("/order", Routers.orderRouter);
  app.use("/review", Routers.reviewRouter);
  app.use("/auth", Routers.authRouter);

  app.use('/graphQLCategory',createHandler({schema:categorySchema}))

  changeCouponStatus();

  app.all("*", globalNotFoundPageError);

  app.use(globalErrorResponse);
  // gracefulShutdown()

  const server = app.listen(port, () =>
    console.log("Server listening on port Successfully")
  );

  // Connect server to socketIo
  const io = intiateIO(server);

  // Create Connection to IO
  io.on("connection", (socket) => {
    console.log({ socketId: socket.id });

    // listen Data from Frontend(Get All Products)
    // socket.on("requestAllData", async () => {
    //   const products = await productModel.find();
    //   // Send Data to Frontend
    //   socket.emit("returnProducts", { products });
    // });

    // // listen Data from Frontend(Add Product)
    // socket.on("addProduct", async (data) => {
    //   const slug = data.title.replace(/ /g, "_");
    //   data.slug = slug;
    //   const product = await productModel.create(data);
    //   // Send message and Product Data to Frontend
    //   io.emit("addedDone", { product }); // We used IO to update Products List automatically without refreshing
    // });
  });
}

export default intiateApp;
