import mongoose, { Schema } from "mongoose";

const couponSchema = new Schema(
  {
    couponCode: {
      type: String,
      required: true,
      unique: true,
    },
    couponAmount: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 1,
    },
    isPercentage: {
      type: Boolean,
      required: true,
      default: false,
    },
    isFixedAmount: {
      type: Boolean,
      required: true,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    couponAssignedToUsers: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        maxUsage: {
          type: Number,
          required: true,
        },
        usageCount: {
          type: Number,
          default: 0,
        },
      },
    ],
    fromDate: {
      type: String,
      required: true,
    },
    toDate: {
      type: String,
      required: true,
    },
    couponStatus: {
      type: String,
      required: true,
      enum: ["Valid", "Expired"],
      default: "Valid",
    },
  },
  { timestamps: true }
);

const couponModel = mongoose.model("coupon", couponSchema);

export default couponModel;
