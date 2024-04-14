import categoryModel from "../../../DataBase/Models/category.model.js";
import subCategoryModel from "../../../DataBase/Models/subCategory.model.js";
import brandModel from "../../../DataBase/Models/brand.model.js";
import productModel from "../../../DataBase/Models/product.model.js";

import cloudinary from "../../Utils/cloudinaryConfigurations.js";

const nanoid = customAlphabet("123456,!@#$", 5);
import { customAlphabet } from "nanoid";

// ===================== Create SubCategory =================

const createSubCategory = async (req, res, next) => {
  const { name } = req.body;
  const { categoryId } = req.params;
  const { _id } = req.authUser;

  if (!name) {
    return next(
      new Error("Please enter a name for the subCategory", { cause: 400 })
    );
  }
  // Generate Slug
  const slug = name.replace(/ /g, "_").toLowerCase();

  // Check if the category exists
  const findCategory = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!findCategory) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Check the name is unique
  const findSubCategory = await subCategoryModel.findOne({ name });
  if (findSubCategory) {
    return next(
      new Error(
        "This name of subCategory is already used, Please choose a different name",
        { cause: 400 }
      )
    );
  }

  // Check if no Image Uploaded
  if (!req.file) {
    return next(new Error("Please Upload a SubCategory Image", { cause: 400 }));
  }

  const customId = nanoid();

  // Upload Image on Host (Cloudinary)
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${findCategory.customId}/SubCategories/${customId}`,
    }
  );

  // store Image Path to delete image if any fail occurred
  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${findCategory.customId}/SubCategories/${customId}`;

  // Upload SubCategory On DataBase
  const subCategoryObject = {
    name,
    slug,
    Image: { secure_url, public_id },
    customId,
    categoryId,
    createdBy: _id,
  };
  const subCategory = await subCategoryModel.create(subCategoryObject);

  // store model to delete it if any fail occurred
  req.failedDocument = { model: subCategoryModel, _id: subCategory._id };

  // Check if no SubCategory object Created
  if (!subCategory) {
    await cloudinary.uploader.destroy(public_id);
    return next(
      new Error("Fail to Create SubCategory, Please try again", { cause: 400 })
    );
  }
  res
    .status(201)
    .json({ message: "SubCategory Created successfully", subCategory });
};

// ===================== Update SubCategory =================

const updateSubCategory = async (req, res, next) => {
  const { name } = req.body;
  const { categoryId, subCategoryId } = req.query;
  const { _id } = req.authUser;

  // Check if CategoryId exists
  const category = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!category) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Check if subCategoryId exists
  const subCategory = await subCategoryModel.findOne({
    _id: subCategoryId,
    createdBy: _id,
  });
  if (!subCategory) {
    return next(new Error("Invalid SubCategoryId", { cause: 400 }));
  }

  // Check if subCategory is related to Category
  if (!subCategory.categoryId.toString() == categoryId.toString()) {
    return next(
      new Error("This SubCategory is not related to Category", { cause: 400 })
    );
  }

  // Check on Name
  if (name) {
    // Check the name is different from the old one
    if (subCategory.name == name) {
      return next(
        new Error(
          "you entered the same name of the SubCategory,Please enter a new one",
          { cause: 400 }
        )
      );
    }

    // Check the name is unique
    const findSubCategory = await subCategoryModel.findOne({ name });
    if (findSubCategory) {
      return next(
        new Error("This name is already exists, Please enter a different one", {
          cause: 400,
        })
      );
    }

    // Update name and slug
    subCategory.name = name;
    subCategory.slug = name.replace(/ /g, "_").toLowerCase();
  }

  // Check on Image
  if (req.file) {
    // Delete the old image
    await cloudinary.uploader.destroy(subCategory.Image.public_id);

    // Upload the new image on Host (Cloudinary)
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}/SubCategories/${subCategory.customId}`,
      }
    );
    // Upload the new image on DataBase
    subCategory.Image = { secure_url, public_id };
  }
  // Update field updatedBy
  subCategory.updatedBy = _id;
  await subCategory.save();

  res
    .status(200)
    .json({ message: "SubCategory updated successfully", subCategory });
};

// ===================== Get All SubCategories =================

const getAllSubCategories = async (req, res, next) => {
  const { _id } = req.authUser;
  const subCategories = await subCategoryModel
    .find({ createdBy: _id })
    .populate([
      {
        path: "categoryId",
        select: "name",
      },
    ])
    .populate([
      {
        path: "Brands",
        select: "name",
      },
    ]);
  if (subCategories.length) {
    res.status(200).json({ message: "Done", subCategories });
  } else {
    next(new Error("No SubCategories found", { cause: 400 }));
  }
};

// ===================== Delete SubCategory =================

const deleteSubCategory = async (req, res, next) => {
  const { categoryId, subCategoryId } = req.query;
  const { _id } = req.authUser;

  // Check if Category Exists
  const categoryExists = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  console.log(categoryExists);
  if (!categoryExists) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  //Check if Sub Category Exists and delete from DataBase
  const subCategoryExists = await subCategoryModel.findOneAndDelete({
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

  // Delete Related Fields from Host(Cloudinary)
  // 1- Delete All Imgs from Folders
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}`
  );
  // 2- Delete empty Folders
  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}/SubCategories/${subCategoryExists.customId}`
  );

  // Delete Related Brands from DataBase
  const deleteRelatedBrands = await brandModel.deleteMany({ subCategoryId });
  if (!deleteRelatedBrands.deletedCount) {
    return next(new Error("Fail to Delete Related Brands", { cause: 400 }));
  }

  // Delete Related Products from DataBase
  const deleteRelatedProducts = await productModel.deleteMany({
    subCategoryId,
  });
  if (!deleteRelatedProducts.deletedCount) {
    return next(new Error("Fail to Delete Related Products", { cause: 400 }));
  }

  res.status(200).json({ message: "SubCategory deleted successfully" });
};

export {
  createSubCategory,
  updateSubCategory,
  getAllSubCategories,
  deleteSubCategory,
};
