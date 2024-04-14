import orderModel from "../../../DataBase/Models/order.model.js";
import productModel from "../../../DataBase/Models/product.model.js";
import reviewModel from "../../../DataBase/Models/review.model.js";

// ===================== Add Review =================

const addReview = async (req, res, next) => {
  const { _id: userId } = req.authUser;
  const { productId } = req.query;
  const { reviewRate, reviewComment } = req.body;

  // Check on Product if accessed to be reviewed
  const checkProductReview = await orderModel.findOne({
    "products.productId": productId,
    orderStatus: "Delivered",
  });
  if (!checkProductReview) {
    return next(
      new Error("Buy the product first, and then review it", { cause: 400 })
    );
  }

  // Check if the user has already reviewed the product
  const checkOnUserReview = await reviewModel.findOne({ userId });
  if (checkOnUserReview) {
    return next(new Error("You already reviewed this product", { cause: 400 }));
  }

  // Create Review Object and Upload it to DataBase
  const reviewObject = {
    userId,
    productId,
    reviewRate,
    reviewComment,
  };
  const review = await reviewModel.create(reviewObject);
  if (!review) {
    return next(new Error("Fail to add the Review", { cause: 400 }));
  }

  // Calculate The average of All Reviews
  const product = await productModel.findById(productId);
  const reviews = await reviewModel.find({ productId });
  let sumOfRates = 0;
  for (const review of reviews) {
    sumOfRates += review.reviewRate;
  }
  product.rate = (sumOfRates / reviews.length).toFixed(2);
  await product.save();

  res.status(201).json({ message: "Review added successfully", review });
};

// ===================== Update Review =================

const updateReview = async (req, res, next) => {
  const { _id: userId } = req.authUser;
  const { productId, reviewId } = req.query;
  const { reviewRate, reviewComment } = req.body;

  // Check On Review
  const checkOnUserReview = await reviewModel.findOne({
    userId,
    _id: reviewId,
  });
  if (!checkOnUserReview) {
    return next(new Error("You don't have review to edit", { cause: 400 }));
  }

  // Check on Product if accessed to be Reviewed
  const checkProductReview = await orderModel.findOne({
    "products.productId": productId,
    orderStatus: "Delivered",
  });
  if (!checkProductReview) {
    return next(
      new Error("You should buy the product to review it", { cause: 400 })
    );
  }
  // Update Data on Review
  if (reviewRate) checkOnUserReview.reviewRate = reviewRate;
  if (reviewComment) checkOnUserReview.reviewComment = reviewComment;
  checkOnUserReview.updatedBy = userId;
  await checkOnUserReview.save();

  // Calculate The average of All Reviews
  const product = await productModel.findById(productId);
  const reviews = await reviewModel.find({ productId });
  let sumOfRates = 0;
  for (const review of reviews) {
    sumOfRates += review.reviewRate;
  }
  product.rate = (sumOfRates / reviews.length).toFixed(2);
  await product.save();

  res.status(200).json({
    message: "Your Review has been updated successfully",
    checkOnUserReview,
  });
};

// ===================== Get All Reviews With Products =================

const getAllProductsWithReview = async (req, res, next) => {
  const products = await productModel.find().populate([
    {
      path: "Reviews",
    },
  ]);
  if (products.length) {
    res.status(200).json({ message: "Done", products });
  } else {
    return next(new Error("No Products to Show", { cause: 400 }));
  }
};

// ===================== Delete Review =================

const deleteReview = async (req, res, next) => {
  const { _id: userId } = req.authUser;
  const { reviewId } = req.query;

  const reviewExists = await reviewModel.findOneAndDelete({
    userId,
    _id: reviewId,
  });
  if (!reviewExists) {
    return next(new Error("Invalid reviewId", { cause: 400 }));
  }
  res
    .status(200)
    .json({ message: "Your Review has been deleted successfully" });
};

export { addReview, updateReview, getAllProductsWithReview, deleteReview };
