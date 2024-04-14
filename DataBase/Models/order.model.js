import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        finalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    subTotal: {
      type: Number,
      default: 0,
      required: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
    },
    paidAmount: {
      type: Number,
      default: 0,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumbers: [
      {
        type: String,
        required: true,
      },
    ],
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Placed",
        "On Way",
        "Delivered",
        "Cancelled",
        "Rejected",
      ],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Cash", "Card"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    CancellationReason: String,
  },
  { timestamps: true }
);

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;
