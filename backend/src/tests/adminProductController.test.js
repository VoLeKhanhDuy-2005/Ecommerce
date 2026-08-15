const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/adminProductController");
const Product = require("../models/product");
const fileService = require("../services/fileService");

jest.mock("../models/product");
jest.mock("../services/fileService");

describe("Admin Product Controller", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      files: [],
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getAllProducts", () => {
    it("should return products successfully", async () => {
      const mockProducts = [
        {
          _id: "1",
          name: "Test",
          images: ["img1"],
          toObject: () => ({ name: "Test", images: ["img1"] }),
        },
      ];
      Product.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockProducts),
      });
      fileService.getImagePresignedUrlByKey.mockResolvedValue("presigned-url");

      await getAllProducts(mockReq, mockRes);

      expect(Product.find).toHaveBeenCalledWith({});
      expect(fileService.getImagePresignedUrlByKey).toHaveBeenCalledWith(
        "img1",
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          EC: 0,
          data: [{ name: "Test", images: ["presigned-url"] }],
        }),
      );
    });

    it("should handle error", async () => {
      Product.find.mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("DB Error")),
      });

      await getAllProducts(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: -1 }),
      );
    });
  });

  describe("createProduct", () => {
    it("should return 400 if fields are missing", async () => {
      await createProduct(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: 1, EM: expect.any(String) }),
      );
    });

    it("should return 400 if no images are provided", async () => {
      mockReq.body = {
        name: "Test",
        description: "Desc",
        price: 100,
        discountPercent: 10,
        category: "cat",
        stock: 5,
      };
      await createProduct(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should create product successfully", async () => {
      mockReq.body = {
        name: "Test",
        description: "Desc",
        price: 100,
        discountPercent: 10,
        category: "cat",
        stock: 5,
        imageUrls: "url1, url2",
      };
      mockReq.files = [{ originalname: "file1" }];
      fileService.uploadFileToS3.mockResolvedValue("s3-key-1");
      const createdProduct = { _id: "new-id", name: "Test" };
      Product.create.mockResolvedValue(createdProduct);

      await createProduct(mockReq, mockRes);

      expect(fileService.uploadFileToS3).toHaveBeenCalledTimes(1);
      expect(Product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test",
          price: 100,
          discountPercent: 10,
          images: ["url1", "url2", "s3-key-1"],
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: 0, data: createdProduct }),
      );
    });
  });

  describe("updateProduct", () => {
    beforeEach(() => {
      mockReq.params = { id: "prod-id" };
      mockReq.body = {
        name: "Test Update",
        description: "Desc Update",
        price: 150,
        discountPercent: 0,
        category: "cat",
        stock: 10,
      };
    });

    it("should return 404 if product not found", async () => {
      Product.findById.mockResolvedValue(null);
      await updateProduct(mockReq, mockRes);
      expect(Product.findById).toHaveBeenCalledWith("prod-id");
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should update product successfully without new images", async () => {
      const mockProduct = {
        _id: "prod-id",
        images: ["img-old"],
      };
      Product.findById.mockResolvedValue(mockProduct);
      Product.findByIdAndUpdate.mockResolvedValue({
        ...mockProduct,
        name: "Test Update",
      });

      await updateProduct(mockReq, mockRes);

      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        "prod-id",
        expect.objectContaining({
          name: "Test Update",
          images: ["img-old"],
          price: 150,
          discountPercent: 0,
          discountPrice: 150,
        }),
        { new: true, runValidators: true },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should update product successfully with removed and added images", async () => {
      mockReq.body.removedImages = ["img-old"];
      mockReq.files = [{ originalname: "file1" }];

      const mockProduct = {
        _id: "prod-id",
        images: ["img-old", "img-keep"],
      };
      Product.findById.mockResolvedValue(mockProduct);
      fileService.deleteFileFromS3ByKey.mockResolvedValue(true);
      fileService.uploadFileToS3.mockResolvedValue("s3-key-new");
      Product.findByIdAndUpdate.mockResolvedValue({
        ...mockProduct,
        name: "Test Update",
      });

      await updateProduct(mockReq, mockRes);

      expect(fileService.deleteFileFromS3ByKey).toHaveBeenCalledWith("img-old");
      expect(fileService.deleteFileFromS3ByKey).toHaveBeenCalledWith(
        "img-keep",
      );
      expect(fileService.uploadFileToS3).toHaveBeenCalledTimes(1);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        "prod-id",
        expect.objectContaining({
          images: ["s3-key-new"],
          price: 150,
          discountPercent: 0,
          discountPrice: 150,
        }),
        { new: true, runValidators: true },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteProduct", () => {
    it("should return 404 if product not found", async () => {
      mockReq.params = { id: "not-exist" };
      Product.findById.mockResolvedValue(null);
      await deleteProduct(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should delete product and its images", async () => {
      mockReq.params = { id: "exist-id" };
      const deletedProduct = {
        _id: "exist-id",
        images: ["img1", "img2"],
      };
      Product.findById.mockResolvedValue(deletedProduct);
      Product.findByIdAndDelete.mockResolvedValue(deletedProduct);

      await deleteProduct(mockReq, mockRes);

      expect(fileService.deleteFileFromS3ByKey).toHaveBeenCalledWith("img1");
      expect(fileService.deleteFileFromS3ByKey).toHaveBeenCalledWith("img2");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: 0 }),
      );
    });
  });
});
