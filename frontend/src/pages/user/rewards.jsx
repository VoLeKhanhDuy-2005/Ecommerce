import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { Spin, notification, Modal } from "antd";
import { AuthContext } from "../../components/common/context/auth.context";
import {
  getActiveVouchersApi,
  redeemVoucherApi,
  getCurrentUserApi,
  getMyVouchersApi,
} from "../../apis";

import RewardsHeader from "../../components/user/rewards/RewardsHeader";
import AvailableVouchers from "../../components/user/rewards/AvailableVouchers";
import MyVouchers from "../../components/user/rewards/MyVouchers";

export default function RewardsPage() {
  const { auth, setAuth } = useContext(AuthContext);
  const [activeVouchers, setActiveVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [userCoins, setUserCoins] = useState(auth.user?.coins || 0);

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
      if (userRes && userRes.success && userRes.user) {
        setUserCoins(userRes.user.coins || 0);
        setAuth((prev) => ({
          ...prev,
          user: { ...prev.user, coins: userRes.user.coins || 0 },
        }));
      } else {
        setUserCoins(auth?.user?.coins || 0);
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
            setAuth({
              ...auth,
              user: { ...auth.user, coins: res.data.remainingCoins },
            });
            fetchVouchers();
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

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center max-w-sm w-full border border-gray-100">
          <p className="text-6xl mb-4">🔒</p>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Chưa đăng nhập</h2>
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
      <RewardsHeader userCoins={userCoins} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AvailableVouchers
          activeVouchers={activeVouchers}
          handleRedeem={handleRedeem}
          isRedeeming={isRedeeming}
          userCoins={userCoins}
        />
        <MyVouchers myVouchers={myVouchers} />
      </div>
    </div>
  );
}
