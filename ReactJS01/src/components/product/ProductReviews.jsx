import React, { useState, useEffect, useContext } from "react";
import {
  Rate,
  Button,
  Input,
  Pagination,
  Avatar,
  notification,
  Spin,
} from "antd";
import { UserOutlined, SendOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/auth.context";
import {
  getProductReviewsApi,
  submitReviewApi,
  deleteReviewApi,
  checkReviewEligibilityApi,
} from "../../util/api";
import dayjs from "dayjs";

const { TextArea } = Input;

const ProductReviews = ({ productId, onReviewAdded }) => {
  const { auth } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);

  const fetchReviews = async (currentPage) => {
    setLoading(true);
    try {
      const res = await getProductReviewsApi(productId, currentPage, 5);
      if (res && res.EC === 0) {
        setReviews(res.data.reviews);
        setTotal(res.data.total);
      }
    } catch (error) {
      console.error("Lỗi lấy đánh giá:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const res = await checkReviewEligibilityApi(productId);
      if (res && res.EC === 0 && res.data) {
        setCanReview(res.data.canReview);
      }
    } catch (error) {
      console.error("Lỗi kiểm tra quyền đánh giá:", error);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews(page);
    }
  }, [productId, page]);

  useEffect(() => {
    if (productId && auth?.isAuthenticated) {
      checkEligibility();
    }
  }, [productId, auth?.isAuthenticated]);

  const handleSubmit = async () => {
    if (!rating) {
      notification.warning({
        message: "Chưa chọn số sao",
        description: "Vui lòng chọn số sao để đánh giá sản phẩm.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitReviewApi(productId, { rating, comment });
      if (res && res.EC === 0) {
        notification.success({
          message: "Đánh giá thành công",
          description: "Cảm ơn bạn đã đánh giá sản phẩm!",
        });
        setRating(0);
        setComment("");
        // Load lại trang 1
        setPage(1);
        fetchReviews(1);
        if (onReviewAdded) onReviewAdded();
      } else {
        notification.error({
          message: "Đánh giá thất bại",
          description: res.EM || "Có lỗi xảy ra.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Đánh giá thất bại",
        description:
          error.response?.data?.EM || "Có lỗi xảy ra khi kết nối server.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) {
      try {
        const res = await deleteReviewApi(productId);
        if (res && res.EC === 0) {
          notification.success({
            message: "Xóa thành công",
          });
          // Nếu xóa ở trang 1 thì load lại, hoặc reload trang hiện tại
          fetchReviews(page);
          if (onReviewAdded) onReviewAdded();
        } else {
          notification.error({
            message: "Xóa thất bại",
            description: res.EM || "Có lỗi xảy ra.",
          });
        }
      } catch (error) {
        notification.error({
          message: "Lỗi kết nối",
          description: "Không thể xóa đánh giá lúc này.",
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 lg:p-10 mb-14">
      <h3 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
        <span className="text-orange-500">★</span> Đánh Giá Sản Phẩm ({total})
      </h3>

      {/* Form đánh giá */}
      {auth.isAuthenticated ? (
        canReview ? (
          <div className="bg-orange-50 rounded-2xl p-5 mb-8 border border-orange-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <span className="font-semibold text-gray-700">
                Chất lượng sản phẩm:
              </span>
              <Rate
                value={rating}
                onChange={setRating}
                className="text-orange-400 text-xl"
              />
            </div>
            <TextArea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé..."
              className="rounded-xl border-orange-200 focus:border-orange-400 hover:border-orange-300 mb-4"
            />
            <div className="flex justify-end">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSubmit}
                loading={submitting}
                className="bg-orange-500 hover:bg-orange-600 border-none rounded-xl h-10 px-6 font-semibold"
              >
                Gửi đánh giá
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200 text-center text-gray-500">
            Bạn chỉ có thể đánh giá sản phẩm sau khi đã mua và nhận hàng thành
            công.
          </div>
        )
      ) : (
        <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200 text-center text-gray-500">
          Vui lòng đăng nhập để đánh giá sản phẩm.
        </div>
      )}

      {/* Danh sách đánh giá */}
      {loading ? (
        <div className="text-center py-10">
          <Spin />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="flex gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0"
            >
              <Avatar
                size={48}
                icon={!review.user?.avatarName ? <UserOutlined /> : null}
                src={
                  review.user?.avatarName
                    ? `${import.meta.env.VITE_BACKEND_URL}/images/avatar/${review.user.avatarName}`
                    : null
                }
                className="bg-gray-200 border-2 border-white shadow-sm flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-gray-800">
                    {review.user?.name || "Người dùng"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {dayjs(review.createdAt).format("DD/MM/YYYY HH:mm")}
                    </span>
                    {auth?.isAuthenticated &&
                      auth?.user?.email === review.user?.email && (
                        <Button
                          type="link"
                          danger
                          size="small"
                          className="p-0 h-auto text-xs"
                          onClick={() => handleDelete()}
                        >
                          Xóa
                        </Button>
                      )}
                  </div>
                </div>
                <Rate
                  disabled
                  defaultValue={review.rating}
                  className="text-orange-400 text-sm mb-2"
                />
                <p className="text-gray-600 text-sm">{review.comment}</p>
              </div>
            </div>
          ))}

          {total > 5 && (
            <div className="flex justify-center mt-6">
              <Pagination
                current={page}
                pageSize={5}
                total={total}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-400">
          Chưa có đánh giá nào cho sản phẩm này.
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
