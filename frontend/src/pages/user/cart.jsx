import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Spin, notification, Empty, Steps } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import { AuthContext } from "../../components/common/context/auth.context";
import {
  getCartApi,
  addToCartApi,
  updateCartItemApi,
  deleteCartItemApi,
  createOrderApi,
  calculateShippingApi,
  resolveMapLinkApi,
  searchNominatim,
  getMyVouchersApi,
} from "../../apis";

import CartItemList from "../../components/user/cart/CartItemList";
import CartRecommendations from "../../components/user/cart/CartRecommendations";
import DeliveryForm from "../../components/user/cart/DeliveryForm";
import PaymentMethods from "../../components/user/cart/PaymentMethods";
import OrderSummary from "../../components/user/cart/OrderSummary";

import { formatCurrency } from "../../utils/formatter";

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
    note: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' hoặc 'MOMO'

  // GPS state
  const [shippingFee, setShippingFee] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coordinates, setCoordinates] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Voucher state
  const [myVouchers, setMyVouchers] = useState([]);
  const [selectedVoucherId, setSelectedVoucherId] = useState(null);

  // Lấy dữ liệu giỏ hàng từ API
  const fetchCart = async () => {
    setIsLoading(true);
    try {
      const res = await getCartApi();
      if (res && res.success) {
        setCart({ ...res.data, recommendations: res.recommendations });
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
    const fetchVouchers = async () => {
      try {
        const res = await getMyVouchersApi();
        if (res && res.success) {
          setMyVouchers(res.data);
        }
      } catch (error) {
        console.error("Lỗi tải voucher:", error);
        notification.error({
          message: "Lỗi tải voucher",
          description: "Không thể lấy thông tin voucher từ server.",
        });
      }
    };

    if (auth.isAuthenticated) {
      fetchCart();
      fetchVouchers();
    } else {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  // Tự động tính phí nếu user đã lưu vị trí trong profile
  useEffect(() => {
    const autoCalcShipping = async () => {
      const loc = auth?.user?.location;
      if (loc && loc.lat && loc.lng && !coordinates) {
        setCoordinates(loc);
        setIsGettingLocation(true);
        try {
          const res = await calculateShippingApi(loc.lat, loc.lng);
          if (res && res.success) {
            setShippingFee(res.data.fee);
            setDistance(res.data.distance);
          }
        } catch (e) {
          console.error("Lỗi tự động tính phí:", e);
          notification.error({
            message: "Lỗi tự động tính phí",
            description: "Không thể tự động tính phí.",
          });
        } finally {
          setIsGettingLocation(false);
        }
      }
    };
    autoCalcShipping();
  }, [auth?.user?.location]);

  // Thay đổi số lượng sản phẩm
  const handleQuantityChange = async (productId, quantity) => {
    try {
      const res = await updateCartItemApi(productId, quantity);
      if (res && res.success) {
        setCart((prev) => ({
          ...res.data,
          recommendations: res.recommendations || prev?.recommendations,
        }));
        //Chờ lấy gợi ý mới từ Backend. Nếu Backend không trả về gợi ý mới thì tiếp tục hiển thị gợi ý cũ thay vì làm trắng màn hình

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
        setCart((prev) => ({
          ...res.data,
          recommendations: res.recommendations || prev?.recommendations,
        }));
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

  const handleAddRecommendation = async (productId) => {
    try {
      const res = await addToCartApi(productId, 1);
      if (res && res.success) {
        notification.success({ message: "Đã thêm món vào giỏ hàng!" });
        fetchCart();
      } else {
        notification.error({
          message: res.message || "Không thể thêm vào giỏ hàng.",
        });
      }
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi hệ thống" });
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

  const calculateDiscount = () => {
    if (!selectedVoucherId) return 0;
    const uv = myVouchers.find(
      (v) => v.voucher && v.voucher._id === selectedVoucherId,
    );
    if (!uv || !uv.voucher) return 0;
    const v = uv.voucher;
    const total = calculateTotal();

    if (total < v.minOrderValue) return 0;

    if (v.type === "DISCOUNT_AMOUNT") {
      return v.value;
    } else if (v.type === "DISCOUNT_PERCENT") {
      const calcDiscount = (total * v.value) / 100;
      return v.maxDiscountAmount
        ? Math.min(calcDiscount, v.maxDiscountAmount)
        : calcDiscount;
    } else if (v.type === "FREE_SHIP") {
      return Math.min(shippingFee, v.value);
    }
    return 0; // FREE_ITEM logic
  };

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

  const handleGetLocation = () => {
    if ("geolocation" in navigator) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          try {
            const res = await calculateShippingApi(lat, lng);
            if (res && res.success) {
              setShippingFee(res.data.fee);
              setDistance(res.data.distance);
              notification.success({
                message: "Định vị thành công",
                description: `Khoảng cách ước tính: ${res.data.distance} km. Phí giao hàng: ${formatCurrency(
                  res.data.fee,
                )}`,
              });
            } else {
              notification.error({ message: "Lỗi tính phí giao hàng" });
            }
          } catch (e) {
            notification.error({
              message: "Lỗi kết nối khi tính phí giao hàng",
            });
          } finally {
            setIsGettingLocation(false);
          }
        },
        (error) => {
          notification.error({
            message: "Không thể lấy vị trí",
            description:
              "Vui lòng cho phép quyền truy cập vị trí trên trình duyệt của bạn.",
          });
          setIsGettingLocation(false);
        },
      );
    } else {
      notification.error({ message: "Trình duyệt không hỗ trợ định vị" });
    }
  };

  const handleSearchAddress = async () => {
    const address = deliveryInfo.shippingAddress;
    if (!address.trim()) {
      notification.warning({
        message: "Vui lòng nhập địa chỉ hoặc dán link Google Maps",
      });
      return;
    }

    setIsSearchingAddress(true);
    try {
      let lat, lng;
      const isUrl = address.includes("http://") || address.includes("https://");

      if (isUrl) {
        // Xử lý link Google Maps (dài hoặc ngắn)
        const response = await resolveMapLinkApi(address);
        if (response && response.success && response.data) {
          lat = response.data.lat;
          lng = response.data.lng;
        } else if (response && response.isPlaceName && response.placeName) {
          // Fallback: Nếu backend trích xuất được tên địa điểm nhưng không có tọa độ
          const nomData = await searchNominatim(response.placeName);
          if (nomData && nomData.length > 0) {
            lat = parseFloat(nomData[0].lat);
            lng = parseFloat(nomData[0].lon);
          } else {
            notification.warning({
              message: "Không tìm thấy tọa độ",
              description: `Không thể định vị được địa điểm: ${response.placeName}.`,
            });
            setIsSearchingAddress(false);
            return;
          }
        } else {
          notification.warning({
            message: "Không tìm thấy tọa độ",
            description:
              response?.message || "Vui lòng kiểm tra lại link Google Maps.",
          });
          setIsSearchingAddress(false);
          return;
        }
      } else {
        // Xử lý địa chỉ chữ (Geocoding)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
        );
        const data = await response.json();

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
        } else {
          notification.warning({
            message: "Không tìm thấy địa chỉ",
            description:
              "Vui lòng ghi rõ tên đường, phường/xã, quận/huyện hoặc nhập link Google Maps.",
          });
          setIsSearchingAddress(false);
          return;
        }
      }

      if (lat && lng) {
        setCoordinates({ lat, lng });
        notification.success({
          message: "Tìm thấy vị trí",
          description:
            "Đã cập nhật vị trí trên bản đồ, đang tính lại phí giao hàng...",
        });

        const resShipping = await calculateShippingApi(lat, lng);
        if (resShipping && resShipping.success) {
          setShippingFee(resShipping.data.fee);
          setDistance(resShipping.data.distance);
        } else {
          notification.error({ message: "Lỗi tính phí giao hàng" });
        }
      }
    } catch (error) {
      console.error(error);
      notification.error({ message: "Lỗi kết nối khi tìm kiếm vị trí" });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleMapChange = async ({ lat, lng }) => {
    setCoordinates({ lat, lng });
    setIsGettingLocation(true);
    try {
      const res = await calculateShippingApi(lat, lng);
      if (res && res.success) {
        setShippingFee(res.data.fee);
        setDistance(res.data.distance);
        notification.success({
          message: "Đã cập nhật phí giao hàng",
          description: `Khoảng cách ước tính: ${res.data.distance} km. Phí giao hàng: ${formatCurrency(res.data.fee)}`,
        });
      } else {
        notification.error({ message: "Lỗi tính phí giao hàng" });
      }
    } catch (e) {
      notification.error({ message: "Lỗi kết nối khi tính phí giao hàng" });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Tiến hành thanh toán / đặt đơn hàng
  const handlePlaceOrder = async () => {
    const { customerName, phoneNumber, shippingAddress, note } = deliveryInfo;
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
        lat: coordinates?.lat,
        lng: coordinates?.lng,
        voucherId: selectedVoucherId,
        note,
      };

      const res = await createOrderApi(orderPayload);

      if (res && res.success) {
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
            <CartItemList
              cartItems={cart.items}
              handleQuantityChange={handleQuantityChange}
              handleDeleteItem={handleDeleteItem}
              formatCurrency={formatCurrency}
            />

            <CartRecommendations
              recommendations={cart.recommendations}
              handleAddRecommendation={handleAddRecommendation}
              formatCurrency={formatCurrency}
            />

            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400">Tổng thanh toán</p>
                <p className="text-2xl font-black text-orange-600">
                  {formatCurrency(calculateTotal())}
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
            <DeliveryForm
              deliveryInfo={deliveryInfo}
              handleInputChange={handleInputChange}
              handleSearchAddress={handleSearchAddress}
              isSearchingAddress={isSearchingAddress}
              handleGetLocation={handleGetLocation}
              isGettingLocation={isGettingLocation}
              coordinates={coordinates}
              handleMapChange={handleMapChange}
              distance={distance}
            />

            <PaymentMethods
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </div>

          {/* Tóm tắt đơn hàng (1/3 width) */}
          <div className="space-y-6">
            <OrderSummary
              cartItems={cart.items}
              formatCurrency={formatCurrency}
              calculateTotal={calculateTotal}
              shippingFee={shippingFee}
              myVouchers={myVouchers}
              selectedVoucherId={selectedVoucherId}
              setSelectedVoucherId={setSelectedVoucherId}
              calculateDiscount={calculateDiscount}
              handlePlaceOrder={handlePlaceOrder}
              isSubmitting={isSubmitting}
              paymentMethod={paymentMethod}
              setCurrentStep={setCurrentStep}
            />
          </div>
        </div>
      )}
    </div>
  );
}
