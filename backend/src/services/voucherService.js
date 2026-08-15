const Voucher = require("../models/voucher");
const UserVoucher = require("../models/userVoucher");
const User = require("../models/user");

const createVoucher = async (payload) => {
  try {
    const {
      code,
      title,
      description,
      type,
      value,
      freeItemId,
      costInCoins,
      minOrderValue,
      maxDiscountAmount,
      expirationDate,
      maxRedeems,
    } = payload;

    const existingVoucher = await Voucher.findOne({ code });
    if (existingVoucher) {
      return {
        statusCode: 400,
        success: false,
        message: "Mã voucher đã tồn tại",
      };
    }

    const newVoucher = await Voucher.create({
      code,
      title,
      description,
      type,
      value,
      freeItemId: type === "FREE_ITEM" ? freeItemId : null,
      costInCoins,
      minOrderValue,
      maxDiscountAmount,
      expirationDate,
      maxRedeems: maxRedeems || 0,
    });

    return {
      statusCode: 201,
      success: true,
      message: "Tạo voucher thành công",
      data: newVoucher,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi tạo voucher: " + error.message,
    };
  }
};

const getActiveVouchers = async () => {
  try {
    const currentDate = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      isDeleted: false,
      expirationDate: { $gt: currentDate },
      $expr: {
        $or: [
          { $eq: ["$maxRedeems", 0] }, // 0 means unlimited
          { $lt: ["$redeemedCount", "$maxRedeems"] },
        ],
      },
      // $expr là một toán tử MongoDB cho phép viết biểu thức (expression) ngay trong
      // câu lệnh truy vấn, hữu ích khi muốn so sánh giữa các field trong cùng một document
    }).sort({ costInCoins: 1 });

    return { statusCode: 200, success: true, data: vouchers };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy danh sách voucher: " + error.message,
    };
  }
};

const redeemVoucher = async (userEmail, voucherId) => {
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        statusCode: 404,
        success: false,
        message: "Người dùng không tồn tại",
      };
    }

    const voucher = await Voucher.findById(voucherId);
    if (!voucher) {
      return {
        statusCode: 404,
        success: false,
        message: "Voucher không tồn tại",
      };
    }

    if (!voucher.isActive || new Date(voucher.expirationDate) < new Date()) {
      return {
        statusCode: 400,
        success: false,
        message: "Voucher đã hết hạn hoặc không còn khả dụng",
      };
    }

    if (voucher.maxRedeems > 0 && voucher.redeemedCount >= voucher.maxRedeems) {
      return {
        statusCode: 400,
        success: false,
        message: "Voucher này đã hết lượt đổi",
      };
    }

    if (user.coins < voucher.costInCoins) {
      return {
        statusCode: 400,
        success: false,
        message: "Không đủ xu để đổi voucher này",
      };
    }

    // Deduct coins and increment redeemed count
    user.coins -= voucher.costInCoins;
    await user.save();
    voucher.redeemedCount += 1;
    await voucher.save();

    // Create user voucher
    const userVoucher = await UserVoucher.create({
      userEmail,
      voucher: voucher._id,
    });

    return {
      statusCode: 200,
      success: true,
      message: "Đổi voucher thành công",
      data: {
        userVoucher,
        remainingCoins: user.coins,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi đổi voucher: " + error.message,
    };
  }
};

const getMyVouchers = async (userEmail) => {
  try {
    const userVouchers = await UserVoucher.find({ userEmail, isUsed: false })
      .populate("voucher")
      .sort({ createdAt: -1 });

    // Filter out expired ones
    const activeUserVouchers = userVouchers.filter((uv) => {
      if (!uv.voucher) return false;
      return new Date(uv.voucher.expirationDate) > new Date();
    });

    return { statusCode: 200, success: true, data: activeUserVouchers };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy danh sách voucher của bạn: " + error.message,
    };
  }
};

const getAllAdminVouchers = async () => {
  try {
    const vouchers = await Voucher.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    return { statusCode: 200, success: true, data: vouchers };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy danh sách voucher (Admin): " + error.message,
    };
  }
};

const updateVoucher = async (voucherId, payload) => {
  try {
    const existingVoucher = await Voucher.findById(voucherId);
    if (!existingVoucher) {
      return {
        statusCode: 404,
        success: false,
        message: "Voucher không tồn tại",
      };
    }

    // Nếu đã có người đổi, chỉ cho phép sửa một số trường
    if (existingVoucher.redeemedCount > 0) {
      const { title, description, isActive, maxRedeems, expirationDate } =
        payload;
      payload = { title, description, isActive, maxRedeems, expirationDate };
    }

    const updatedVoucher = await Voucher.findByIdAndUpdate(voucherId, payload, {
      new: true,
    });
    return {
      statusCode: 200,
      success: true,
      message: "Cập nhật voucher thành công",
      data: updatedVoucher,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi cập nhật voucher: " + error.message,
    };
  }
};

const deleteVoucher = async (voucherId) => {
  try {
    const deletedVoucher = await Voucher.findByIdAndUpdate(voucherId, {
      isDeleted: true,
    });
    if (!deletedVoucher) {
      return {
        statusCode: 404,
        success: false,
        message: "Voucher không tồn tại",
      };
    }
    // Keep user vouchers for history.
    return {
      statusCode: 200,
      success: true,
      message: "Xóa voucher thành công",
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi xóa voucher: " + error.message,
    };
  }
};

module.exports = {
  createVoucher,
  getActiveVouchers,
  redeemVoucher,
  getMyVouchers,
  getAllAdminVouchers,
  updateVoucher,
  deleteVoucher,
};
