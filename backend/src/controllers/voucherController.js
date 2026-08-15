const voucherService = require("../services/voucherService");

const createVoucher = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.createVoucher(
      req.body,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const getActiveVouchers = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.getActiveVouchers();
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const redeemVoucher = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.redeemVoucher(
      req.user.email,
      req.body.voucherId,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const getMyVouchers = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.getMyVouchers(
      req.user.email,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const getAllAdminVouchers = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.getAllAdminVouchers();
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const updateVoucher = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.updateVoucher(
      req.params.id,
      req.body,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
  }
};

const deleteVoucher = async (req, res, next) => {
  try {
    const { statusCode, ...data } = await voucherService.deleteVoucher(
      req.params.id,
    );
    return res.status(statusCode).json(data);
  } catch (error) {
    next(error);
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
