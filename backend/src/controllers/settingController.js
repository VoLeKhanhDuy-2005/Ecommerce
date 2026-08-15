const settingService = require("../services/settingService");

const getSettings = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await settingService.getSettings();
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const updateSetting = async (req, res, next) => {
  try {
    const { key, value } = req.body;
    const { statusCode, ...data } = await settingService.updateSetting(
      key,
      value,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSetting,
};
