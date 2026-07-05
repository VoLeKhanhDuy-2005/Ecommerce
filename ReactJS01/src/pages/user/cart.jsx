import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Spin,
  InputNumber,
  notification,
  Button,
  Empty,
  Steps,
  Input,
} from "antd";
import {
  DeleteOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CreditCardOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { AuthContext } from "../../components/context/auth.context";
import {
  getCartApi,
  updateCartItemApi,
  deleteCartItemApi,
  createOrderApi,
} from "../../util/api";

export default function CartPage() {
  const navigate = useNavigate();
  const { auth, setCartCount } = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(0);
  const [cart, setCart] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form thông tin giao hàng
  const [deliveryInfo, setDeliveryInfo] = useState({
    customerName: auth?.user?.name || "",
    phoneNumber: auth?.user?.phone || "",
    shippingAddress: auth?.user?.address || "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' hoặc 'MOMO'

  // Lấy dữ liệu giỏ hàng từ API
  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const res = await getCartApi();
      if (res && res.success) {
        setCart(res.data);
        // Cập nhật số lượng Badge trên Header
        const totalItems = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        setCartCount(totalItems);
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi tải giỏ hàng",
        description: "Không thể lấy thông tin giỏ hàng từ server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchCart();
    } else {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  // Thay đổi số lượng sản phẩm
  const handleQuantityChange = async (productId, quantity) => {
    try {
      const res = await updateCartItemApi(productId, quantity);
      if (res && res.success) {
        setCart(res.data);
        const totalItems = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        setCartCount(totalItems);
      } else {
        notification.error({
          message: "Lỗi cập nhật",
          description: res.message || "Không thể cập nhật số lượng.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Có lỗi xảy ra khi cập nhật số lượng.",
      });
    }
  };

  // Xóa sản phẩm khỏi giỏ hàng
  const handleDeleteItem = async (productId) => {
    try {
      const res = await deleteCartItemApi(productId);
      if (res && res.success) {
        setCart(res.data);
        const totalItems = res.data.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        setCartCount(totalItems);
        notification.success({
          message: "Đã xóa sản phẩm",
          description: "Món ăn đã được xóa khỏi giỏ hàng.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi hệ thống",
        description: "Không thể xóa sản phẩm khỏi giỏ hàng.",
      });
    }
  };

  // Tính tổng tiền giỏ hàng
  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      const productPrice =
        item.product.discountPrice && item.product.discountPrice > 0
          ? item.product.discountPrice
          : item.product.price;
      return sum + productPrice * item.quantity;
    }, 0);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Xử lý thay đổi thông tin form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryInfo((prev) => ({
      ...prev, //spread syntax
      // sao chép toàn bộ các thuộc tính (dữ liệu) hiện tại từ state cũ (prev)
      // sang một state mới, trước khi cập nhật đè lên thuộc tính mới
      // -> do State trong React là bất biến (immutable).
      // Nếu chỉ cập nhật trực tiếp deliveryInfo[name] = value,
      // React sẽ không nhận diện được sự thay đổi và giao diện (UI) sẽ không được cập nhật
      [name]: value,
    }));
  };

  // Tiến hành thanh toán / đặt đơn hàng
  const handlePlaceOrder = async () => {
    const { customerName, phoneNumber, shippingAddress } = deliveryInfo;
    if (
      !customerName.trim() ||
      !phoneNumber.trim() ||
      !shippingAddress.trim()
    ) {
      notification.warning({
        message: "Thông tin giao hàng thiếu",
        description:
          "Vui lòng nhập đầy đủ Tên, Số điện thoại và Địa chỉ nhận hàng.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerName,
        phoneNumber,
        shippingAddress,
        paymentMethod,
        items: cart.items.map((item) => {
          const productPrice =
            item.product.discountPrice && item.product.discountPrice > 0
              ? item.product.discountPrice
              : item.product.price;
          return {
            productId: item.product._id,
            name: item.product.name,
            price: productPrice,
            quantity: item.quantity,
          };
        }),
      };

      const res = await createOrderApi(orderPayload);

      if (res && res.success) {
        // Cập nhật giỏ hàng trống trên UI và Badge
        setCartCount(0);

        if (paymentMethod === "MOMO" && res.payUrl) {
          notification.success({
            message: "Đặt đơn thành công",
            description:
              "Đang chuyển hướng sang cổng thanh toán ví MoMo Sandbox...",
          });

          // Mở tab thanh toán MoMo
          window.location.href = res.payUrl;
        } else {
          // COD đặt hàng trực tiếp thành công
          notification.success({
            message: "🎉 Đặt hàng thành công!",
            description: "Đơn hàng COD của bạn đã được tiếp nhận.",
          });
          navigate("/orders");
        }
      } else {
        notification.error({
          message: "Đặt hàng thất bại",
          description: res.message || "Không thể tạo đơn hàng.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi đặt hàng",
        description: "Hệ thống gặp sự cố khi xử lý đơn hàng của bạn.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center max-w-sm w-full border border-gray-100">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Chưa đăng nhập
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Vui lòng đăng nhập tài khoản để xem và quản lý giỏ hàng của bạn.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center">
        <Spin size="large" />
        <p className="mt-4 text-gray-500">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  const isCartEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-20">
      <div className="mb-8">
        <Steps
          current={currentStep}
          items={[{ title: "Giỏ hàng" }, { title: "Giao hàng & Thanh toán" }]}
          className="max-w-md mx-auto"
        />
      </div>

      {currentStep === 0 ? (
        // BƯỚC 1: XEM GIỎ HÀNG
        isCartEmpty ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <Empty
              description={
                <span className="text-gray-500 text-sm">
                  Giỏ hàng của bạn đang trống rỗng.
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm"
            >
              Xem thực đơn chọn món
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm divide-y divide-gray-100">
              <h2 className="text-lg font-bold text-gray-800 pb-4 flex items-center gap-2">
                <ShoppingCartOutlined className="text-orange-500" /> Chi tiết
                giỏ hàng ({cart.items.length} món)
              </h2>

              {cart.items.map((item) => {
                const isDiscounted =
                  item.product.price != item.product.discountPrice;
                const activePrice = isDiscounted
                  ? item.product.discountPrice
                  : item.product.price;
                const originalPrice = item.product.price;

                return (
                  <div
                    key={item.product._id}
                    className="py-4 flex items-center gap-4"
                  >
                    <img
                      src={
                        item.product.images?.[0] || "https://placehold.co/100"
                      }
                      alt={item.product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                    />

                    <div className="flex-grow">
                      <Link
                        to={`/product/${item.product._id}`}
                        className="font-bold text-gray-800 hover:text-orange-500 transition-colors text-sm line-clamp-1"
                      >
                        {item.product.name}
                      </Link>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">Giá:</span>
                        <span className="text-sm font-bold text-orange-600">
                          {formatPrice(activePrice)}
                        </span>
                        {isDiscounted && (
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Số lượng */}
                    <div className="flex flex-col items-center gap-1.5">
                      <InputNumber
                        min={1}
                        max={item.product.stock}
                        value={item.quantity}
                        onChange={(value) =>
                          handleQuantityChange(item.product._id, value)
                        }
                        size="small"
                        className="w-16 rounded-lg text-center"
                      />
                      <span className="text-[10px] text-gray-400">
                        Kho: {item.product.stock}
                      </span>
                    </div>

                    {/* Nút xóa */}
                    <button
                      onClick={() => handleDeleteItem(item.product._id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Tổng quan hóa đơn */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">Tổng thanh toán</p>
                <p className="text-2xl font-black text-orange-600">
                  {formatPrice(calculateTotal())}
                </p>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all shadow-md hover:-translate-y-0.5"
              >
                Tiến hành thanh toán <ArrowRightOutlined />
              </button>
            </div>
          </div>
        )
      ) : (
        // BƯỚC 2: NHẬP THÔNG TIN VÀ CHỌN PHƯƠNG THỨC THANH TOÁN
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Thông tin giao hàng (2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
                📍 Thông tin giao hàng
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">
                    Họ và tên người nhận
                  </label>
                  <Input
                    name="customerName"
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Nhập họ tên đầy đủ"
                    value={deliveryInfo.customerName}
                    onChange={handleInputChange}
                    className="rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">
                    Số điện thoại
                  </label>
                  <Input
                    name="phoneNumber"
                    prefix={<PhoneOutlined className="text-gray-400" />}
                    placeholder="Nhập số điện thoại nhận hàng"
                    value={deliveryInfo.phoneNumber}
                    onChange={handleInputChange}
                    className="rounded-xl h-11"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">
                    Địa chỉ nhận hàng
                  </label>
                  <Input.TextArea
                    name="shippingAddress"
                    placeholder="Địa chỉ cụ thể (Số nhà, Tên đường, Phường/Xã, Quận/Huyện...)"
                    value={deliveryInfo.shippingAddress}
                    onChange={handleInputChange}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Chọn phương thức thanh toán */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
                💳 Phương thức thanh toán
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phương thức COD */}
                <div
                  onClick={() => setPaymentMethod("COD")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                    paymentMethod === "COD"
                      ? "border-orange-500 bg-orange-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-sm">
                      Thanh toán khi nhận hàng (COD)
                    </span>
                    <input
                      type="radio"
                      checked={paymentMethod === "COD"}
                      onChange={() => {}}
                      className="accent-orange-500 w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Nhận hàng và thanh toán tiền mặt trực tiếp cho shipper.
                  </p>
                  <span className="text-2xl mt-1">💵</span>
                </div>

                {/* Phương thức MOMO */}
                <div
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2 relative ${
                    paymentMethod === "MOMO"
                      ? "border-purple-600 bg-purple-50/30"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-sm">
                      Ví Điện Tử MoMo (Sandbox)
                    </span>
                    <input
                      type="radio"
                      checked={paymentMethod === "MOMO"}
                      onChange={() => {}}
                      className="accent-purple-600 w-4 h-4"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Tích hợp thanh toán thật qua cổng thử nghiệm Sandbox của ví
                    MoMo.
                  </p>
                  <span className="text-lg font-black text-purple-600 mt-1 flex items-center gap-1.5">
                    <span className="w-6 h-6 bg-pink-500 text-white rounded-lg flex items-center justify-center text-xs font-bold font-sans">
                      Mo
                    </span>
                    MoMo Payment
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tóm tắt đơn hàng (1/3 width) */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 sticky top-24">
              <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">
                📋 Tóm tắt đơn hàng
              </h2>

              <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1">
                {cart.items.map((item) => {
                  const activePrice =
                    item.product.discountPrice && item.product.discountPrice > 0
                      ? item.product.discountPrice
                      : item.product.price;
                  return (
                    <div
                      key={item.product._id}
                      className="flex justify-between items-center text-xs"
                    >
                      <span className="text-gray-600 font-medium line-clamp-1 max-w-[120px]">
                        {item.product.name}
                      </span>
                      <span className="text-gray-400 text-2xs">
                        x{item.quantity}
                      </span>
                      <span className="text-gray-800 font-bold">
                        {formatPrice(activePrice)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-500">
                  Thành tiền:
                </span>
                <span className="text-lg font-black text-orange-600">
                  {formatPrice(calculateTotal())}
                </span>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="primary"
                  onClick={handlePlaceOrder}
                  loading={isSubmitting}
                  className={`w-full h-11 rounded-xl font-bold border-none ${
                    paymentMethod === "MOMO"
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {paymentMethod === "MOMO"
                    ? "Thanh toán qua MoMo"
                    : "Đặt hàng COD"}
                </Button>

                <button
                  onClick={() => setCurrentStep(0)}
                  disabled={isSubmitting}
                  className="w-full h-10 border border-gray-200 text-gray-500 rounded-xl text-xs font-semibold hover:bg-gray-50 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
                >
                  <ArrowLeftOutlined /> Quay lại giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
