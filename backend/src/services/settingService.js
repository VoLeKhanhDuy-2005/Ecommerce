const Setting = require("../models/setting");

const getSettings = async () => {
  try {
    const settings = await Setting.find({});
    // Chuyển array thành object dạng { key: value }
    const settingsObj = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    /*
      settings: mảng các phần tử.
      reduce(): duyệt qua từng phần tử của mảng và "gom" chúng thành một giá trị duy nhất.
      acc (accumulator): đối tượng đang được xây dựng.
      curr (current): phần tử hiện tại.
      {}: giá trị khởi tạo của acc (một object rỗng)
    */

    // Đảm bảo luôn có store_location mặc định nếu chưa ai cấu hình
    if (!settingsObj.store_location) {
      settingsObj.store_location = {
        lat: 10.850438,
        lng: 106.772596,
      };
    }

    return { statusCode: 200, success: true, data: settingsObj };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi lấy cấu hình: " + error.message,
    };
  }
};

const updateSetting = async (key, value) => {
  try {
    if (!key) {
      return { statusCode: 400, success: false, message: "Thiếu key cấu hình" };
    }
    const updated = await Setting.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true },
    );
    return {
      statusCode: 200,
      success: true,
      message: "Cập nhật cấu hình thành công",
      data: updated,
    };
  } catch (error) {
    return {
      statusCode: 500,
      success: false,
      message: "Lỗi cập nhật cấu hình: " + error.message,
    };
  }
};

module.exports = {
  getSettings,
  updateSetting,
};
