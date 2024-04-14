import categoryModel from "../../../DataBase/Models/category.model.js";
import subCategoryModel from "../../../DataBase/Models/subCategory.model.js";
import brandModel from "../../../DataBase/Models/brand.model.js";
import productModel from "../../../DataBase/Models/product.model.js";

const nanoid = customAlphabet("123456,!@#$", 5);
import { customAlphabet } from "nanoid";

import cloudinary from "../../Utils/cloudinaryConfigurations.js";
import paginationFunction from "../../Utils/pagination.js";
import ApiFeatures from "../../Utils/apiFeatures.js";
import { getIO } from "../../Utils/ioFunctions.js";

// ===================== Add Product =================

const addProduct = async (req, res, next) => {
  const { title, desc, colors, sizes, price, appliedDiscount, stock } =
    req.body;
  const { categoryId, subCategoryId, brandId } = req.query;
  const { _id } = req.authUser;

  if (!title) {
    return next(new Error("Please Enter a title for product", { cause: 400 }));
  }

  // Check on CategoryId
  const categoryExists = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!categoryExists) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Check on SubCategoryId
  const subCategoryExists = await subCategoryModel.findOne({
    _id: subCategoryId,
    createdBy: _id,
  });
  if (!subCategoryExists) {
    return next(new Error("Invalid SubCategoryId", { cause: 400 }));
  }

  // Check if SubCategory is related to Category
  if (!subCategoryExists.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("The SubCategory is not related to Category", { cause: 400 })
    );
  }

  // Check on BrandId
  const brandExists = await brandModel.findOne({
    _id: brandId,
    createdBy: _id,
  });
  if (!brandExists) {
    return next(new Error("Invalid BrandId", { cause: 400 }));
  }

  // Check if Brand is related to SubCategory
  if (!brandExists.subCategoryId.toString() == subCategoryId) {
    return next(
      new Error("This Brand is not related to SubCategory", { cause: 400 })
    );
  }

  // Generate Slug
  const slug = title.replace(/ /g, "_").toLowerCase();

  const customId = nanoid();

  // Calculate Price After Discount
  const priceAfterDiscount = price - price * ((appliedDiscount || 0) / 100);

  // Check the Product title is unique
  const findProduct = await productModel.findOne({ title });
  if (findProduct) {
    return next(
      new Error(
        "This Title of Product is already used,Please choose a different one"
      )
    );
  }

  // Check if no Images Uploaded
  if (!req.files) {
    return next(new Error("Please Upload Images for Product", { cause: 400 }));
  }

  // Upload Images on Host(Cloudinary)
  let Images = [];
  let publicIds = [];
  for (const file of req.files) {
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${customId}`,
      }
    );
    Images.push({ secure_url, public_id });
    publicIds.push(public_id);
  }

  // store Image Path to delete image if any fail occurred
  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${customId}`;

  // Upload Product on DataBase
  const productObject = {
    title,
    slug,
    desc,
    price,
    appliedDiscount,
    priceAfterDiscount,
    colors,
    sizes,
    stock,
    Images,
    customId,
    categoryId,
    subCategoryId,
    brandId,
    createdBy: _id,
  };

  const product = await productModel.create(productObject);

  // store model to delete it if any fail occurred
  req.failedDocument = { model: productModel, _id: product._id };

  // Check if No Product Created
  if (!product) {
    await cloudinary.api.delete_resources(publicIds);
    return next(
      new Error("Fail to Create Product, Please try again", { cause: 400 })
    );
  }
  // getIO().emit('addedDone',{product})
  res.status(200).json({ message: "Product Added Successfully", product });
};

// ===================== Update Product =================

