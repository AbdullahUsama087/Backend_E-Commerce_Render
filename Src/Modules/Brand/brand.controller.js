import categoryModel from "../../../DataBase/Models/category.model.js";
import subCategoryModel from "../../../DataBase/Models/subCategory.model.js";
import brandModel from "../../../DataBase/Models/brand.model.js";
import productModel from "../../../DataBase/Models/product.model.js";

import cloudinary from "../../Utils/cloudinaryConfigurations.js";

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("123456,!@#$", 5);

// ===================== Create Brand =================

const createdBrand = async (req, res, next) => {
  const { name } = req.body;
  const { categoryId, subCategoryId } = req.query;
  const { _id } = req.authUser;

  if (!name) {
    return next(new Error("Please enter a name of the brand", { cause: 400 }));
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

  // Check SubCategory is related to Category
  if (!subCategoryExists.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("This subCategory is not related to Category", { cause: 400 })
    );
  }

  // Generate Slug
  const slug = name.replace(/ /g, "_").toLowerCase();

  // Check if No image Uploaded
  if (!req.file) {
    return next(new Error("Please Upload the Image of Brand", { cause: 400 }));
  }

  const customId = nanoid();

  // Upload Image on Host (Cloudinary)
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${customId}`,
    }
  );

  // store Image Path to delete image if any fail occurred
  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${customId}`;

  // Upload Brand on DataBase
  const brandInstance = new brandModel({
    name,
    slug,
    customId,
    logo: { secure_url, public_id },
    categoryId,
    subCategoryId,
    createdBy: _id,
  });
  await brandInstance.save();

  // store model to delete it if any fail occurred
  req.failedDocument = { model: brandModel, _id: brandInstance._id };

  // Check if No Brand Object Created
  if (!brandInstance) {
    await cloudinary.uploader.destroy(public_id);
    return next(
      new Error("Fail to create Brand, Please try again later", { cause: 400 })
    );
  }

  res
    .status(200)
    .json({ message: "Brand Created Successfully", brandInstance });
};

// ===================== Update Brand =================

const updateBrand = async (req, res, next) => {
  const { name } = req.body;
  const { categoryId, subCategoryId, brandId } = req.query;
  const { _id } = req.authUser;

  // Check if CategoryId exists
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

  // Check if subCategory is  Related to Category
  if (!subCategoryExists.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("This SubCategory is not related to Category", { cause: 400 })
    );
  }

  // Check if Brand Exists
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

  //Check on Name
  if (name) {
    // Check if the name is different from the old one
    if (brandExists.name == name) {
      return next(
        new Error(
          "You entered the old name of The Brand,Please enter a new one",
          { cause: 400 }
        )
      );
    }

    // Update Name and Slug
    brandExists.name = name;
    brandExists.slug = name.replace(/ /g, "_").toLowerCase();
  }

  // Check on Logo
  if (req.file) {
    // Delete the old Logo
    await cloudinary.uploader.destroy(brandExists.logo.public_id);

    // Upload the new Logo on Host (Cloudinary)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCateories/${subCategoryExists.customId}/Brands/${brandExists.customId}`,
      }
    );

    // Upload the new Logo on DataBase
    brandExists.logo = { secure_url, public_id };
  }
  // Update user data
  brandExists.updatedBy = _id;
  await brandExists.save();
  res.status(200).json({ message: "Brand Uploaded Successfully", brandExists });
};

// ===================== Get All Brands =================

const getAllBrands = async (req, res, next) => {
  const { _id } = req.authUser;
  const Brands = await brandModel
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
    ]);
  if (Brands.length) {
    res.status(200).json({ message: "Done", Brands });
  } else {
    next(new Error("No Brands found", { cause: 400 }));
  }
};

// ===================== Delete Brand =================

const deleteBrand = async (req, res, next) => {
  const { categoryId, subCategoryId, brandId } = req.query;
  const { _id } = req.authUser;

  // Check if Category Exists
  const categoryExists = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!categoryExists) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Check if SubCategory exists
  const subCategoryExists = await subCategoryModel.findOne({
    _id: subCategoryId,
    createdBy: _id,
  });
  if (!subCategoryExists) {
    return next(new Error("Invalid SubCategoryId", { cause: 400 }));
  }

  // Check if subCategory is Related to Category
  if (!subCategoryExists.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("This SubCategory is not related to Category", { cause: 400 })
    );
  }

  // Check if Brand exists and delete it from DataBase
  const brandExists = await brandModel.findOneAndDelete({
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

  // Delete Related Fields From Host (Cloudinary)
  // 1- Delete All logos from Folders
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}`
  );
  // 2- Delete All empty folders
  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}/Brands/${brandExists.customId}`
  );

  // Delete Related Products from DataBase
  const deleteRelatedProducts = await productModel.deleteMany({ brandId });
  if (!deleteRelatedProducts.deletedCount) {
    return next(new Error("Fail to delete related products", { cause: 400 }));
  }

  res.status(200).json({ message: "Brand Deleted Successfully" });
};

export { createdBrand, updateBrand, getAllBrands, deleteBrand };
