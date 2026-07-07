const reviewController = require("../controllers/reviewController");
const reviewService = require("../services/reviewService");

// Mock the review service
jest.mock("../services/reviewService");

describe("Review Controller", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
      body: {},
      user: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("handleGetProductReviews", () => {
    it("should return product reviews successfully", async () => {
      mockReq.params.id = "product123";
      mockReq.query = { page: "1", limit: "5" };

      const mockResult = {
        EC: 0,
        EM: "Lấy danh sách đánh giá thành công",
        data: { reviews: [], total: 0, page: 1, totalPages: 0 },
      };

      reviewService.getProductReviews.mockResolvedValue(mockResult);

      await reviewController.handleGetProductReviews(
        mockReq,
        mockRes,
        mockNext,
      );

      expect(reviewService.getProductReviews).toHaveBeenCalledWith(
        "product123",
        1,
        5,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      mockReq.params.id = "product123";
      const mockError = new Error("Database error");
      reviewService.getProductReviews.mockRejectedValue(mockError);

      await reviewController.handleGetProductReviews(
        mockReq,
        mockRes,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("handleAddReview", () => {
    it("should return 400 if rating is missing", async () => {
      mockReq.params.id = "product123";
      mockReq.body = { comment: "Great!" };

      await reviewController.handleAddReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        EC: 1,
        EM: "Vui lòng chọn số sao",
      });
      expect(reviewService.addOrUpdateReview).not.toHaveBeenCalled();
    });

    it("should add review and return 200 on success", async () => {
      mockReq.params.id = "product123";
      mockReq.body = { rating: 5, comment: "Great!" };
      mockReq.user = { email: "test@example.com" };

      const mockResult = {
        EC: 0,
        EM: "Đánh giá sản phẩm thành công",
        data: { rating: 5, comment: "Great!" },
      };
      reviewService.addOrUpdateReview.mockResolvedValue(mockResult);

      await reviewController.handleAddReview(mockReq, mockRes, mockNext);

      expect(reviewService.addOrUpdateReview).toHaveBeenCalledWith(
        "test@example.com",
        "product123",
        5,
        "Great!",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it("should return 400 if service returns error", async () => {
      mockReq.params.id = "product123";
      mockReq.body = { rating: 5, comment: "Great!" };
      mockReq.user = { email: "test@example.com" };

      const mockResult = {
        EC: 1,
        EM: "Người dùng không tồn tại",
      };
      reviewService.addOrUpdateReview.mockResolvedValue(mockResult);

      await reviewController.handleAddReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error if service throws exception", async () => {
      mockReq.params.id = "product123";
      mockReq.body = { rating: 5, comment: "Great!" };
      mockReq.user = { email: "test@example.com" };

      const mockError = new Error("Database error");
      reviewService.addOrUpdateReview.mockRejectedValue(mockError);

      await reviewController.handleAddReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("handleDeleteReview", () => {
    it("should delete review and return 200 on success", async () => {
      mockReq.params.id = "product123";
      mockReq.user = { email: "test@example.com" };

      const mockResult = {
        EC: 0,
        EM: "Xóa đánh giá thành công",
      };
      reviewService.deleteReview.mockResolvedValue(mockResult);

      await reviewController.handleDeleteReview(mockReq, mockRes, mockNext);

      expect(reviewService.deleteReview).toHaveBeenCalledWith(
        "test@example.com",
        "product123",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it("should return 400 if service returns error", async () => {
      mockReq.params.id = "product123";
      mockReq.user = { email: "test@example.com" };

      const mockResult = {
        EC: 1,
        EM: "Không tìm thấy đánh giá để xóa",
      };
      reviewService.deleteReview.mockResolvedValue(mockResult);

      await reviewController.handleDeleteReview(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it("should call next with error if service throws exception", async () => {
      mockReq.params.id = "product123";
      mockReq.user = { email: "test@example.com" };

      const mockError = new Error("Database error");
      reviewService.deleteReview.mockRejectedValue(mockError);

      await reviewController.handleDeleteReview(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });
});
