const Cart = require("../models/cart");
const Product = require("../models/product");
const { redisClient } = require("../config/redis");
const { getImagePresignedUrlByKey } = require("./fileService");
const CART_CACHE_PREFIX = process.env.CART_CACHE_PREFIX || "cart:";
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 604800;

const getCartCacheKey = (userEmail) => `${CART_CACHE_PREFIX}${userEmail}`;

const getCartRecommendations = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) return null;
  
  const cartProductIds = cart.items.map(item => item.product._id || item.product);
  const cartProductNames = cart.items.map(item => (item.product.name || "").toLowerCase());
  
  const foodKeywords = ["cơm", "phở", "bún", "lẩu", "gà", "burger", "pizza", "mì", "cháo", "bánh mì", "cuốn", "thịt", "cá"];
  const drinkKeywords = ["nước", "trà", "cafe", "cà phê", "sữa", "cam", "ép", "cola", "pepsi"];
  const snackKeywords = ["bánh", "khoai", "kem", "chè", "ăn vặt", "xúc xích"];

  const hasFood = cartProductNames.some(name => foodKeywords.some(k => name.includes(k)));
  const hasDrink = cartProductNames.some(name => drinkKeywords.some(k => name.includes(k)));

  let targetKeywords = [];
  let title = "Có thể bạn sẽ thích 😋";
  
  if (hasFood && !hasDrink) {
    targetKeywords = drinkKeywords;
    title = "Thêm ly nước cho bữa ăn hoàn hảo 🥤";
  } else if (!hasFood && hasDrink) {
    targetKeywords = snackKeywords.concat(foodKeywords);
    title = "Mua kèm món ăn lót dạ nhé 🥪";
  } else {
    targetKeywords = snackKeywords;
    title = "Mua kèm tráng miệng cho tròn vị 🍟";
  }

  let recommendedProducts = await Product.find({
    _id: { $nin: cartProductIds },
    name: { $regex: new RegExp(targetKeywords.join("|"), "i") }
  }).sort({ sold: -1 }).limit(4);

  if (recommendedProducts.length < 4) {
      const existingIds = cartProductIds.concat(recommendedProducts.map(p => p._id));
      const filler = await Product.find({ _id: { $nin: existingIds } }).sort({ sold: -1 }).limit(4 - recommendedProducts.length);
      recommendedProducts = [...recommendedProducts, ...filler];
  }

  const result = await Promise.all(
    recommendedProducts.map(async (product) => {
      const pObj = product.toObject ? product.toObject() : product;
      if (pObj.images?.length) {
        pObj.images = await Promise.all(
          pObj.images.map(getImagePresignedUrlByKey),
        );
      }
      return pObj;
    })
  );

  return { title, products: result };
};

const cacheCart = async (userEmail, cartData) => {
  try {
    if (redisClient.isReady) {
      await redisClient.setEx(
        getCartCacheKey(userEmail),
        CACHE_TTL,
        JSON.stringify(cartData),
      );
    }
  } catch (error) {
    console.error(`Lỗi khi lưu cache cho cart ${userEmail}:`, error.message);
  }
};

const invalidateCartCache = async (userEmail) => {
  try {
    if (redisClient.isReady) {
      await redisClient.del(getCartCacheKey(userEmail));
    }
  } catch (error) {
    console.error(`Lỗi khi xóa cache cho cart ${userEmail}:`, error.message);
  }
};

const getCart = async (userEmail) => {
  try {
    // Check Cache (Read-Aside)
    if (redisClient.isReady) {
      try {
        const cachedCart = await redisClient.get(getCartCacheKey(userEmail));
        if (cachedCart) {
          console.log(`[Cache Hit] Lấy giỏ hàng từ Redis cho ${userEmail}`);
          const cartData = JSON.parse(cachedCart);
          const recommendations = await getCartRecommendations(cartData);
          return {
            statusCode: 200,
            success: true,
            data: cartData,
            recommendations
          };
        }
      } catch (cacheError) {
        console.error(`[Cache Error] Lỗi đọc từ Redis: ${cacheError.message}`);
      }
    }

    console.log(`[Cache Miss] Đọc giỏ hàng từ MongoDB cho ${userEmail}`);
    // Fetch from DB
    let cart = await Cart.findOne({ userEmail }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }

    // Update Cache
    await cacheCart(userEmail, cart);
    
    const recommendations = await getCartRecommendations(cart);

    return { statusCode: 200, success: true, data: cart, recommendations };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi lấy thông tin giỏ hàng: " + error.message,
    };
  }
};

