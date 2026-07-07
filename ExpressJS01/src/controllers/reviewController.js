const {
  getProductReviews,
  addOrUpdateReview,
  deleteReview,
} = require("../services/reviewService");

const handleGetProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const result = await getProductReviews(id, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const handleAddReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({ EC: 1, EM: "Vui lòng chọn số sao" });
    }

    const email = req.user.email;
    const result = await addOrUpdateReview(email, id, rating, comment);

    if (result.EC === 0) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

const handleDeleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const email = req.user.email;
    const result = await deleteReview(email, id);

    if (result.EC === 0) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGetProductReviews,
  handleAddReview,
  handleDeleteReview,
};
