import cartModel from "../../../DataBase/Models/cart.model.js";
import productModel from "../../../DataBase/Models/product.model.js";

// ===================== Add To Cart =================

const addToCart = async (req, res, next) => {
  const { _id: userId } = req.authUser;
  const { productId, quantity } = req.body;

  // Check on Product
  const productCheck = await productModel.findOne({
    _id: productId,
    stock: { $gte: quantity },
  });
  if (!productCheck) {
    return next(new Error("Please Check the quantity", { cause: 400 }));
  }

  // Check if user already has Cart
  const userCart = await cartModel.findOne({ userId }).lean(); // to use methods on BSON as a object
  if (userCart) {
    // Update quantity
    let productExists = false;
    for (const product of userCart.products) {
      //==> BSON
      if (productId == product.productId) {
        productExists = true;
        product.quantity = quantity;
      }
    }

    // Push new product to Cart
    if (!productExists) {
      userCart.products.push({ productId, quantity });
    }

    // Update subTotal
    let subTotal = 0;
    for (const product of userCart.products) {
      const productExists = await productModel.findById(product.productId);
      subTotal += productExists.priceAfterDiscount * (product.quantity || 0);
    }

    // Update cart on DataBase
    // we didn't use save method as it only works on Objects
    const updatedCart = await cartModel.findOneAndUpdate(
      { userId },
      { subTotal, products: userCart.products, updatedBy: userId },
      { new: true }
    );
    return res
      .status(201)
      .json({ message: "Cart Updated successfully", updatedCart });
  }

  // Create Cart object
  const cartObject = {
    userId,
    products: [{ productId, quantity }],
    subTotal: productCheck.priceAfterDiscount * quantity,
  };
  const cart = await cartModel.create(cartObject);
  res.status(201).json({ message: "Product added to Cart", cart });
};

// ===================== Delete From Cart =================

const deleteFromCart = async (req, res, next) => {
  const { _id: userId } = req.authUser;
  const { productId } = req.query;
  // Check on Product
  const productCheck = await productModel.findById(productId);
  if (!productCheck) {
    return next(new Error("Invalid ProductId", { cause: 400 }));
  }

  // Check on User
  const userCart = await cartModel.findOne({
    userId,
    "products.productId": productId,
  });
  if (!userCart) {
    return next(new Error("Invalid ProductId in Cart", { cause: 400 }));
  }
  userCart.products.forEach((ele) => {
    if (ele.productId == productId) {
      userCart.products.splice(userCart.products.indexOf(ele), 1);
      userCart.subTotal -= productCheck.priceAfterDiscount * ele.quantity;
    }
  });
  userCart.updatedBy = userId;
  await userCart.save();
  res
    .status(200)
    .json({ message: "Product deleted from Cart successfully", userCart });
};

export { addToCart, deleteFromCart };
