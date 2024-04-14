import { DateTime } from "luxon";
import couponModel from "../../DataBase/Models/coupon.model.js";

async function isCouponValid({ couponCode, userId } = {}) {
  const coupon = await couponModel.findOne({ couponCode });
  // Check if Coupon exist or valid
  if (!coupon) {
    // return next(
    //   new Error("This Coupon is not valid, please enter a valid coupon", {
    //     cause: 400,
    //   })
    // );
    return {
      msg: "This Coupon is not valid, please enter a valid coupon",
    };
  }
  // Check Coupon Expiration
  if (
    coupon.couponStatus == "Expired" ||
    coupon.toDate < DateTime.now().toISODate()
  ) {
    // return next(new Error("Coupon is expired", { cause: 400 }));
    return {
      msg: "Coupon is Expired",
    };
  }
  let notAssignedUsers = [];
  let exceedUsageFlag = false;
  for (const user of coupon.couponAssignedToUsers) {
    // Check if coupon is not assigned to user
    notAssignedUsers.push(user.userId.toString());
    // Check if user exceeded limit of usage count
    if (userId.toString() == user.userId.toString()) {
      if (user.usageCount >= user.maxUsage) {
        exceedUsageFlag = true;
        // return next(
        //   new Error("You exceeded the maximum usage for this Coupon", {
        //     cause: 400,
        //   })
        // );
      }
    }
  }

  if (!notAssignedUsers.includes(userId.toString())) {
    return {
      notAssigned: true,
      msg: "This User is not assigned for this Coupon",
    };
  }

  if (exceedUsageFlag) {
    return {
      msg: "Exceeded Max Usage for this Coupon",
    };
  }

  return true;
}

export default isCouponValid;
