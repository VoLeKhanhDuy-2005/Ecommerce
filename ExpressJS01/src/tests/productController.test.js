const productController = require("../controllers/productController");
const productService = require("../services/productService");

// Mock the product service
jest.mock("../services/productService");

describe("Product Controller", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      query: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("searchProducts", () => {
    it("should return products successfully", async () => {
      const mockData = { products: [{ id: 1, name: "Product 1" }], total: 1 };
      productService.getProductsWithFilters.mockResolvedValue(mockData);

      await productController.searchProducts(mockReq, mockRes, mockNext);

      expect(productService.getProductsWithFilters).toHaveBeenCalledWith(
        mockReq.query,
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should call next with error if service throws", async () => {
      const mockError = new Error("Database error");
      productService.getProductsWithFilters.mockRejectedValue(mockError);

      await productController.searchProducts(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(mockError);
    });
  });

  describe("getHomePageProducts", () => {
    it("should return homepage products successfully", async () => {
      const mockData = { trending: [], newArrivals: [] };
      productService.getHomePageProducts.mockResolvedValue(mockData);

      await productController.getHomePageProducts(mockReq, mockRes, mockNext);

      expect(productService.getHomePageProducts).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
      });
    });
  });
});
