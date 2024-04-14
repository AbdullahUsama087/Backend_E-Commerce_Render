import { nanoid } from "nanoid";
import cartModel from "../../../DataBase/Models/cart.model.js";

import couponModel from "../../../DataBase/Models/coupon.model.js";

import orderModel from "../../../DataBase/Models/order.model.js";

import productModel from "../../../DataBase/Models/product.model.js";

import isCouponValid from "../../Utils/couponValidation.js";

import createInvoice from "../../Utils/pdfInvoice.js";

import sendEmailService from "../../Services/sendEmail.js";

import generateQrCode from "../../Utils/QrCodeFunction.js";

import paymentFunction from "../../Utils/payment.js";

import { generateToken, verifyToken } from "../../Utils/tokenFunctions.js";

import Stripe from "stripe";

// ===================== Create Order =================

const createOrder = async (req, res, next) => {
  const { _id: userId, email } = req.authUser;
  const {
    productId,
    quantity,
    address,
    phoneNumbers,
    paymentMethod,
    couponCode,
  } = req.body;

  // Check Coupon
  if (couponCode) {
    const coupon = await couponModel.findOne({ couponCode });
    const checkCoupon = await isCouponValid({ couponCode, userId });
    if (checkCoupon !== true) {
      return next(new Error(checkCoupon.msg, { cause: 400 }));
    }
    req.coupon = coupon;
  }
  // Check Products
  const checkProduct = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  });
  if (!checkProduct) {
    return next(new Error("No avaailable products in Stock", { cause: 400 }));
  }

  // Create Product Object and Push it to products array
  const products = [];
  const productObject = {
    productId,
    quantity,
    title: checkProduct.title,
    price: checkProduct.priceAfterDiscount,
    finalPrice: checkProduct.priceAfterDiscount * quantity,
  };
  products.push(productObject);

  // Calculate subTotal
  const subTotal = productObject.finalPrice;
  if (
    req.coupon?.isFixedAmount &&
    req.coupon?.isFixedAmount > checkProduct.priceAfterDiscount
  ) {
    return next(new Error("Please Select another Product", { cause: 400 }));
  }

  // Calculate Paid Amount
  let paidAmount = 0;
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal - (subTotal * (req.coupon.couponAmount || 0)) / 100;
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount;
  } else {
    paidAmount = subTotal;
  }

  // Choose Payment Method and Select Order Status
  let orderStatus;
  if (paymentMethod == "Cash") {
    orderStatus = "Placed";
  } else {
    orderStatus = "Pending";
  }

  // Create Order Object
  const orderObject = {
    userId,
    products,
    address,
    phoneNumbers,
    orderStatus,
    paymentMethod,
    subTotal,
    paidAmount,
    couponId: req.coupon?._id,
  };
  const order = await orderModel.create(orderObject);
  if (!order) {
    return next(new Error("Fail to create order", { cause: 400 }));
  }
  // Order Payment With Stripe
  let orderSession;
  if (order.paymentMethod == "Card") {
    // Apply Coupon On Payment Stripe
    if (req.coupon) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let coupon;
      // If Coupon is Percentage
      if (req.coupon.isPercentage) {
        coupon = await stripe.coupons.create({
          percent_off: req.coupon.couponAmount,
        });
      }
      // If Coupon is Amount
      if (req.coupon.isFixedAmount) {
        coupon = await stripe.coupons.create({
          amount_off: req.coupon.couponAmount,
          currency: "EGP",
        });
      }
      req.couponId = coupon.id;
    }
    // generate payment token
    const token = generateToken({
      payload: { orderId: order._id },
      signature: process.env.ORDER_TOKEN,
      expiresIn: "1h",
    });
    console.log(
      `${req.protocol}://${req.headers.host}/order/successOrder?token=${token}`
    );
    orderSession = await paymentFunction({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      metadata: { orderId: order._id.toString() },
      success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${token}`,
      cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${token}`,
      line_items: order.products.map((ele) => {
        return {
          price_data: {
            currency: "EGP",
            product_data: {
              name: ele.title,
            },
            unit_amount: ele.price * 100,
          },
          quantity: ele.quantity,
        };
      }),
      discounts: req.couponId ? [{ coupon: req.couponId }] : [],
    });
  }

  // Increase Usage Count for Coupon User
  if (req.coupon) {
    for (const user of req.coupon.couponAssignedToUsers) {
      if (user.userId.toString() == userId.toString()) {
        user.usageCount++;
      }
    }
    await req.coupon.save();
  }
  // decrease Product's Stock by order's product quantity
  await productModel.findOneAndUpdate(
    { _id: productId },
    { $inc: { stock: -parseInt(quantity) } }
  );
  // TODO: Remove Product from User Cart after Order

  //======>>>>> Generate QrCode for Order
  const orderQR = await generateQrCode({
    data: { orderId: order._id, Products: order.products },
  });

  // ===>>>>> Create Invoice
  const orderCode = `${req.authUser.userName}_${nanoid(3)}`;
  //generate Invoice Object
  const orderInvoice = {
    shipping: {
      name: req.authUser.userName,
      address: order.address,
      city: "Mansoura",
      state: "Dakahliya",
      country: "Cairo",
    },
    orderCode,
    date: order.createdAt,
    items: order.products,
    subTotal: order.subTotal,
    paidAmount: order.paidAmount,
  };
  createInvoice(orderInvoice, `${orderCode}.pdf`);
  res.status(201).json({
    message: "Successful order processed",
    order,
    checkoutURL: orderSession?.url,
  });

  // send email with payment invoice
  await sendEmailService({
    to: req.authUser.email,
    subject: "Order Confirmation Invoice",
    message: `<h1>Please Check your invoice PDF</h1>`,
    attachments: [
      {
        path: `/Files/${orderCode}.pdf`,
      },
    ],
  });
};