const updateProduct = async (req, res, next) => {
  const { title, desc, colors, sizes, price, appliedDiscount, stock } =
    req.body;
  const { categoryId, subCategoryId, brandId, productId } = req.query;
  const { _id } = req.authUser;

  // Check if CategoryId exists
  const categoryExists = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!categoryExists) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Check if SubCategoryId exists
  const subCategoryExists = await subCategoryModel.findOne({
    _id: subCategoryId,
    createdBy: _id,
  });
  if (!subCategoryExists) {
    return next(new Error("Invalid SubCategoryId", { cause: 400 }));
  }

  // Check if SubCategory is Related to Category
  if (!subCategoryExists.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("This SubCategory is not related to Category", { cause: 400 })
    );
  }

  // Check if BrandId exists
  const brandExists = await brandModel.findOne({
    _id: brandId,
    createdBy: _id,
  });
  if (!brandExists) {
    return next(new Error("Invalid BrandId", { cause: 400 }));
  }

  // Check if Brand is Related to SubCategory
  if (!brandExists.subCategoryId.toString() == subCategoryId.toString()) {
    return next(
      new Error("This Brand is not related to SubCategory", { cause: 400 })
    );
  }

  // Check if Product exists
  const productExists = await productModel.findOne({
    _id: productId,
    createdBy: _id,
  });
  if (!productExists) {
    return next(new Error("Invalid ProductId", { cause: 400 }));
  }

  // Check if Product is Related to Brand
  if (!productExists.brandId.toString() == brandId.toString()) {
    return next(
      new Error("This Product is not related to Brand", { cause: 400 })
    );
  }

  // Check on Price and Discount
  if (appliedDiscount && price) {
    const priceAfterDiscount = price - price * ((appliedDiscount || 0) / 100);
    productExists.priceAfterDiscount = priceAfterDiscount;
    productExists.price = price;
    productExists.appliedDiscount = appliedDiscount;
  } else if (price) {
    const priceAfterDiscount =
      price - price * ((productExists.appliedDiscount || 0) / 100);
    productExists.priceAfterDiscount = priceAfterDiscount;
    productExists.price = price;
  } else if (appliedDiscount) {
    const priceAfterDiscount =
      productExists.price -
      productExists.price * ((appliedDiscount || 0) / 100);
    productExists.priceAfterDiscount = priceAfterDiscount;
    productExists.appliedDiscount = appliedDiscount;
  }

  // Check on Images
  if (req.files?.length) {
    let ImagesArr = [];
    let publicIds = [];
    // Update Images on Host
    for (const file of req.files) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        file.path,
        {
          folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${productExists.customId}`,
        }
      );
      ImagesArr.push({ secure_url, public_id });
    }
    // Delete old Images
    for (const image of productExists.Images) {
      publicIds.push(image.public_id);
    }
    await cloudinary.api.delete_resources(publicIds);

    productExists.Images = ImagesArr;
  }

  // Update title if existing
  if (title) {
    // Check the name is different from the old one
    if (productExists.title == title) {
      return next(
        new Error(
          "you entered the same title of the Product,Please enter a new one",
          { cause: 400 }
        )
      );

      // Check the title is unique
    }
    const findProduct = await productModel.findOne({ title });
    if (findProduct) {
      return next(
        new Error("this title is already exist,Please enter a different one", {
          cause: 400,
        })
      );
    }

    productExists.title = title;
    productExists.slug = title.replace(/ /g, "_").toLowerCase();
  }
  // Update Description if existing
  if (desc) productExists.desc = desc;
  // Update Colors if existing
  if (colors) productExists.colors = colors;
  // Update Sizes if existing
  if (sizes) productExists.sizes = sizes;
  // Update Stock if existing
  if (stock) productExists.stock = stock;

  // Update field updatedBy
  productExists.updatedBy = _id;
  await productExists.save();
  res
    .status(200)
    .json({ message: "Product Updated Successfully", productExists });
};

// ===================== Get All Products =================

const getAllProducts = async (req, res, next) => {
  const { _id } = req.authUser;
  const { page, size } = req.query;
  const { limit, skip } = paginationFunction({ page, size });

  const products = await productModel
    .find({ createdBy: _id })
    .populate([
      {
        path: "categoryId",
        select: "name",
      },
    ])
    .populate([
      {
        path: "subCategoryId",
        select: "name",
      },
    ])
    .populate([
      {
        path: "brandId",
        select: "name",
      },
    ])
    .limit(limit)
    .skip(skip);
  if (products.length) {
    res.status(200).json({ message: "Done", products });
  } else {
    next(new Error("No products found", { cause: 400 }));
  }
};

// ===================== Get Products By SearchKey =================

const getProducts = async (req, res, next) => {
  const { searchKey, page, size } = req.query;
  const { limit, skip } = paginationFunction({ page, size });

  const products = await productModel.find({
    // $or: [
    //   { title: { $regex: searchKey, $options: "i" } },
    //   { desc: { $regex: searchKey, $options: "i" } },
    // ],
  });
  // .limit(limit)
  // .skip(skip);

  if (products.length) {
    res.status(200).json({ message: "Done", products });
  } else {
    next(new Error("No products found", { cause: 400 }));
  }
};

// ===================== List Products =================

const listProducts = async (req, res, next) => {
  const { sort, select, search } = req.query;
  const { _id } = req.authUser;

  /* Sort
  const products = await productModel.find().sort(sort.replaceAll("&", " "));
  */

  /* Select 
  const products = await productModel
  .find()
  .select(select.replaceAll("&", " "));
  */

  /* Search
  const products = await productModel.find({
    $or: [
      { title: { $regex: search, $options: "i" } },
      { desc: { $regex: search, $options: "i" } },
    ],
  });
  */

  /* Filters 
  const queryInstance = { ...req.query };
  console.log({ queryInstance });
  
  const excludeKeyArr = ["page", "size", "sort", "select", "search"];
  excludeKeyArr.forEach((key) => delete queryInstance[key]);
  
  console.log({ queryInstance });
  
  const queryString = JSON.parse(
    JSON.stringify(queryInstance).replace(
      /gt|gte|le|lte|in|nin|eq|neq|regex/g,
      (match) => `$${match}`
      )
      );
      console.log(queryString);
      const products = await productModel.find(queryString);
      */

  // const products=productModel.find() // Mongoose Query
  // const data=await products  //Query Data

  //=========================== Sort from Class =========================
  const ApiFeaturesInstance = new ApiFeatures(
    productModel.find({ createdBy: _id }),
    req.query
  ).pagination();
  const products = await ApiFeaturesInstance.mongooseQuery;
  if (products.length) {
    res.status(200).json({ message: "Done", products });
  } else {
    next(new Error("No products found", { cause: 400 }));
  }
};

// ===================== Delete Product =================

const deleteProduct = async (req, res, next) => {
  const { categoryId, subCategoryId, brandId, productId } = req.query;
  const { _id } = req.authUser;

  // Check if Category exists
  const categoryExists = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!categoryExists) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Check if subCategory exists
  const subCategoryExists = await subCategoryModel.findOne({
    _id: subCategoryId,
    createdBy: _id,
  });
  if (!subCategoryExists) {
    return next(new Error("Invalid SubCategoryId", { cause: 400 }));
  }

  // Check if subCategory is related to Category
  if (!subCategoryExists.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("This SubCategory is not related to Category", { cause: 400 })
    );
  }

  // Check if Brand exists
  const brandExists = await brandModel.findOne({
    _id: brandId,
    createdBy: _id,
  });
  if (!brandExists) {
    return next(new Error("Invalid BrandId", { cause: 400 }));
  }

  // Check if the brand is related to SubCategory
  if (!brandExists.subCategoryId.toString() == subCategoryId.toString()) {
    return next(
      new Error("This Brand is not related to SubCategory", { cause: 400 })
    );
  }

  // Check if Product exists and Delete Product from Database
  const productExists = await productModel.findOneAndDelete({
    _id: productId,
    createdBy: _id,
  });
  if (!productExists) {
    return next(new Error("Invalid ProductId", { cause: 400 }));
  }

  // Check if product is related to brand
  if (!productExists.brandId.toString() == brandId.toString()) {
    return next(
      new Error("This Product is not related to Brand", { cause: 400 })
    );
  }
  //Delete Related Fields from Host(Cloudinary)
  //1- delete all Images from folders
  for (const imgsId of productExists.Images) {
    await cloudinary.uploader.destroy(imgsId.public_id);
  }
  //2- delete all empty folders
  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}/Products/${productExists.customId}`
  );

  res.status(200).json({ message: "Product Deleted Successfully" });
};

export {
  addProduct,
  updateProduct,
  getAllProducts,
  getProducts,
  listProducts,
  deleteProduct,
};
