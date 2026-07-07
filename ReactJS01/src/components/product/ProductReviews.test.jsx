import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductReviews from "./ProductReviews";
import { AuthContext } from "../context/auth.context";
import { vi } from "vitest";

// Mock the API calls
vi.mock("../../util/api", () => ({
  getProductReviewsApi: vi.fn(),
  submitReviewApi: vi.fn(),
  deleteReviewApi: vi.fn(),
}));

import {
  getProductReviewsApi,
  submitReviewApi,
  deleteReviewApi,
} from "../../util/api";

describe("ProductReviews Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    getProductReviewsApi.mockResolvedValue(new Promise(() => {})); // Never resolves to keep loading state

    render(
      <AuthContext.Provider value={{ auth: { isAuthenticated: false } }}>
        <ProductReviews productId="123" />
      </AuthContext.Provider>,
    );

    expect(
      screen.getByRole("heading", { name: /Đánh Giá Sản Phẩm/i }),
    ).toBeInTheDocument();
  });

  it("renders empty state when no reviews", async () => {
    getProductReviewsApi.mockResolvedValue({
      EC: 0,
      data: { reviews: [], total: 0 },
    });

    render(
      <AuthContext.Provider value={{ auth: { isAuthenticated: false } }}>
        <ProductReviews productId="123" />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Chưa có đánh giá nào cho sản phẩm này."),
      ).toBeInTheDocument();
    });
  });

  it("renders reviews correctly", async () => {
    const mockReviews = [
      {
        _id: "1",
        user: { name: "John Doe" },
        rating: 5,
        comment: "Tuyệt vời",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    ];
    getProductReviewsApi.mockResolvedValue({
      EC: 0,
      data: { reviews: mockReviews, total: 1 },
    });

    render(
      <AuthContext.Provider value={{ auth: { isAuthenticated: false } }}>
        <ProductReviews productId="123" />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Tuyệt vời")).toBeInTheDocument();
    });
  });

  it("shows login prompt if not authenticated", async () => {
    getProductReviewsApi.mockResolvedValue({
      EC: 0,
      data: { reviews: [], total: 0 },
    });

    render(
      <AuthContext.Provider value={{ auth: { isAuthenticated: false } }}>
        <ProductReviews productId="123" />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Vui lòng đăng nhập để đánh giá sản phẩm."),
      ).toBeInTheDocument();
    });
  });

  it("shows review form if authenticated", async () => {
    getProductReviewsApi.mockResolvedValue({
      EC: 0,
      data: { reviews: [], total: 0 },
    });

    render(
      <AuthContext.Provider value={{ auth: { isAuthenticated: true } }}>
        <ProductReviews productId="123" />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Chất lượng sản phẩm:")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(
          "Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé...",
        ),
      ).toBeInTheDocument();
    });
  });

  it("shows delete button for user's own review and allows deletion", async () => {
    const mockReviews = [
      {
        _id: "1",
        user: { name: "Test User", email: "test@example.com" },
        rating: 5,
        comment: "Tuyệt vời",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
      {
        _id: "2",
        user: { name: "Other User", email: "other@example.com" },
        rating: 4,
        comment: "Khá tốt",
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    ];
    getProductReviewsApi.mockResolvedValue({
      EC: 0,
      data: { reviews: mockReviews, total: 2 },
    });
    deleteReviewApi.mockResolvedValue({ EC: 0 });

    // Mock window.confirm
    const confirmSpy = vi
      .spyOn(window, "confirm")
      .mockImplementation(() => true);

    render(
      <AuthContext.Provider
        value={{
          auth: { isAuthenticated: true, user: { email: "test@example.com" } },
        }}
      >
        <ProductReviews productId="123" />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument();
    });

    // Chỉ có 1 nút Xóa do chỉ có 1 review của test@example.com
    const deleteButtons = screen.getAllByRole("button", { name: "Xóa" });
    expect(deleteButtons).toHaveLength(1);

    // Click xóa
    const user = userEvent.setup();
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Bạn có chắc chắn muốn xóa đánh giá này?",
    );
    expect(deleteReviewApi).toHaveBeenCalledWith("123");

    confirmSpy.mockRestore();
  });
});
