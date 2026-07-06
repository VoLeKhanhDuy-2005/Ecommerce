const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const Category = require("../models/category");
const Product = require("../models/product");
const fileService = require("../services/fileService");

jest.mock("../models/category");
jest.mock("../models/product");
jest.mock("../services/fileService");

describe("Category Controller", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      file: null,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("createCategory", () => {
    it("should return 400 if categoryId or name is missing", async () => {
      await createCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: 1 }),
      );
    });

    it("should return 400 if category already exists", async () => {
      mockReq.body = {
        categoryId: "cat1",
        name: "Category 1",
        imageUrl: "img-url",
      };
      Category.findOne.mockResolvedValue({ categoryId: "cat1" });
      await createCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EM: "Mã danh mục đã tồn tại" }),
      );
    });

    it("should create category successfully with uploaded image", async () => {
      mockReq.body = { categoryId: "cat1", name: "Category 1" };
      mockReq.file = { originalname: "cat1.jpg" };
      Category.findOne.mockResolvedValue(null);
      fileService.deleteOldAndInsertNewImageInS3.mockResolvedValue(
        "s3-img-key",
      );
      const createdCategory = { categoryId: "cat1", name: "Category 1" };
      Category.create.mockResolvedValue(createdCategory);

      await createCategory(mockReq, mockRes);

      expect(fileService.deleteOldAndInsertNewImageInS3).toHaveBeenCalledWith(
        null,
        mockReq.file,
      );
      expect(Category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: "cat1",
          name: "Category 1",
          image: "s3-img-key",
        }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: 0, data: createdCategory }),
      );
    });
  });

  describe("getAllCategories", () => {
    it("should return categories successfully with presigned URLs", async () => {
      const mockCategories = [
        {
          _id: "1",
          image: "img-key",
          toObject: () => ({ image: "img-key", name: "Cat 1" }),
        },
      ];
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories),
      });
      fileService.getImagePresignedUrl.mockResolvedValue("presigned-img-url");

      await getAllCategories(mockReq, mockRes);

      expect(Category.find).toHaveBeenCalledWith({});
      expect(fileService.getImagePresignedUrl).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Cat 1", image: "presigned-img-url" }),
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          EC: 0,
          data: [{ image: "presigned-img-url", name: "Cat 1" }],
        }),
      );
    });
  });

  describe("updateCategory", () => {
    beforeEach(() => {
      mockReq.params = { id: "exist-id" };
      mockReq.body = { categoryId: "cat1", name: "Updated Name" };
    });

    it("should return 404 if category not found", async () => {
      mockReq.params = { id: "not-exist" };
      Category.findById.mockResolvedValue(null);
      await updateCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should update category and image if new file uploaded", async () => {
      mockReq.file = { originalname: "new.jpg" };
      const mockCategory = { _id: "exist-id", image: "old-img" };
      Category.findById.mockResolvedValue(mockCategory);
      fileService.deleteOldAndInsertNewImageInS3.mockResolvedValue(
        "new-img-key",
      );
      Category.findOne.mockResolvedValue(null);
      Category.findByIdAndUpdate.mockResolvedValue({
        ...mockCategory,
        categoryId: "cat1",
        name: "Updated Name",
      });

      await updateCategory(mockReq, mockRes);

      expect(fileService.deleteOldAndInsertNewImageInS3).toHaveBeenCalledWith(
        mockCategory,
        mockReq.file,
      );
      expect(Category.findByIdAndUpdate).toHaveBeenCalledWith(
        "exist-id",
        expect.objectContaining({
          categoryId: "cat1",
          name: "Updated Name",
          image: "new-img-key",
        }),
        { new: true, runValidators: true },
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe("deleteCategory", () => {
    it("should return 404 if category not found", async () => {
      mockReq.params = { id: "not-exist" };
      Category.findById.mockResolvedValue(null);
      await deleteCategory(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("should return 400 if category has active products", async () => {
      mockReq.params = { id: "cat-id" };
      Category.findById.mockResolvedValue({ categoryId: "cat1" });
      Product.countDocuments.mockResolvedValue(5);

      await deleteCategory(mockReq, mockRes);

      expect(Product.countDocuments).toHaveBeenCalledWith({ category: "cat1" });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          EM: expect.stringContaining("Không thể xóa"),
        }),
      );
    });

    it("should delete category successfully if no products exist", async () => {
      mockReq.params = { id: "cat-id" };
      Category.findById.mockResolvedValue({ categoryId: "cat1" });
      Product.countDocuments.mockResolvedValue(0);
      Category.findByIdAndDelete.mockResolvedValue(true);

      await deleteCategory(mockReq, mockRes);

      expect(Category.findByIdAndDelete).toHaveBeenCalledWith("cat-id");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ EC: 0 }),
      );
    });
  });
});
