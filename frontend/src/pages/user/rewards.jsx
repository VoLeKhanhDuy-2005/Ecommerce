import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Spin, notification, Button, Empty, Modal } from "antd";
import {
  GiftOutlined,
  DollarOutlined,
  AppstoreAddOutlined,
  TagOutlined,
  DollarCircleFilled,
  CarFilled,
} from "@ant-design/icons";
import { AuthContext } from "../../components/context/auth.context";
import {
  getActiveVouchersApi,
  redeemVoucherApi,
  getCurrentUserApi,
  getMyVouchersApi,
} from "../../util/api";

export default function RewardsPage() {
  const { auth, setAuth } = useContext(AuthContext);
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userCoins, setUserCoins] = useState(auth.user?.coins || 0);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vouchersRes, userRes, myVouchersRes] = await Promise.all([
        getActiveVouchersApi(),
        getUserApi(),
        getMyVouchersApi(),
      ]);

      if (vouchersRes && vouchersRes.success) {
        setActiveVouchers(vouchersRes.data);
      }
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách voucher.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      fetchVouchers();
    } else {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await getActiveVouchersApi();
      if (res && res.success) {
        setActiveVouchers(res.data);
      }
      const myRes = await getMyVouchersApi();
      if (myRes && myRes.success) {
        setMyVouchers(myRes.data);
      }
      const userRes = await getCurrentUserApi();
      if (userRes && userRes.EC === 0 && userRes.user) {
        //request API thành công
        setUserCoins(userRes.user.coins || 0);
        setAuth((prev) => ({
          ...prev,
          user: { ...prev.user, coins: userRes.user.coins || 0 },
        }));
      } else {
        setUserCoins(auth?.user?.coins || 0); //auth?.user?.coins: lấy coins đang có trong context auth để hiển thị
      }
    } catch (error) {
      notification.error({ message: "Lỗi tải voucher" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async (voucherId, cost) => {
    if (userCoins < cost) {
      notification.warning({
        message: "Không đủ Xu",
        description: "Bạn không có đủ Xu để đổi voucher này.",
      });
      return;
    }

    Modal.confirm({
      title: "Xác nhận đổi Voucher",
      content: `Bạn có chắc chắn muốn dùng ${cost} Xu để đổi voucher này?`,
      onOk: async () => {
        setIsRedeeming(true);
        try {
          const res = await redeemVoucherApi(voucherId);
          if (res && res.success) {
            notification.success({
              message: "Đổi thành công!",
              description: "Voucher đã được thêm vào Kho Voucher của bạn.",
            });
            setUserCoins(res.data.remainingCoins);
            // Update auth state
            setAuth({
              ...auth,
              user: { ...auth.user, coins: res.data.remainingCoins },
            });
            fetchVouchers(); // Refresh list
          } else {
            notification.error({
              message: "Lỗi",
              description: res.message || "Đổi voucher thất bại.",
            });
          }
        } catch (error) {
          notification.error({
            message: "Lỗi hệ thống",
            description: "Vui lòng thử lại sau.",
          });
        } finally {
          setIsRedeeming(false);
        }
      },
    });
  };

  const getVoucherTypeIcon = (type) => {
    switch (type) {
      case "DISCOUNT_AMOUNT":
        return <DollarOutlined className="text-orange-500" />;
      case "DISCOUNT_PERCENT":
        return <TagOutlined className="text-pink-500" />;
      case "FREE_SHIP":
        return <CarFilled className="text-blue-500" />;
      case "FREE_ITEM":
        return <GiftOutlined className="text-purple-500" />;
      default:
        return <TagOutlined />;
    }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const getVoucherDescription = (v) => {
    if (v.type === "DISCOUNT_AMOUNT") return `Giảm ${formatPrice(v.value)}`;
    if (v.type === "DISCOUNT_PERCENT")
      return `Giảm ${v.value}% (Tối đa ${formatPrice(v.maxDiscountAmount)})`;
    if (v.type === "FREE_SHIP")
      return `Giảm ${formatPrice(v.value)} phí vận chuyển`;
    if (v.type === "FREE_ITEM") return `Tặng kèm sản phẩm miễn phí`;
    return "";
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center max-w-sm w-full border border-gray-100">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Chưa đăng nhập
          </h2>
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

  if (isLoading)
    return (
      <div className="flex justify-center p-20">
        <Spin size="large" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20 space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-20">
          <GiftOutlined style={{ fontSize: "200px" }} />
        </div>
        <div>
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <GiftOutlined /> Đổi Xu Nhận Quà
          </h1>
          <p className="text-orange-100 opacity-90">
            Tích lũy Xu từ các đơn hàng để nhận ngàn ưu đãi hấp dẫn!
          </p>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/30 text-center relative z-10">
          <p className="text-orange-100 text-sm font-semibold mb-1">
            Xu hiện có
          </p>
          <p className="text-4xl font-black text-white flex items-center gap-2 justify-center">
            <span className="text-yellow-300">
              <DollarCircleFilled
                style={{ color: "#FFD700", marginRight: 4 }}
              />
            </span>{" "}
            {userCoins}
          </p>
        </div>
      </div>

      {/* TABS / SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* AVAILABLE TO REDEEM */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <AppstoreAddOutlined className="text-orange-500" /> Voucher Đổi
            Thưởng
          </h2>
          {activeVouchers.length === 0 ? (
            <Empty description="Hiện chưa có voucher nào để đổi" />
          ) : (
            <div className="space-y-4">
              {activeVouchers.map((v) => (
                <div
                  key={v._id}
                  className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 relative overflow-hidden"
                >
                  <div className="w-16 h-16 bg-orange-50 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-orange-100">
                    {getVoucherTypeIcon(v.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm mb-1">
                      {v.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {v.description || getVoucherDescription(v)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] font-medium">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        Đơn Tối Thiểu: {formatPrice(v.minOrderValue)}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 shrink-0 border-l border-dashed border-gray-200 pl-4 ml-2">
                    <span className="text-orange-500 font-black text-lg">
                      <DollarCircleFilled
                        style={{ color: "#FFD700", marginRight: 4 }}
                      />{" "}
                      {v.costInCoins}
                    </span>
                    <Button
                      type="primary"
                      className="bg-orange-500 hover:bg-orange-600 border-none rounded-xl text-xs font-bold w-full"
                      onClick={() => handleRedeem(v._id, v.costInCoins)}
                      loading={isRedeeming}
                      disabled={userCoins < v.costInCoins}
                    >
                      Đổi Ngay
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MY VOUCHERS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
            <TagOutlined className="text-green-500" /> Kho Voucher Của Tôi
          </h2>
          {myVouchers.length === 0 ? (
            <Empty description="Bạn chưa có voucher nào" />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myVouchers.map((uv) => {
                const v = uv.voucher;
                if (!v) return null;
                return (
                  <div
                    key={uv._id}
                    className="bg-white border border-green-100 rounded-2xl p-4 shadow-sm flex flex-col relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-10">
                      Chưa sử dụng
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-xl shrink-0 border border-green-100 text-green-500">
                        {getVoucherTypeIcon(v.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-sm">
                          {v.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1">
                          {getVoucherDescription(v)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          HSD:{" "}
                          {new Date(v.expirationDate).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