// ===================== Create Order From Cart =================

const orderFromCart = async (req, res, next) => {
  const { _id: userId, email } = req.authUser;
  const { cartId } = req.params;
  const { address, phoneNumbers, paymentMethod, couponCode } = req.body;

  // Check if Cart exists and has products
  const cart = await cartModel.findById(cartId);
  if (!cart || !cart.products.length) {
    return next(
      new Error("Your Cart is empty, Please Choose product to buy", {
        cause: 400,
      })
    );
  }

  // Check on Coupon
  if (couponCode) {
    const coupon = await couponModel.findOne({ couponCode });
    const checkCoupon = await isCouponValid({ couponCode, userId });
    if (checkCoupon !== true) {
      return next(new Error(checkCoupon.msg, { cause: 400 }));
    }
    req.coupon = coupon;
  }

  // Check on Order Products
  const orderProducts = [];
  for (const product of cart.products) {
    const checkProduct = await productModel.findById(product.productId);
    orderProducts.push({
      productId: product.productId,
      quantity: product.quantity,
      title: checkProduct.title,
      price: checkProduct.priceAfterDiscount,
      finalPrice: checkProduct.priceAfterDiscount * product.quantity,
    });
  }

  // Calculate subTotal
  const subTotal = cart.subTotal;

  if (req.coupon?.isFixedAmount && req.coupon?.isFixedAmount > subTotal) {
    return next(new Error("Please Select another Products", { cause: 400 }));
  }

  // Calculate Paid Amount
  let paidAmount = 0;
  if (req.coupon?.isPercentage) {
    paidAmount = subTotal - (subTotal * (req.coupon.couponAmount || 0)) / 100;
  } else if (req.coupon?.isFixedAmount) {
    paidAmount = subTotal - req.coupon.couponAmount;
  } else {
    paidAmount = subTotal;
  }

  // Choose Payment Method and Select Order Status
  let orderStatus;
  if (paymentMethod == "Cash") {
    orderStatus = "Placed";
  } else {
    orderStatus = "Pending";
  }

  // Create Order Object and Upload On DataBase
  const orderObject = {
    userId,
    products: orderProducts,
    address,
    phoneNumbers,
    orderStatus,
    paymentMethod,
    subTotal,
    paidAmount,
    couponId: req.coupon?._id,
  };
  const order = await orderModel.create(orderObject);
  if (!order) {
    return next(new Error("Fail to Create Order", { cause: 400 }));
  }

  // Order Payment With Stripe
  let orderSession;
  if (order.paymentMethod == "Card") {
    // Apply Coupon On Payment Stripe
    if (req.coupon) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      let coupon;
      // If Coupon is Percentage
      if (req.coupon.isPercentage) {
        coupon = await stripe.coupons.create({
          percent_off: req.coupon.couponAmount,
        });
      }
      // If Coupon is Amount
      if (req.coupon.isFixedAmount) {
        coupon = await stripe.coupons.create({
          amount_off: req.coupon.couponAmount,
          currency: "EGP",
        });
      }
      req.couponId = coupon.id;
    }

    // generate payment token
    const token = generateToken({
      payload: { orderId: order._id },
      signature: process.env.ORDER_TOKEN,
      expiresIn: "1h",
    });

    orderSession = await paymentFunction({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      metadata: { orderId: order._id.toString() },
      success_url: `${req.protocol}://${req.headers.host}/order/successOrder?token=${token}`,
      cancel_url: `${req.protocol}://${req.headers.host}/order/cancelOrder?token=${token}`,
      line_items: order.products.map((ele) => {
        return {
          price_data: {
            currency: "EGP",
            product_data: {
              name: ele.title,
            },
            unit_amount: ele.price * 100,
          },
          quantity: ele.quantity,
        };
      }),
      discounts: req.couponId ? [{ coupon: couponId }] : [],
    });
  }

  // Increase Usage Count for Coupon User
  if (req.coupon) {
    for (const user of req.coupon.couponAssignedToUsers) {
      if (user.userId.toString() == userId.toString()) {
        user.usageCount++;
      }
    }
    await req.coupon.save();
  }

  // decrease Product's Stock by order's product quantity
  for (const product of cart.products) {
    await productModel.findOneAndUpdate(
      { _id: product.productId },
      { $inc: { stock: -parseInt(product.quantity) } }
    );
  }

  // Remove Product from User Cart after Order
  cart.products = [];
  cart.subTotal = 0;
  await cart.save();

  //======>>>>> Generate QrCode for Order
  const orderQR = await generateQrCode({
    data: { orderId: order._id, Products: order.products },
  });

  // ===>>>>> Create Invoice
  const orderCode = `${req.authUser.userName}_${nanoid(3)}`;
  //generate Invoice Object
  const orderInvoice = {
    shipping: {
      name: req.authUser.userName,
      address: order.address,
      city: "Mansoura",
      state: "Dakahliya",
      country: "Cairo",
    },
    orderCode,
    date: order.createdAt,
    items: order.products,
    subTotal: order.subTotal,
    paidAmount: order.paidAmount,
  };
  createInvoice(orderInvoice, `${orderCode}.pdf`);
  res.status(201).json({
    message: "Successful order processed",
    order,
    checkoutURL: orderSession.url,
  });

  // send email with payment invoice
  await sendEmailService({
    to: req.authUser.email,
    subject: "Order Confirmation Invoice",
    message: `<h1>Please Check your invoice PDF</h1>`,
    attachments: [
      {
        path: `/Files/${orderCode}.pdf`,
      },
    ],
  });

  res
    .status(201)
    .json({ message: "Order Created from Cart successfully", cart, order });
};

