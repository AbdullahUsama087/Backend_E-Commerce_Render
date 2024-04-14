import categoryModel from "../../../DataBase/Models/category.model.js";
import subCategoryModel from "../../../DataBase/Models/subCategory.model.js";
import brandModel from "../../../DataBase/Models/brand.model.js";
import productModel from "../../../DataBase/Models/product.model.js";

import cloudinary from "../../Utils/cloudinaryConfigurations.js";

const nanoid = customAlphabet("123456,!@#$", 5);
import { customAlphabet } from "nanoid";

// ===================== Create Category =================

const createCategory = async (req, res, next) => {
  const { name } = req.body;
  const { _id } = req.authUser;

  if (!name) {
    return next(
      new Error("Please enter a name for the category", { cause: 400 })
    );
  }

  //Create Slug Name
  const slug = name.replace(/ /g, "_").toLowerCase();

  // Check the name  is unique
  const findCategory = await categoryModel.findOne({ name });
  if (findCategory) {
    return next(
      new Error("This name is already used, Please Choose a different one", {
        cause: 400,
      })
    );
  }

  const customId = nanoid();
  //Check if no Img Uploaded
  if (!req.file) {
    return next(new Error("Please Upload a Category Image", { cause: 400 }));
  }

  //Upload Image on Host (Cloudinary)
  const { secure_url, public_id } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECT_FOLDER}/Categories/${customId}`,
    }
  );

  // store Image Path to delete image if any fail occurred
  req.imagePath = `${process.env.PROJECT_FOLDER}/Categories/${customId}`;

  // Create Category Object
  const categoryInstance = new categoryModel({
    name,
    slug,
    Image: { secure_url, public_id },
    customId,
    createdBy: _id,
  });
  await categoryInstance.save();

  // store model to delete it if any fail occurred
  req.failedDocument = { model: categoryModel, _id: categoryInstance._id };

  // Check if No Category Object created
  if (!categoryInstance) {
    await cloudinary.uploader.destroy(public_id);
    return next(
      new Error("Fail to Create Category, Please try again", { cause: 400 })
    );
  }
  res
    .status(200)
    .json({ message: "Category Created successfully", categoryInstance });
};

// ===================== Update Category =================

const updateCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { name } = req.body;
  const { _id } = req.authUser;

  // Check if category exists by ID
  const category = await categoryModel.findOne({
    _id: categoryId,
    createdBy: _id,
  });
  if (!category) {
    return next(new Error("Invalid category ID", { cause: 400 }));
  }

  // Check on Name
  if (name) {
    //check that new name is different from the old name
    if (category.name == name) {
      return next(
        new Error(
          "you entered the same name Category,Please enter a different one",
          {
            cause: 400,
          }
        )
      );
    }

    //check the new name is unique
    const findCategory = await categoryModel.findOne({ name });
    if (findCategory) {
      return next(
        new Error("This name is already used please enter a different one", {
          cause: 400,
        })
      );
    }

    // Update name and slug
    category.name = name;
    category.slug = name.replace(/ /g, "_").toLowerCase();
  }

  if (req.file) {
    // Delete the old image
    await cloudinary.uploader.destroy(category.Image.public_id);

    // Upload the new image on Host
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: `${process.env.PROJECT_FOLDER}/Categories/${category.customId}`,
      }
    );
    // await cloudinary.api.rename_folder()

    // Update the new image on DB
    category.Image = { secure_url, public_id };
  }
  // Update userId who Updates the Category
  category.updatedBy = _id;
  await category.save();
  res.status(200).json({ message: "Category updated successfully", category });
};

// ===================== Get All Categories =================

const getAllCategories = async (req, res, next) => {
  const { _id } = req.authUser;
  const Categories = await categoryModel.find({ createdBy: _id }).populate([
    {
      path: "subCategories",
      select: "name -categoryId",
      populate: [
        // Nested Populate
        {
          path: "Brands",
          select: "name",
        },
      ],
    },
  ]);
  res.status(200).json({ message: "Done", Categories });
  // let categoryArr = [];
  // for (const category of Categories) {
  //   const subCategories = await subCategoryModel.find({
  //     categoryId: category._id,
  //   });
  //   const categoryObject = category.toObject();
  //   categoryObject.subCategories = subCategories;
  //   categoryArr.push(categoryObject)
  // }

  // ====> Cursor Method
  // const cursor = categoryModel.find().cursor();
  // for (
  //   let category = await cursor.next();
  //   category != null;
  //   category = await cursor.next()
  // ) {
  //   // console.log(category);
  //   const subCategories = await subCategoryModel.find({
  //     categoryId: category._id,
  //   });
  //   const categoryObject = category.toObject(); // Convert BSON to Object
  //   categoryObject.subCategories = subCategories;
  //   categoryArr.push(categoryObject);
  // }
  // res.status(200).json({ message: "Done", categoryArr });
};

// ===================== Delete Category =================

const deleteCategory = async (req, res, next) => {
  const { categoryId } = req.params;
  const { _id } = req.authUser;

  // Check if category is exists and Delete from DataBase
  const categoryExists = await categoryModel.findOneAndDelete({
    _id: categoryId,
    createdBy: _id,
  });
  if (!categoryExists) {
    return next(new Error("Invalid CategoryId", { cause: 400 }));
  }

  // Delete Related Fields from Host (Cloudinary)
  // 1- Delete All Imgs From Folders
  await cloudinary.api.delete_resources_by_prefix(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`
  );
  // 2- Delete empty folders
  await cloudinary.api.delete_folder(
    `${process.env.PROJECT_FOLDER}/Categories/${categoryExists.customId}`
  );

  // Delete Related SubCategories from DataBase
  const deleteRelatedSubCategories = await subCategoryModel.deleteMany({
    categoryId,
  });
  if (!deleteRelatedSubCategories.deletedCount) {
    return next(
      new Error("Fail to delete related subCategories", { cause: 400 })
    );
  }

  // Delete Related Brands from DateBase
  const deleteRelatedBrands = await brandModel.deleteMany({ categoryId });
  if (!deleteRelatedBrands.deletedCount) {
    return next(new Error("Fail to delete related Brands", { cause: 400 }));
  }

  // Delete Related Products from DateBase
  const deleteRelatedProducts = await productModel.deleteMany({ categoryId });
  if (!deleteRelatedProducts.deletedCount) {
    return next(new Error("Fail to delete related Products", { cause: 400 }));
  }

  res.status(200).json({ message: "Category deleted successfully" });
};

export { createCategory, updateCategory, getAllCategories, deleteCategory };