const addToCart = async (userEmail, productId, quantity = 1) => {
  try {
    if (!productId) {
      return { statusCode: 400, success: false, message: "Thiếu productId" };
    }
    const product = await Product.findById(productId);
    if (!product) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy sản phẩm này",
      };
    }

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      cart = await Cart.create({ userEmail, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      const newQuantity = cart.items[itemIndex].quantity + Number(quantity);
      if (newQuantity > product.stock) {
        return {
          statusCode: 400,
          success: false,
          message: `Không thể thêm số lượng đã chọn. Kho chỉ còn ${product.stock} sản phẩm.`,
        };
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      if (Number(quantity) > product.stock) {
        return {
          statusCode: 400,
          success: false,
          message: `Không thể thêm số lượng đã chọn. Kho chỉ còn ${product.stock} sản phẩm.`,
        };
      }
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );

    // Write-Through: Update Cache with fresh data
    await cacheCart(userEmail, updatedCart);
    const recommendations = await getCartRecommendations(updatedCart);
    return {
      statusCode: 200,
      success: true,
      message: "Đã thêm sản phẩm vào giỏ hàng",
      data: updatedCart,
      recommendations,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi thêm sản phẩm vào giỏ hàng: " + error.message,
    };
  }
};

const updateCartItem = async (userEmail, productId, quantity) => {
  try {
    if (!productId || quantity === undefined) {
      return {
        statusCode: 400,
        success: false,
        message: "Thiếu productId hoặc quantity",
      };
    }

    if (Number(quantity) < 1) {
      return {
        statusCode: 400,
        success: false,
        message: "Số lượng sản phẩm tối thiểu là 1",
      };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return {
        statusCode: 404,
        success: false,
        message: "Không tìm thấy sản phẩm",
      };
    }

    if (Number(quantity) > product.stock) {
      return {
        statusCode: 400,
        success: false,
        message: `Kho chỉ còn ${product.stock} sản phẩm. Vui lòng chọn lại số lượng.`,
      };
    }

    let cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return {
        statusCode: 404,
        success: false,
        message: "Giỏ hàng không tồn tại",
      };
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );
    if (itemIndex === -1) {
      return {
        statusCode: 404,
        success: false,
        message: "Sản phẩm không có trong giỏ hàng",
      };
    }

    cart.items[itemIndex].quantity = Number(quantity);
    await cart.save();

    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );

    // Write-Through: Update Cache
    await cacheCart(userEmail, updatedCart);
    const recommendations = await getCartRecommendations(updatedCart);
    return {
      statusCode: 200,
      success: true,
      message: "Đã cập nhật số lượng thành công",
      data: updatedCart,
      recommendations,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi cập nhật giỏ hàng: " + error.message,
    };
  }
};

const deleteCartItem = async (userEmail, productId) => {
  try {
    if (!productId) {
      return { statusCode: 400, success: false, message: "Thiếu productId" };
    }

    const cart = await Cart.findOne({ userEmail });
    if (!cart) {
      return {
        statusCode: 404,
        success: false,
        message: "Giỏ hàng không tồn tại",
      };
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );
    await cart.save();

    const updatedCart = await Cart.findOne({ userEmail }).populate(
      "items.product",
    );

    // Write-Through: Update Cache
    await cacheCart(userEmail, updatedCart);
    const recommendations = await getCartRecommendations(updatedCart);
    return {
      statusCode: 200,
      success: true,
      message: "Đã xóa sản phẩm khỏi giỏ hàng",
      data: updatedCart,
      recommendations,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi xóa sản phẩm khỏi giỏ hàng: " + error.message,
    };
  }
};

const clearCart = async (userEmail) => {
  try {
    const cart = await Cart.findOne({ userEmail });
    if (cart) {
      cart.items = [];
      await cart.save();
      await invalidateCartCache(userEmail);
    }

    return { statusCode: 200, success: true, message: "Đã xóa sạch giỏ hàng" };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi khi xóa sạch giỏ hàng: " + error.message,
    };
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
};