// ===================== Success Order =================

const successPayment = async (req, res, next) => {
  const { token } = req.query;
  const decodedData = verifyToken({
    token,
    signature: process.env.ORDER_TOKEN,
  });
  const order = await orderModel.findOne({
    _id: decodedData.orderId,
    orderStatus: "Pending",
  });
  if (!order) {
    return next(new Error("Invalid OrderId", { cause: 400 }));
  }
  order.orderStatus = "Confirmed";
  await order.save();
  res
    .status(200)
    .json({ message: "Your Order Is Confirmed Successfully", order });
};

// ===================== Cancel Payment =================

const cancelPayment = async (req, res, next) => {
  const { token } = req.query;
  const decodedData = verifyToken({
    token,
    signature: process.env.ORDER_TOKEN,
  });
  const order = await orderModel.findOne({ _id: decodedData.orderId });
  if (!order) {
    return next(new Error("Invalid OrderId", { cause: 400 }));
  }
  // =>>>>> Approch 1 ---- Update orderStatus to Cancelled
  order.orderStatus = "Cancelled";
  await order.save();

  // =>>>>> Approch 2 ---- Delete Order
  // await orderModel.findByIdAndDelete(decodedData.orderId)

  // =>>>>> Undo product (Return Products to Stock)
  for (const product of order.products) {
    await productModel.findByIdAndUpdate(product.productId, {
      $inc: { stock: parseInt(product.quantity) },
    });
  }

  // Undo coupon Usage
  if (order.couponId) {
    const coupon = await couponModel.findById(order.couponId);
    if (!coupon) {
      return next(new Error("Coupon not found", { cause: 400 }));
    }
    coupon.couponAssignedToUsers.map((ele) => {
      if (ele.userId.toString() == order.userId.toString()) {
        ele.usageCount--;
      }
    });
    await coupon.save();
  }
  res.status(200).json({ message: "Your Order Is Cancelled", order });
};

// ===================== Deliver Order to User =================

const deliverOrder = async (req, res, next) => {
  const { orderId } = req.query;

  const order = await orderModel.findOneAndUpdate(
    {
      _id: orderId,
      orderStatus: { $nin: ["Pending", "Cancelled", "Rejected"] },
    },
    { orderStatus: "Delivered" },
    { new: true }
  );
  if (!order) {
    return next(new Error("Invalid Order", { cause: 400 }));
  }
  res.status(200).json({ message: "Done", order });
};

export {
  createOrder,
  orderFromCart,
  successPayment,
  cancelPayment,
  deliverOrder,
};
