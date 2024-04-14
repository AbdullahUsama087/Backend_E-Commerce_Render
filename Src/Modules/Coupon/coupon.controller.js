import couponModel from "../../../DataBase/Models/coupon.model.js";
import userModel from "../../../DataBase/Models/user.model.js";

// ===================== Add Coupon =================

const addCoupon = async (req, res, next) => {
  const { _id } = req.authUser;
  const {
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    couponAssignedToUsers,
  } = req.body;

  // Check the Coupon is Unique
  const findCouponCode = await couponModel.findOne({ couponCode });
  if (findCouponCode) {
    return next(new Error("Duplicated Coupoun Code", { cause: 400 }));
  }

  // Check on Coupon Amount OR Coupon Percentage
  if ((!isFixedAmount && !isPercentage) || (isFixedAmount && isPercentage)) {
    return next(
      new Error("Please Select Coupon is Amount or Percentage", { cause: 400 })
    );
  }

  // Assign Coupon To Users
  let usersIds = [];
  for (const user of couponAssignedToUsers) {
    usersIds.push(user.userId);
  }
  console.log(usersIds);
  const usersCheck = await userModel.find({
    _id: {
      $in: usersIds, // To Check ID is contained by users Ids
    },
  });
  console.log(usersCheck);
  if (usersIds.length !== usersCheck.length) {
    return next(new Error("Invalid User IDs", { cause: 400 }));
  }
  // Upload Coupon on DataBase
  const couponObject = {
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    couponAssignedToUsers,
    createdBy: _id,
  };

  const coupon = await couponModel.create(couponObject);
  if (!coupon) {
    return next(new Error("Fail to Add Coupon", { cause: 400 }));
  }
  res.status(200).json({ message: "Coupon Added Successfully", coupon });
};

// ===================== Update Coupon =================

const updateCoupon = async (req, res, next) => {
  const {
    couponCode,
    couponAmount,
    isPercentage,
    isFixedAmount,
    fromDate,
    toDate,
    couponAssignedToUsers,
  } = req.body;
  const { couponId } = req.params;
  const { _id } = req.authUser;

  const couponExists = await couponModel.findOne({
    _id: couponId,
    createdBy: _id,
  });
  if (!couponExists) {
    return next(new Error("Invalid CouponId", { cause: 400 }));
  }

  if (couponCode) {
    // Check the Coupon Code is different from the old one
    if (couponExists.couponCode == couponCode) {
      return next(
        new Error(
          "You entered the same coupon code, Please enter a different one",
          { cause: 400 }
        )
      );
    }

    // Check the Coupon Code is Unique
    const findCouponCode = await couponModel.findOne({ couponCode });
    if (findCouponCode) {
      return next(
        new Error("This Coupon Code is already used", { cause: 400 })
      );
    }
    couponExists.couponCode = couponCode;
  }

  if (couponAmount) couponExists.couponAmount = couponAmount;
  if (isPercentage) couponExists.isPercentage = isPercentage;
  if (isFixedAmount) couponExists.isFixedAmount = isFixedAmount;
  if (fromDate) couponExists.fromDate = fromDate;
  if (toDate) couponExists.toDate = toDate;
  if (couponAssignedToUsers)
    couponExists.couponAssignedToUsers = couponAssignedToUsers;

  couponExists.updatedBy = _id;
  await couponExists.save();
  res
    .status(200)
    .json({ message: "Coupon Updated Successfully", couponExists });
};

// ===================== Get All Coupons =================

const getAllCoupons = async (req, res, next) => {
  const { _id } = req.authUser;
  const coupons = await couponModel.find({ createdBy: _id });
  if (coupons.length) {
    res.status(200).json({ message: "Done", coupons });
  } else {
    return next(new Error("No Coupons found", { cause: 400 }));
  }
};

// ===================== Delete Coupon =================

const deleteCoupon = async (req, res, next) => {
  const { couponId } = req.params;
  const { _id } = req.authUser;

  console.log(req.params);

  // Check if coupon exists and delete it
  const couponExists = await couponModel.findOneAndDelete({
    _id: couponId,
    createdBy: _id,
  });
  if (!couponExists) {
    return next(new Error("Invalid CouponId", { cause: 400 }));
  }
  res.status(200).json({ message: "Coupon deleted successfully" });
};

export { addCoupon, updateCoupon, getAllCoupons, deleteCoupon };
