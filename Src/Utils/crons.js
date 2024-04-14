import { scheduleJob } from "node-schedule";
import couponModel from "../../DataBase/Models/coupon.model.js";
import { DateTime } from "luxon";

function changeCouponStatus() {
  scheduleJob("* */60 * * * *", async () => {
    const validCoupons = await couponModel.find({ couponStatus: "Valid" });
    for (const coupon of validCoupons) {
      if (coupon.toDate < DateTime.now().toISODate()) {
        coupon.couponStatus = "Expired";
      }
      await coupon.save();
    }

    console.log("Change coupon status Cron is running");
  });
}

export { changeCouponStatus };
